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

/** Snapshot only the map surface, never this sheet; then blur off the UI thread. */
class SheetBackdrop(context: Context, private val expoContext: AppContext) : ExpoView(context, expoContext) {
  companion object { private val worker = Executors.newSingleThreadExecutor() }
  private val main = Handler(Looper.getMainLooper())
  private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
  private var snapshot: Bitmap? = null
  private var surface: SurfaceView? = null
  private var generation = 0
  private var sheetHost: View? = null
  private var originalBackground: android.graphics.drawable.Drawable? = null
  private val materialBackground = object : android.graphics.drawable.Drawable() {
    override fun draw(canvas: Canvas) {
      val target = sheetHost ?: return
      val radius = 28 * resources.displayMetrics.density
      val clip = Path().apply {
        addRoundRect(RectF(0f, 0f, target.width.toFloat(), target.height.toFloat()),
          floatArrayOf(radius, radius, radius, radius, 0f, 0f, 0f, 0f), Path.Direction.CW)
      }
      canvas.save()
      canvas.clipPath(clip)
      drawMaterial(canvas, target)
      canvas.restore()
    }
    override fun setAlpha(alpha: Int) {}
    override fun setColorFilter(filter: ColorFilter?) {}
    @Deprecated("Deprecated in Java")
    override fun getOpacity(): Int = PixelFormat.TRANSLUCENT
  }
  private fun attachMaterialToSheet() {
    var ancestor = parent
    while (ancestor is View) {
      val params = ancestor.layoutParams as? androidx.coordinatorlayout.widget.CoordinatorLayout.LayoutParams
      if (params?.behavior is com.google.android.material.bottomsheet.BottomSheetBehavior<*>) {
        sheetHost = ancestor
        originalBackground = ancestor.background
        ancestor.background = materialBackground
        return
      }
      ancestor = ancestor.parent
    }
  }
  private fun invalidateMaterial() {
    invalidate()
    materialBackground.invalidateSelf()
  }
  private val lastPosition = intArrayOf(Int.MIN_VALUE, Int.MIN_VALUE)
  private val position = IntArray(2)
  private val followSheet = android.view.ViewTreeObserver.OnPreDrawListener {
    getLocationOnScreen(position)
    if (!position.contentEquals(lastPosition)) {
      position.copyInto(lastPosition)
      invalidateMaterial()
    }
    true
  }
  var light = false
    set(value) { field = value; invalidateMaterial() }
  init { setWillNotDraw(false) }
  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnPreDrawListener(followSheet)
    val ticket = ++generation
    post { attachMaterialToSheet(); capture(ticket, 0) }
    // MapLibre can finish its camera transition/tiles after sheet presentation.
    // Refresh twice while settling; never run a continuous screenshot loop.
    postDelayed({ capture(ticket, 0) }, 500)
    postDelayed({ capture(ticket, 0) }, 1800)
  }
  override fun onDetachedFromWindow() {
    viewTreeObserver.removeOnPreDrawListener(followSheet)
    sheetHost?.let { if (it.background === materialBackground) it.background = originalBackground }
    sheetHost = null
    originalBackground = null
    generation++
    snapshot = null
    surface = null
    super.onDetachedFromWindow()
  }
  private fun findSurface(view: View): SurfaceView? {
    if (view is SurfaceView) return view
    if (view is ViewGroup) for (i in 0 until view.childCount)
      findSurface(view.getChildAt(i))?.let { return it }
    return null
  }
  private fun capture(ticket: Int, attempt: Int) {
    if (ticket != generation || !isAttachedToWindow) return
    val source = expoContext.currentActivity?.window?.decorView?.let(::findSurface)
    fun retry() { if (attempt < 4) postDelayed({ capture(ticket, attempt + 1) }, 100) }
    if (source == null || !source.holder.surface.isValid || source.width <= 0 || source.height <= 0) { retry(); return }
    val bitmap = Bitmap.createBitmap(max(1, source.width / 6), max(1, source.height / 6), Bitmap.Config.ARGB_8888)
    try {
      PixelCopy.request(source, bitmap, { result ->
        if (ticket != generation) return@request
        if (result != PixelCopy.SUCCESS) { retry(); return@request }
        worker.execute {
          val blurred = blurMap(bitmap, max(1, (28 * resources.displayMetrics.density / 6).toInt()))
          main.post { if (ticket == generation) { snapshot = blurred; surface = source; invalidateMaterial() } }
        }
      }, main)
    } catch (_: IllegalArgumentException) { retry() }
  }
  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    if (sheetHost == null) drawMaterial(canvas, this)
  }
  private fun drawMaterial(canvas: Canvas, target: View) {
    snapshot?.let { bitmap ->
      surface?.let { source ->
        val origin = IntArray(2); val position = IntArray(2)
        source.getLocationOnScreen(origin); target.getLocationOnScreen(position)
        val x = (origin[0] - position[0]).toFloat(); val y = (origin[1] - position[1]).toFloat()
        val shader = BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
        shader.setLocalMatrix(Matrix().apply {
          setScale(source.width.toFloat() / bitmap.width, source.height.toFloat() / bitmap.height)
          postTranslate(x, y)
        })
        paint.shader = shader
        canvas.drawRect(0f, 0f, target.width.toFloat(), target.height.toFloat(), paint)
        paint.shader = null
      }
    }
    // The surface color is composed from the actual background and neutral translucent layers.
    canvas.drawColor(Color.argb(if (light) 0 else 55, 0, 0, 0))
    canvas.drawColor(Color.argb(if (light) 220 else 30, 255, 255, 255))
  }
}
