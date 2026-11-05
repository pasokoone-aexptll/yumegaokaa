package jp.yumegaoka.presence

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.os.CancellationSignal
import expo.modules.kotlin.Promise

internal fun readForegroundLocation(activity: Activity, promise: Promise) {
  val fine = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
  val coarse = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
  if (!fine && !coarse) {
    promise.reject("location_permission_required", "位置情報の許可が必要です", null)
    return
  }
  val manager = activity.getSystemService(LocationManager::class.java)
  val provider = when {
    fine && manager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
    manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
    else -> {
      promise.reject("location_unavailable", "位置情報を取得できません", null)
      return
    }
  }
  val signal = CancellationSignal()
  val handler = Handler(Looper.getMainLooper())
  val timeout = Runnable {
    signal.cancel()
    promise.reject("location_timeout", "位置情報の取得がタイムアウトしました", null)
  }
  handler.postDelayed(timeout, 15000)
  try {
    LocationManagerCompat.getCurrentLocation(manager, provider, signal, ContextCompat.getMainExecutor(activity)) { location ->
      handler.removeCallbacks(timeout)
      if (signal.isCanceled) return@getCurrentLocation
      if (location == null || !location.hasAccuracy()) {
        promise.reject("location_unavailable", "位置情報を取得できません", null)
      } else {
        promise.resolve(mapOf("longitude" to location.longitude, "latitude" to location.latitude,
          "accuracy" to location.accuracy.toDouble(), "observed_at" to location.time.toDouble(),
          "elapsed_ms" to location.elapsedRealtimeNanos / 1_000_000.0))
      }
    }
  } catch (error: RuntimeException) {
    handler.removeCallbacks(timeout)
    promise.reject("location_unavailable", "位置情報を取得できません", error)
  }
}
