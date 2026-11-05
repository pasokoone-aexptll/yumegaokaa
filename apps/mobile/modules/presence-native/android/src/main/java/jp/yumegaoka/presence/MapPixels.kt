package jp.yumegaoka.presence

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.max
import kotlin.math.roundToInt

// TextureView has its own compositing layer. Sample it once per history gesture
// so the chat can scroll independently of the map's render thread.
class MapPixels(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var snapshot: Bitmap? = null
  private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
  private val dest = Rect()

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit

  private fun texture(view: View): TextureView? {
    if (view is TextureView && view.isAvailable) return view
    if (view is ViewGroup) for (i in 0 until view.childCount) {
      texture(view.getChildAt(i))?.let { return it }
    }
    return null
  }

  fun showHistory(blurred: Boolean) {
    snapshot = if (blurred) texture(this)?.let {
      val image = it.getBitmap(max(1, it.width / 4), max(1, it.height / 4))
      image?.let { pixels -> blurMap(pixels, max(1, (16 * resources.displayMetrics.density / 4).roundToInt())) }
    } else null
    invalidate()
  }

  override fun dispatchDraw(canvas: Canvas) {
    super.dispatchDraw(canvas)
    snapshot?.let {
      dest.set(0, 0, width, height)
      canvas.drawBitmap(it, null, dest, paint)
    }
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
