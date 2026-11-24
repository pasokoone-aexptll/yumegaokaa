package jp.yumegaoka.presence

import android.content.Context
import android.graphics.*
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.SurfaceView
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.Executors

/** Blur only the map surface behind a live NFC marker, excluding foreground marker views. */
class MarkerBackdrop(context: Context, private val expoContext: AppContext) : ExpoView(context, expoContext) {
  companion object { private val worker = Executors.newSingleThreadExecutor() }
  private val main = Handler(Looper.getMainLooper())
  private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
  private var image: Bitmap? = null
  private var generation = 0
  var point: List<Double> = emptyList()
    set(value) { field = value; val ticket = ++generation; post { capture(ticket, 0) } }
  init { setWillNotDraw(false) }
  override fun onDetachedFromWindow() { generation++; image = null; super.onDetachedFromWindow() }
  override fun onAttachedToWindow() { super.onAttachedToWindow(); val ticket = ++generation; post { capture(ticket, 0) } }
  private fun findSurface(view: View): SurfaceView? {
    if (view is SurfaceView) return view
    if (view is ViewGroup) for (i in 0 until view.childCount) findSurface(view.getChildAt(i))?.let { return it }
    return null
  }
  private fun capture(ticket: Int, attempt: Int) {
    if (ticket != generation || point.size != 2) return
    val surface = expoContext.currentActivity?.window?.decorView?.let(::findSurface)
    if (surface == null || !surface.holder.surface.isValid || width == 0 || height == 0) {
      if (attempt < 5) postDelayed({ capture(ticket, attempt + 1) }, 100)
      return
    }
    val density = resources.displayMetrics.density
    val x = (point[0] * density).toInt(); val y = (point[1] * density).toInt()
    val padding = (16 * density).toInt()
    val region = Rect(x - width / 2 - padding, y - height / 2 - padding, x + width / 2 + padding, y + height / 2 + padding)
    if (!region.intersect(0, 0, surface.width, surface.height)) return
    val legacy = Build.VERSION.SDK_INT < 26
    val bitmap = Bitmap.createBitmap(if (legacy) surface.width else region.width(), if (legacy) surface.height else region.height(), Bitmap.Config.ARGB_8888)
    try {
      val listener = PixelCopy.OnPixelCopyFinishedListener { result ->
        if (ticket != generation) return@OnPixelCopyFinishedListener
        if (result != PixelCopy.SUCCESS) { if (attempt < 5) postDelayed({ capture(ticket, attempt + 1) }, 100); return@OnPixelCopyFinishedListener }
        worker.execute {
          val sample = if (legacy) Bitmap.createBitmap(bitmap, region.left, region.top, region.width(), region.height()) else bitmap
          if (legacy && sample !== bitmap) bitmap.recycle()
          val blurred = blurMap(sample, (8 * density).toInt().coerceAtLeast(1))
          // Retain the actual screen position if the expanded sampling area touches an edge.
          val left = (x - width / 2 - region.left).coerceIn(0, blurred.width - 1)
          val top = (y - height / 2 - region.top).coerceIn(0, blurred.height - 1)
          val crop = Bitmap.createBitmap(blurred, left, top, width.coerceAtMost(blurred.width - left), height.coerceAtMost(blurred.height - top))
          main.post { if (ticket == generation) { image = crop; invalidate() } }
        }
      }
      if (legacy) PixelCopy.request(surface, bitmap, listener, main)
      else PixelCopy.request(surface, region, bitmap, listener, main)
    } catch (_: IllegalArgumentException) { /* Surface can disappear during navigation. */ }
  }
  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    image?.let { canvas.drawBitmap(it, null, Rect(0, 0, width, height), paint) }
    canvas.drawColor(Color.argb(90, 0, 0, 0))
    canvas.drawColor(Color.argb(28, 255, 255, 255))
  }
}
