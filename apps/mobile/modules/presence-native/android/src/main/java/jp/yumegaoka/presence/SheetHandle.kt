package jp.yumegaoka.presence

import android.content.Context
import android.view.ContextThemeWrapper
import com.google.android.material.bottomsheet.BottomSheetDragHandleView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

// Material discovers the enclosing BottomSheetBehavior when attached.
class SheetHandle(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var expanded: Boolean? = null

  fun setExpanded(value: Boolean?) {
    expanded = value
    if (isAttachedToWindow) post { applyDetent() }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    post { applyDetent() }
  }

  private fun applyDetent() {
    val target = expanded ?: return
    var ancestor = parent
    while (ancestor is android.view.View) {
      val params = ancestor.layoutParams as? androidx.coordinatorlayout.widget.CoordinatorLayout.LayoutParams
      val behavior = params?.behavior as? com.google.android.material.bottomsheet.BottomSheetBehavior<*>
      if (behavior != null) {
        behavior.state = if (target) com.google.android.material.bottomsheet.BottomSheetBehavior.STATE_EXPANDED
          else com.google.android.material.bottomsheet.BottomSheetBehavior.STATE_COLLAPSED
        return
      }
      ancestor = ancestor.parent
    }
  }

  override fun dispatchDraw(canvas: android.graphics.Canvas) {
    super.dispatchDraw(canvas)
    val d = resources.displayMetrics.density
    val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
      color = android.graphics.Color.argb(115, 255, 255, 255)
    }
    canvas.drawRoundRect(width / 2f - 28 * d, 5 * d, width / 2f + 28 * d, 9 * d, 2 * d, 2 * d, paint)
  }

  init {
    val themed = ContextThemeWrapper(context, com.google.android.material.R.style.Theme_Material3_Light)
    val handle = BottomSheetDragHandleView(themed)
    handle.imageTintList = android.content.res.ColorStateList.valueOf(android.graphics.Color.TRANSPARENT)
    val d = resources.displayMetrics.density
    handle.setImageDrawable(android.graphics.drawable.GradientDrawable().apply {
      setColor(android.graphics.Color.WHITE); cornerRadius = 2 * d
      setSize((56 * d).toInt(), (4 * d).toInt())
    })
    addView(handle, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }
}
