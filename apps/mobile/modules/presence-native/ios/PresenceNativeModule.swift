import ExpoModulesCore
import CoreLocation
import UIKit

public class PresenceNativeModule: Module {
 public func definition() -> ModuleDefinition {
  Name("PresenceNative")
  Events("onChange")
  View(StreetBackdrop.self) {
   Prop("edge") { (view: StreetBackdrop, value: String) in view.edge = value }
   Prop("active", true) { (view: StreetBackdrop, value: Bool) in view.setActive(value) }
  }
  View(ChatTouchRegion.self) {
   ViewName("ChatTouchRegion")
   Prop("surface", false) { (view: ChatTouchRegion, value: Bool) in view.surface = value }
  }
  AsyncFunction("entrySuccessHaptic") { await MainActor.run {
   let feedback = UINotificationFeedbackGenerator()
   feedback.prepare()
   feedback.notificationOccurred(.success)
  } }
  AsyncFunction("prepareEntrySheet") { await MainActor.run {
   guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first(where: { $0.activationState == .foregroundActive }),
         var controller = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController else { return }
   while let presented = controller.presentedViewController { controller = presented }
   guard let sheet = controller.sheetPresentationController else { return }
   controller.overrideUserInterfaceStyle = .light
   sheet.prefersGrabberVisible = true
   sheet.preferredCornerRadius = 36
   if #available(iOS 16.0, *) {
    sheet.animateChanges { sheet.detents = [.custom(identifier: .init("entry")) { context in context.maximumDetentValue * 0.65 }, .large()] }
   }
   let tag = 809151
   guard controller.view.viewWithTag(tag) == nil else { return }
   let effect: UIVisualEffect
   if #available(iOS 26.0, *) {
    let glass = UIGlassEffect(style: .regular)
    glass.tintColor = UIColor.white.withAlphaComponent(0.85)
    effect = glass
   } else { effect = UIBlurEffect(style: .systemMaterialLight) }
   let backdrop = UIVisualEffectView(effect: effect)
   backdrop.tag = tag
   backdrop.isUserInteractionEnabled = false
   backdrop.frame = controller.view.bounds
   backdrop.autoresizingMask = [.flexibleWidth, .flexibleHeight]
   controller.view.backgroundColor = .clear
   controller.view.insertSubview(backdrop, at: 0)
  } }
  Function("monotonicTime") { PresenceEngine.mono()*1000 }
  AsyncFunction("configure") { [weak self] (url:String,key:String) in
   PrivateHTTPCache.prepareOnce()
   TemporaryImageCleanup.prepareOnce()
   try await APIClient.shared.configure(url:url,key:key)
   await MainActor.run {PresenceEngine.shared.onChange = { [weak self] state in self?.sendEvent("onChange",state)}}
  }
  AsyncFunction("pushSync") { (request:Bool) in try await PushNotifications.shared.sync(request:request) }
  AsyncFunction("pushStatus") { await PushNotifications.shared.current() }
  AsyncFunction("pushOpen") { await PushNotifications.shared.consumeOpen() }
  AsyncFunction("currentLocation") { try await ForegroundLocation.shared.read() }
  AsyncFunction("realtimeToken") { try await APIClient.shared.realtimeToken() }
  AsyncFunction("accountDetails") { try await APIClient.shared.accountDetails() }
  AsyncFunction("changeEmail") { (email:String) in try await APIClient.shared.changeEmail(email) }
  AsyncFunction("verifyEmailChange") { (email:String,code:String) in try await APIClient.shared.verifyEmailChange(email:email,code:code) }
  AsyncFunction("mfaFactors") { try await APIClient.shared.mfaFactors() }
  AsyncFunction("mfaEnroll") { try await APIClient.shared.mfaEnroll() }
  AsyncFunction("mfaVerify") { (factor:String,code:String) in try await APIClient.shared.mfaVerify(factor:factor,code:code) }
  AsyncFunction("session") { await APIClient.shared.session() }
  AsyncFunction("sendOTP") { (email:String) in try await APIClient.shared.sendOTP(email:email) }
  AsyncFunction("verifyOTP") { (email:String,code:String) in try await APIClient.shared.verifyOTP(email:email,code:code) }
  AsyncFunction("rpc") { (operation:String,payload:[String:Any]) in try await APIClient.shared.rpc(operation,payload) }
  AsyncFunction("checkin") { (tag:String) in try await PresenceEngine.shared.checkin(tagID:tag) }
  AsyncFunction("stop") { try await PresenceEngine.shared.stop() }
  AsyncFunction("resume") { await PresenceEngine.shared.resume();return await PresenceEngine.shared.state() }
  AsyncFunction("logout") {
   _ = try? await PresenceEngine.shared.stop()
   await PushNotifications.shared.stop()
   await APIClient.shared.logout()
  }
 }
}


// Separate from the presence observer: recentering never starts a visit or RPC.
@MainActor private final class ForegroundLocation: NSObject, @preconcurrency CLLocationManagerDelegate {
 static let shared = ForegroundLocation()
 private let manager = CLLocationManager()
 private var pending: CheckedContinuation<[String:Double],Error>?
 private var timeout: Task<Void,Never>?
 override private init() { super.init();manager.delegate=self;manager.desiredAccuracy=kCLLocationAccuracyNearestTenMeters }
 func read() async throws -> [String:Double] {
  guard pending == nil else {throw ServiceError(code:"operation_in_progress")}
  return try await withCheckedThrowingContinuation { continuation in
   pending=continuation
   timeout=Task { try? await Task.sleep(nanoseconds:20_000_000_000);if !Task.isCancelled {self.finish(.failure(ServiceError(code:"location_timeout")))} }
   request()
  }
 }
 private func request() {
  guard pending != nil else {return}
  switch manager.authorizationStatus {
  case .notDetermined: manager.requestWhenInUseAuthorization()
  case .authorizedAlways,.authorizedWhenInUse: manager.requestLocation()
  default: finish(.failure(ServiceError(code:"location_permission_required")))
  }
 }
 private func finish(_ result:Result<[String:Double],Error>) {
  let continuation=pending;pending=nil;timeout?.cancel();timeout=nil;manager.stopUpdatingLocation()
  continuation?.resume(with:result)
 }
 func locationManagerDidChangeAuthorization(_ manager:CLLocationManager){request()}
 func locationManager(_ manager:CLLocationManager,didFailWithError error:Error){finish(.failure(ServiceError(code:"location_unavailable")))}
 func locationManager(_ manager:CLLocationManager,didUpdateLocations locations:[CLLocation]){
  guard let l=locations.last,l.horizontalAccuracy>=0,abs(l.timestamp.timeIntervalSinceNow)<=15 else {return}
  finish(.success(["longitude":l.coordinate.longitude,"latitude":l.coordinate.latitude,"accuracy":l.horizontalAccuracy,"observed_at":l.timestamp.timeIntervalSince1970*1000]))
 }
}
