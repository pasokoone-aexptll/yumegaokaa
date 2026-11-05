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
    Events("onChange")
    View(SheetHandle::class) { Name("SheetHandle") }
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
