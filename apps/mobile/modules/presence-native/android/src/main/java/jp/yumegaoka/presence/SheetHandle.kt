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

  init {
    val themed = ContextThemeWrapper(context, com.google.android.material.R.style.Theme_Material3_Light)
    addView(BottomSheetDragHandleView(themed), LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }
}
