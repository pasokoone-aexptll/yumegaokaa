package jp.yumegaoka.presence

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.util.Collections
import java.util.WeakHashMap
import java.util.concurrent.Executors
import kotlin.math.max
import kotlin.math.roundToInt

// Read the map texture once after camera movement. All glass controls share
// this image instead of asking HWUI to replay the live map into each blur.
class MapPixels(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  companion object {
    private val worker = Executors.newSingleThreadExecutor()
    private val overlays = Collections.newSetFromMap(WeakHashMap<MapBackdrop, Boolean>())
    private var source: MapPixels? = null
    fun attach(view: MapBackdrop) { overlays.add(view) }
    fun detach(view: MapBackdrop) { overlays.remove(view) }
    fun drawBackdrop(view: MapBackdrop, canvas: Canvas) = source?.drawSample(view, canvas)
  }

  private var snapshot: Bitmap? = null
  private var history = false
  private var busy = false
  private var pending = false
  private var attempts = 0
  private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
  private val dest = Rect()
  private val origin = IntArray(2)
  private val target = IntArray(2)
  private val refresh = Runnable { capture() }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    source = this
    refreshSoon()
  }

  override fun onDetachedFromWindow() {
    removeCallbacks(refresh)
    if (source === this) source = null
    snapshot = null
    overlays.forEach { it.invalidate() }
    super.onDetachedFromWindow()
  }

  private fun drawSample(view: View, canvas: Canvas) {
    val bitmap = snapshot ?: return
    getLocationOnScreen(origin)
    view.getLocationOnScreen(target)
    val x = origin[0] - target[0]
    val y = origin[1] - target[1]
    dest.set(x, y, x + width, y + height)
    canvas.drawBitmap(bitmap, null, dest, paint)
  }

  fun refreshSoon() {
    attempts = 0
    removeCallbacks(refresh)
    postDelayed(refresh, 100)
  }

  private fun capture() {
    if (!isAttachedToWindow) return
    if (busy) { pending = true; return }
    val surface = texture(this)
    val image = surface?.takeIf { it.width > 0 && it.height > 0 }?.let {
      it.getBitmap(max(1, it.width / 4), max(1, it.height / 4))
    }
    if (image == null) {
      if (++attempts <= 4) postDelayed(refresh, 180)
      return
    }
    busy = true
    val radius = max(1, (16 * resources.displayMetrics.density / 4).roundToInt())
    worker.execute {
      val filtered = blurMap(image, radius)
      android.os.Handler(android.os.Looper.getMainLooper()).post {
        busy = false
        if (source === this && isAttachedToWindow) {
          snapshot = filtered
          overlays.forEach { it.invalidate() }
          invalidate()
          if (pending) { pending = false; refreshSoon() }
        }
      }
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit

  private fun texture(view: View): TextureView? {
    if (view is TextureView && view.isAvailable) return view
    if (view is ViewGroup) for (i in 0 until view.childCount) {
      texture(view.getChildAt(i))?.let { return it }
    }
    return null
  }

  fun showHistory(blurred: Boolean) {
    history = blurred
    if (blurred && snapshot == null) refreshSoon()
    invalidate()
  }

  override fun dispatchDraw(canvas: Canvas) {
    super.dispatchDraw(canvas)
    if (history) snapshot?.let {
      dest.set(0, 0, width, height)
      canvas.drawBitmap(it, null, dest, paint)
    }
  }
}


class MapBackdrop(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  var tint: String? = null
    set(value) { field = value; invalidate() }
  var intensity = 30
    set(value) { field = value; invalidate() }
  init { setWillNotDraw(false) }
  override fun onAttachedToWindow() { super.onAttachedToWindow(); MapPixels.attach(this) }
  override fun onDetachedFromWindow() { MapPixels.detach(this); super.onDetachedFromWindow() }
  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    MapPixels.drawBackdrop(this, canvas)
    val alpha = (intensity * 0.8f).toInt().coerceIn(0, 100)
    val gray = if (tint == "light") 255 else 0
    canvas.drawColor(Color.argb(alpha, gray, gray, gray))
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
