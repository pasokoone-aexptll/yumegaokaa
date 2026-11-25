import ExpoModulesCore
import CoreLocation
import UIKit

public class PresenceNativeModule: Module {
 public func definition() -> ModuleDefinition {
  Name("PresenceNative")
  Function("isSimulator") { () -> Bool in
   #if targetEnvironment(simulator)
   return true
   #else
   return false
   #endif
  }
  Events("onChange")
  View(StreetBackdrop.self) {
   Prop("edge") { (view: StreetBackdrop, value: String) in view.edge = value }
   Prop("active", true) { (view: StreetBackdrop, value: Bool) in view.setActive(value) }
  }
  View(NativeSheetAppearance.self) { ViewName("NativeSheetAppearance") }
  View(SheetBackdrop.self) { ViewName("SheetBackdrop") }
  View(CityParticipationSwitch.self) {
   ViewName("CityParticipationSwitch")
   Events("onValueChange")
   Prop("value", false) { (view: CityParticipationSwitch, value: Bool) in view.setValue(value) }
  }
  View(ChatTouchRegion.self) {
   ViewName("ChatTouchRegion")
   Prop("surface", false) { (view: ChatTouchRegion, value: Bool) in view.surface = value }
  }
  View(ChatIMEInput.self) {
   ViewName("ChatIMEInput")
   Events("onTextChange")
   Prop("textState") { (view:ChatIMEInput, value:[String:Any]) in view.setTextState(value) }
   Prop("placeholder") { (view:ChatIMEInput, value:String) in view.setPlaceholder(value) }
   Prop("editable", true) { (view:ChatIMEInput, value:Bool) in view.setEditable(value) }
   Prop("maxLength", 500) { (view:ChatIMEInput, value:Int) in view.maxLength=value }
   Prop("inputLabel") { (view:ChatIMEInput, value:String) in view.setLabel(value) }
  }
  AsyncFunction("pickEventDate") { [weak self] (title: String, milliseconds: Double, promise: Promise) in
   Task { @MainActor in
    guard let presenter = self?.appContext?.utilities?.currentViewController(),
          !presenter.isBeingDismissed,
          !((presenter as? UINavigationController)?.topViewController is EventDateSheet)
    else { promise.resolve(nil as Double?); return }
    EventDateSheet(title: title, milliseconds: milliseconds) { promise.resolve($0) }.present(from: presenter)
   }
  }.runOnQueue(.main)
  AsyncFunction("selectionHaptic") { await MainActor.run {
   let feedback = UIImpactFeedbackGenerator(style: .light)
   feedback.prepare()
   feedback.impactOccurred()
  } }
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
  AsyncFunction("sendOTP") { (email:String, createAccount:Bool?) in try await APIClient.shared.sendOTP(email:email,createAccount:createAccount ?? true) }
  AsyncFunction("reviewPassword") { (email:String,password:String) in try await APIClient.shared.reviewPassword(email:email,password:password) }
  AsyncFunction("verifyOTP") { (email:String,code:String) in try await APIClient.shared.verifyOTP(email:email,code:code) }
  AsyncFunction("rpc") { (operation:String,payload:[String:Any]) in try await APIClient.shared.rpc(operation,payload) }
  AsyncFunction("checkin") { (tag:String) in try await PresenceEngine.shared.checkin(tagID:tag) }
  AsyncFunction("setGhost") { (ghost:Bool) in try await PresenceEngine.shared.setGhost(ghost) }
  AsyncFunction("stop") { try await PresenceEngine.shared.stop() }
  AsyncFunction("resume") { await PresenceEngine.shared.resume();return await PresenceEngine.shared.state() }
  AsyncFunction("logout") {
   _ = try? await PresenceEngine.shared.stop()
   await PushNotifications.shared.stop()
   await APIClient.shared.logout()
  }
 }
}


// Keep UIKit's switch, thumb, gestures and accessibility. Fit the outline to
// the control itself, rather than SwiftUI's invisible label/layout container.
final class CityParticipationSwitch: ExpoView {
 let onValueChange = EventDispatcher()
 private let control = UISwitch()
 private let outline = UIView()
 private var confirmedValue = false
 required init(appContext: AppContext? = nil) {
  super.init(appContext: appContext)
  outline.isUserInteractionEnabled = false
  outline.layer.cornerCurve = .circular
  addSubview(outline)
  control.onTintColor = UIColor(red: 0.204, green: 0.780, blue: 0.349, alpha: 1)
  control.overrideUserInterfaceStyle = .dark
  control.accessibilityLabel = "街への参加"
  control.addTarget(self, action: #selector(changed), for: .valueChanged)
  addSubview(control)
  updateOutline()
 }
 override func layoutSubviews() {
  super.layoutSubviews()
  let size = control.sizeThatFits(.zero)
  control.bounds = CGRect(origin: .zero, size: size)
  control.center = CGPoint(x: bounds.midX, y: bounds.midY)
  outline.frame = control.frame.insetBy(dx: -4, dy: -4)
  outline.layer.cornerRadius = outline.bounds.height / 2
 }
 func setValue(_ value: Bool) {
  confirmedValue = value
  control.setOn(value, animated: window != nil && !UIAccessibility.isReduceMotionEnabled)
  updateOutline()
 }
 private func updateOutline() {
  outline.backgroundColor = confirmedValue
   ? UIColor(red: 0.271, green: 0.898, blue: 0.443, alpha: 1)
   : UIColor.white.withAlphaComponent(0.15)
 }
 @objc private func changed() {
  let requested = control.isOn
  // Only a confirmed visit changes participation; opening NFC is an intent.
  control.setOn(confirmedValue, animated: true)
  onValueChange(["value": requested])
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
