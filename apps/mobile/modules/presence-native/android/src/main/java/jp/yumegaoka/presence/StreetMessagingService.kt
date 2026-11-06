package jp.yumegaoka.presence

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class StreetMessagingService : FirebaseMessagingService() {
  override fun onMessageReceived(message: RemoteMessage) {
    val notice = message.notification ?: return
    if (message.data["yumegaoka_open"] != "notifications") return
    if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
    val manager = getSystemService(NotificationManager::class.java)
    ensureStreetNotificationChannel(this)
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return
    launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    launch.putExtra("yumegaoka_open", "notifications")
    val open = PendingIntent.getActivity(this, 1, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    manager.notify(notice.tag ?: message.messageId, 1, NotificationCompat.Builder(this, STREET_CHANNEL)
      .setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle(notice.title)
      .setContentText(notice.body).setContentIntent(open).setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH).build())
  }
}

private const val STREET_CHANNEL = "street_notices"

internal fun ensureStreetNotificationChannel(context: Context) {
  if (Build.VERSION.SDK_INT >= 26) {
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(STREET_CHANNEL, "街のお知らせ", NotificationManager.IMPORTANCE_HIGH))
  }
}
