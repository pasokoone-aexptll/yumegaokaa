package jp.yumegaoka.presence

import android.content.Context
import android.view.ContextThemeWrapper
import com.google.android.material.bottomsheet.BottomSheetDragHandleView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

// Material discovers the enclosing BottomSheetBehavior when attached.
class SheetHandle(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  init {
    val themed = ContextThemeWrapper(context, com.google.android.material.R.style.Theme_Material3_Light)
    addView(BottomSheetDragHandleView(themed), LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }
}
