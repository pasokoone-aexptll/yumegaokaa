import ExpoModulesCore
import UIKit

// Reject whitespace before UIScrollView starts its pan recognizer. Returning nil
// lets UIKit hit-test the map underneath, including two-finger pinch gestures.
final class ChatTouchRegion: ExpoView {
  var surface = false
  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    guard let hit = super.hitTest(point, with: event) else { return nil }
    guard surface else { return hit }
    var ancestor: UIView? = hit
    while let view = ancestor, view !== self {
      if let region = view as? ChatTouchRegion, !region.surface { return hit }
      ancestor = view.superview
    }
    return nil
  }
}
