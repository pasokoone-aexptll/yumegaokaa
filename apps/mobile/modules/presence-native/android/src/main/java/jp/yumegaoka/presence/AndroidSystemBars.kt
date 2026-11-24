package jp.yumegaoka.presence

import android.app.Activity
import android.graphics.Color
import android.os.Build
import androidx.core.view.WindowCompat

/** Backgrounds reach the window edges; React Native retains the control insets. */
@Suppress("DEPRECATION")
internal fun applyAndroidSystemBars(activity: Activity, darkNavigation: Boolean) {
  activity.runOnUiThread {
    val window = activity.window
    WindowCompat.setDecorFitsSystemWindows(window, false)
    window.statusBarColor = Color.TRANSPARENT
    // API 24/25 have only white navigation icons; keep a translucent contrast layer there.
    window.navigationBarColor = if (Build.VERSION.SDK_INT >= 26 || darkNavigation)
      Color.TRANSPARENT else Color.argb(110, 0, 0, 0)
    if (Build.VERSION.SDK_INT >= 29) {
      window.isNavigationBarContrastEnforced = false
      window.isStatusBarContrastEnforced = false
    }
    WindowCompat.getInsetsController(window, window.decorView).isAppearanceLightNavigationBars = !darkNavigation
  }
}
