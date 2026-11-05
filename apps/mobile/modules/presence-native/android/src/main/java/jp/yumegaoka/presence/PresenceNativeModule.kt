package jp.yumegaoka.presence

import android.app.NotificationManager
import com.google.firebase.messaging.FirebaseMessaging
import expo.modules.kotlin.Promise
import android.os.SystemClock
import android.view.HapticFeedbackConstants
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PresenceNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PresenceNative")
    Events("onChange", "onVisitFix")
    OnCreate {
      VisitLocationService.onFix = { visit, location ->
        sendEvent("onVisitFix", mapOf("visit" to visit, "longitude" to location.longitude,
          "latitude" to location.latitude, "accuracy" to location.accuracy.toDouble(),
          "elapsed" to location.elapsedRealtimeNanos / 1_000_000.0))
      }
    }
    OnDestroy {
      VisitLocationService.onFix = null
      appContext.reactContext?.let { it.stopService(android.content.Intent(it, VisitLocationService::class.java)) }
    }
    AsyncFunction("observeVisit") { visit: String, remainingMs: Double ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      if (remainingMs <= 0) return@AsyncFunction false
      if (VisitLocationService.activeVisit != visit && appContext.currentActivity?.hasWindowFocus() != true)
        return@AsyncFunction false
      if (androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION)
          != android.content.pm.PackageManager.PERMISSION_GRANTED) return@AsyncFunction false
      androidx.core.content.ContextCompat.startForegroundService(context, android.content.Intent(context, VisitLocationService::class.java)
        .putExtra("visit", visit).putExtra("deadline", SystemClock.elapsedRealtime() + remainingMs.toLong().coerceAtMost(10800000L)))
      true
    }
    AsyncFunction("stopObserving") {
      appContext.reactContext?.let { it.stopService(android.content.Intent(it, VisitLocationService::class.java)) }
      Unit
    }
    View(HistoryBlur::class) { Name("HistoryBlur") }
    View(SheetHandle::class) {
      Name("SheetHandle")
      Prop("expanded") { view: SheetHandle, expanded: Boolean? -> view.setExpanded(expanded) }
    }
    View(ChatTouchRegion::class) {
      Name("ChatTouchRegion")
      Prop("surface") { view: ChatTouchRegion, surface: Boolean -> view.surface = surface }
    }
    AsyncFunction("pushAllowed") {
      appContext.reactContext?.getSystemService(NotificationManager::class.java)?.areNotificationsEnabled() == true
    }
    AsyncFunction("pushToken") { promise: Promise ->
      FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
        if (task.isSuccessful) promise.resolve(task.result)
        else promise.reject("push_token_failed", "通知端末の登録に失敗しました", task.exception)
      }
    }
    AsyncFunction("pushOpen") {
      val intent = appContext.currentActivity?.intent
      val opened = intent?.getStringExtra("yumegaoka_open") == "notifications"
      if (opened) intent?.removeExtra("yumegaoka_open")
      opened
    }
    AsyncFunction("currentLocation") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) promise.reject("location_unavailable", "位置情報を取得できません", null)
      else activity.runOnUiThread { readForegroundLocation(activity, promise) }
    }
    Function("monotonicTime") { SystemClock.elapsedRealtime().toDouble() }
    AsyncFunction("selectionHaptic") { haptic(HapticFeedbackConstants.CLOCK_TICK) }
    AsyncFunction("entrySuccessHaptic") { haptic(HapticFeedbackConstants.LONG_PRESS) }
  }

  private fun haptic(effect: Int) {
    val activity = appContext.currentActivity ?: return
    activity.runOnUiThread { activity.window.decorView.performHapticFeedback(effect) }
  }
}
