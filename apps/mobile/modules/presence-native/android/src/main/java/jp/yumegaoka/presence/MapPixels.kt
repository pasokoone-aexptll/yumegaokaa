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
    val stride = 24 * resources.displayMetrics.density
    snapshot = if (blurred) texture(this)?.let {
      it.getBitmap(max(1, (it.width / stride).toInt()), max(1, (it.height / stride).toInt()))
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
