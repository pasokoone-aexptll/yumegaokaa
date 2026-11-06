package jp.yumegaoka.presence

import android.annotation.SuppressLint
import android.app.*
import android.content.Intent
import android.location.*
import android.os.*

/** Started by the visible app for a specific writable visit. No persistent raw fixes. */
class VisitLocationService : Service(), LocationListener {
  companion object {
    @Volatile var onFix: ((String, Location) -> Unit)? = null
    @Volatile var activeVisit: String? = null
  }
  private val manager by lazy { getSystemService(LocationManager::class.java) }
  private val handler = Handler(Looper.getMainLooper())
  private val expire = Runnable { stopSelf() }
  private var deadline = 0L
  private var owningVisit: String? = null

  @SuppressLint("MissingPermission")
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val visit = intent?.getStringExtra("visit")
    if (visit == null || onFix == null) { stopSelf(); return START_NOT_STICKY }
    val channel = "street_presence"
    if (Build.VERSION.SDK_INT >= 26) {
      getSystemService(NotificationManager::class.java).createNotificationChannel(
        NotificationChannel(channel, "街での位置更新", NotificationManager.IMPORTANCE_LOW))
    }
    startForeground(2711, androidx.core.app.NotificationCompat.Builder(this, channel)
      .setSmallIcon(android.R.drawable.ic_menu_mylocation)
      .setContentTitle("夢ヶ丘で入街中").setContentText("街の範囲と気配を更新しています")
      .setOngoing(true).build())
    val nextDeadline = intent.getLongExtra("deadline", 0L)
    handler.removeCallbacks(expire)
    handler.postDelayed(expire, (nextDeadline - SystemClock.elapsedRealtime()).coerceAtLeast(0))
    deadline = nextDeadline
    if (owningVisit == visit) return START_NOT_STICKY
    owningVisit = visit
    try {
      // Consume one stream so a coarse network fix cannot repeatedly interrupt
      // the two-fix outside confirmation between accurate GPS samples.
      val providers = if (Build.VERSION.SDK_INT >= 31 &&
        manager.isProviderEnabled(LocationManager.FUSED_PROVIDER)) {
        listOf(LocationManager.FUSED_PROVIDER)
      } else {
        listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
          .filter { manager.isProviderEnabled(it) }.take(1)
      }
      if (providers.isEmpty()) { stopSelf(); return START_NOT_STICKY }
      for (provider in providers) {
        if (Build.VERSION.SDK_INT >= 31) {
          val request = LocationRequest.Builder(30000)
            .setQuality(LocationRequest.QUALITY_HIGH_ACCURACY).build()
          manager.requestLocationUpdates(provider, request, mainExecutor, this)
        } else manager.requestLocationUpdates(provider, 30000, 0f, this)
      }
      activeVisit = visit
    } catch (_: SecurityException) { stopSelf() }
    return START_NOT_STICKY
  }

  override fun onLocationChanged(location: Location) {
    if (SystemClock.elapsedRealtime() >= deadline || onFix == null) { stopSelf(); return }
    if (location.hasAccuracy()) owningVisit?.let { onFix?.invoke(it, location) }
  }
  override fun onProviderEnabled(provider: String) {}
  override fun onProviderDisabled(provider: String) {}
  @Deprecated("Legacy location callback")
  override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
  override fun onDestroy() {
    activeVisit = null
    handler.removeCallbacks(expire)
    manager.removeUpdates(this)
    super.onDestroy()
  }
  override fun onBind(intent: Intent?) = null
}
