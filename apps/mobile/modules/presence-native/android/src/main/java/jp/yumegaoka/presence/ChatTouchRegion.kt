package jp.yumegaoka.presence

import android.content.Context
import android.graphics.Rect
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class ChatTouchRegion(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  var surface = false

  // Fabric sets each React child's bounds. LinearLayout would reposition the
  // author and body side by side during Android's next layout pass.
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
  }

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (surface && event.actionMasked == MotionEvent.ACTION_DOWN &&
        !containsMessage(this, event.rawX.toInt(), event.rawY.toInt())) return false
    return super.dispatchTouchEvent(event)
  }

  private fun containsMessage(view: View, x: Int, y: Int): Boolean {
    if (view is ChatTouchRegion && !view.surface) {
      val visible = Rect()
      return view.getGlobalVisibleRect(visible) && visible.contains(x, y)
    }
    return view is ViewGroup && (0 until view.childCount).any { containsMessage(view.getChildAt(it), x, y) }
  }
}
