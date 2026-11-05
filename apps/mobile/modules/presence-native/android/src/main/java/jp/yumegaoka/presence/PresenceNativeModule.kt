package jp.yumegaoka.presence

import android.os.SystemClock
import android.view.HapticFeedbackConstants
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PresenceNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PresenceNative")
    Events("onChange")
    Function("monotonicTime") { SystemClock.elapsedRealtime().toDouble() }
    AsyncFunction("selectionHaptic") { haptic(HapticFeedbackConstants.CLOCK_TICK) }
    AsyncFunction("entrySuccessHaptic") { haptic(HapticFeedbackConstants.LONG_PRESS) }
  }

  private fun haptic(effect: Int) {
    val activity = appContext.currentActivity ?: return
    activity.runOnUiThread { activity.window.decorView.performHapticFeedback(effect) }
  }
}
