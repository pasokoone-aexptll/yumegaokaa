package jp.yumegaoka.presence

import android.content.Context
import android.graphics.*
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.SurfaceView
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.Executors
import kotlin.math.max
import kotlin.math.roundToInt

// This overlay exists only during expanded chat. Sample the map once, never
// the chat or keyboard. Ignore a late copy if the overlay has already closed.
class HistoryBlur(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  companion object { private val worker = Executors.newSingleThreadExecutor() }
  private val main = Handler(Looper.getMainLooper())
  private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
  private val bounds = Rect()
  private var snapshot: Bitmap? = null
  private var generation = 0
  init { setWillNotDraw(false) }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val ticket = ++generation
    post { capture(ticket, 0) }
  }

  override fun onDetachedFromWindow() {
    generation++
    snapshot = null
    super.onDetachedFromWindow()
  }

  private fun capture(ticket: Int, retries: Int) {
    if (ticket != generation || !isAttachedToWindow) return
    val surface = (parent as? ViewGroup)?.let { findSurface(it) }
    fun retry() {
      if (retries < 2 && ticket == generation) postDelayed({ capture(ticket, retries + 1) }, 80)
    }
    if (surface == null || !surface.holder.surface.isValid || surface.width <= 0 || surface.height <= 0) {
      retry()
      return
    }
    val image = Bitmap.createBitmap(max(1, surface.width / 6), max(1, surface.height / 6), Bitmap.Config.ARGB_8888)
    val radius = max(1, (16 * resources.displayMetrics.density / 6).roundToInt())
    try {
      PixelCopy.request(surface, image, { result ->
        if (ticket != generation) return@request
        if (result != PixelCopy.SUCCESS) { retry(); return@request }
        worker.execute {
          val filtered = blurMap(image, radius)
          main.post { if (generation == ticket) { snapshot = filtered; invalidate() } }
        }
      }, main)
    } catch (_: IllegalArgumentException) { retry() }
  }

  private fun findSurface(view: View): SurfaceView? {
    if (view is SurfaceView) return view
    if (view is ViewGroup) for (i in 0 until view.childCount)
      findSurface(view.getChildAt(i))?.let { return it }
    return null
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    bounds.set(0, 0, width, height)
    snapshot?.let { canvas.drawBitmap(it, null, bounds, paint) }
  }
}

// Three box passes approximate a Gaussian. Filter before scaling up, and
// extend the edge pixels so the blur covers the entire viewport.
private fun blurMap(image: Bitmap, radius: Int): Bitmap {
  val w = image.width
  val h = image.height
  val pixels = IntArray(w * h)
  val scratch = IntArray(pixels.size)
  image.getPixels(pixels, 0, w, 0, 0, w, h)
  repeat(3) {
    for (y in 0 until h) blurLine(pixels, scratch, y * w, 1, w, radius)
    for (x in 0 until w) blurLine(scratch, pixels, x, w, h, radius)
  }
  image.setPixels(pixels, 0, w, 0, 0, w, h)
  return image
}

private fun blurLine(input: IntArray, output: IntArray, start: Int, stride: Int, length: Int, radius: Int) {
  val count = 2 * radius + 1
  var red = 0
  var green = 0
  var blue = 0
  fun accumulate(position: Int, sign: Int) {
    val pixel = input[start + position.coerceIn(0, length - 1) * stride]
    red += sign * ((pixel ushr 16) and 255)
    green += sign * ((pixel ushr 8) and 255)
    blue += sign * (pixel and 255)
  }
  for (i in -radius..radius) accumulate(i, 1)
  for (i in 0 until length) {
    output[start + i * stride] = android.graphics.Color.rgb(red / count, green / count, blue / count)
    accumulate(i - radius, -1)
    accumulate(i + radius + 1, 1)
  }
}
