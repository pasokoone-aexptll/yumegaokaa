import ExpoModulesCore
import UserNotifications
import UIKit

// OS consent and tokens stay in the native layer; no device token is exposed to JS.
@MainActor final class PushNotifications: NSObject, UNUserNotificationCenterDelegate {
 static let shared = PushNotifications()
 private var generation = 0
 private var enabled = false
 private var openPending = false
 private var status = "disabled"
 private var registration: Task<Void,Never>?
 private var environment: String? {
  guard let value = Bundle.main.object(forInfoDictionaryKey:"YumegaokaPushEnvironment") as? String,
        ["sandbox","production"].contains(value) else { return nil }
  return value
 }
 func prepare() { UNUserNotificationCenter.current().delegate = self }
 func sync(request: Bool) async throws -> String {
  guard environment != nil else { return "unavailable" }
  prepare()
  let revision = generation
  var settings = await UNUserNotificationCenter.current().notificationSettings()
  if request && settings.authorizationStatus == .notDetermined {
   _ = try await UNUserNotificationCenter.current().requestAuthorization(options:[.alert,.sound,.badge])
   settings = await UNUserNotificationCenter.current().notificationSettings()
  }
  guard revision == generation else { return "disabled" }
  guard [.authorized,.provisional,.ephemeral].contains(settings.authorizationStatus) else {
   enabled = false
   if settings.authorizationStatus == .denied {
    _ = try await APIClient.shared.pushRegistration("remove")
   }
   status = settings.authorizationStatus == .denied ? "denied" : "disabled"
   return status
  }
  enabled = true
  status = "registering"
  UIApplication.shared.registerForRemoteNotifications()
  Task {
   try? await Task.sleep(nanoseconds:20_000_000_000)
   if revision == generation && status == "registering" { status = "error" }
  }
  return status
 }
 func registered(_ data: Data) {
  guard enabled, let environment else { return }
  let revision = generation
  let token = data.map { String(format:"%02x",$0) }.joined()
  registration?.cancel()
  registration = Task {
   do {
    guard !Task.isCancelled, revision == generation, enabled else { return }
    _ = try await APIClient.shared.pushRegistration("register",["environment":environment,"token":token])
    guard revision == generation else { return }
    status = "registered"
   } catch { if revision == generation { status = "error" } }
  }
 }
 func failed() { if enabled { status = "error" } }
 func current() -> String { environment == nil ? "unavailable" : status }
 func stop() {
  generation += 1; enabled = false; registration?.cancel(); registration = nil
  openPending = false; status = "disabled"
  UIApplication.shared.unregisterForRemoteNotifications()
 }
 func consumeOpen() -> Bool { let value = openPending; openPending = false; return value }
 nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
  didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
  // Open the authenticated inbox, never an arbitrary payload URL or private event data.
  Task { @MainActor in self.openPending = true; completionHandler() }
 }
 nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
  willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
  completionHandler([.banner,.sound])
 }
}

public class PushAppDelegateSubscriber: ExpoAppDelegateSubscriber {
 public func subscriberDidRegister() { PushNotifications.shared.prepare() }
 public func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  PushNotifications.shared.registered(deviceToken)
 }
 public func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
  PushNotifications.shared.failed()
 }
}
