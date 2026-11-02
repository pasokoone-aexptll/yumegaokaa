import ExpoModulesCore
import UIKit

// The mask belongs to UIVisualEffectView itself, never its ancestor.
final class StreetBackdrop: ExpoView {
  private let effect = UIVisualEffectView(effect: UIBlurEffect(style: .systemMaterialDark))
  private let maskSurface = UIImageView()
  private var maskSize = CGSize.zero
  private var maskEdge = ""
  var edge = "bottom" { didSet { setNeedsLayout() } }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    isUserInteractionEnabled = false
    backgroundColor = .clear
    addSubview(effect)
  }

  func setActive(_ active: Bool) {
    guard window != nil else {
      effect.effect = active ? UIBlurEffect(style: .systemMaterialDark) : nil
      return
    }
    UIView.animate(withDuration: 0.24, delay: 0, options: [.beginFromCurrentState, .allowUserInteraction]) {
      self.effect.effect = active ? UIBlurEffect(style: .systemMaterialDark) : nil
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    effect.frame = bounds
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    maskSurface.frame = bounds
    if edge == "solid" {
      effect.mask = nil
    } else if bounds.width > 0 && bounds.height > 0 {
      // UIKit copies an effect mask. An image mask gives it actual alpha pixels,
      // rather than relying on a sublayer tree surviving that copy.
      if maskSize != bounds.size || maskEdge != edge {
        let renderer = UIGraphicsImageRenderer(size: bounds.size)
        maskSurface.image = renderer.image { context in
          let colors = [UIColor.clear.cgColor, UIColor.white.withAlphaComponent(0.65).cgColor, UIColor.white.cgColor] as CFArray
          let locations: [CGFloat] = [0, 0.5, 1]
          guard let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: locations) else { return }
          context.cgContext.drawLinearGradient(gradient,
            start: CGPoint(x: 0, y: edge == "top" ? bounds.height : 0),
            end: CGPoint(x: 0, y: edge == "top" ? 0 : bounds.height),
            options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
        }
        maskSize = bounds.size
        maskEdge = edge
      }
      effect.mask = nil
      effect.mask = maskSurface
    }
    CATransaction.commit()
  }
}
