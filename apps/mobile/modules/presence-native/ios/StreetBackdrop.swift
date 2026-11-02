import ExpoModulesCore
import UIKit

// The mask belongs to UIVisualEffectView itself, never its ancestor.
final class StreetBackdrop: ExpoView {
  private let effect = UIVisualEffectView(effect: UIBlurEffect(style: .systemMaterialDark))
  private let maskSurface = UIView()
  private let gradient = CAGradientLayer()
  var edge = "bottom" { didSet { setNeedsLayout() } }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    isUserInteractionEnabled = false
    backgroundColor = .clear
    addSubview(effect)
    maskSurface.layer.addSublayer(gradient)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    effect.frame = bounds
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    maskSurface.frame = bounds
    gradient.frame = maskSurface.bounds
    if edge == "solid" {
      effect.mask = nil
    } else {
      gradient.colors = [UIColor.clear.cgColor, UIColor.white.withAlphaComponent(0.25).cgColor, UIColor.white.cgColor]
      gradient.locations = [0, 0.5, 1]
      gradient.startPoint = CGPoint(x: 0.5, y: edge == "top" ? 1 : 0)
      gradient.endPoint = CGPoint(x: 0.5, y: edge == "top" ? 0 : 1)
      effect.mask = nil
      effect.mask = maskSurface
    }
    CATransaction.commit()
  }
}
