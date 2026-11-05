import UIKit

@MainActor
final class EventDateSheet: UIViewController, UISheetPresentationControllerDelegate {
  private let backdrop = UIVisualEffectView(effect: nil)
  private let picker = UIDatePicker()
  private var completion: ((Double?) -> Void)?

  init(title: String, milliseconds: Double, completion: @escaping (Double?) -> Void) {
    super.init(nibName: nil, bundle: nil)
    self.title = title
    self.completion = completion
    picker.datePickerMode = .dateAndTime
    picker.preferredDatePickerStyle = .wheels
    picker.locale = Locale(identifier: "ja_JP")
    picker.date = Date(timeIntervalSince1970: milliseconds / 1000)
  }

  required init?(coder: NSCoder) { fatalError("Use init(title:milliseconds:completion:)") }

  func present(from presenter: UIViewController) {
    let navigation = UINavigationController(rootViewController: self)
    navigation.modalPresentationStyle = .pageSheet
    navigation.view.backgroundColor = .systemBackground
    backdrop.isUserInteractionEnabled = false
    backdrop.frame = presenter.view.bounds
    backdrop.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    presenter.view.addSubview(backdrop)
    if let sheet = navigation.sheetPresentationController {
      sheet.detents = [.custom { min(300, $0.maximumDetentValue) }]
      sheet.prefersGrabberVisible = true
      sheet.delegate = self
      if #available(iOS 26.1, *) {
        let glass = UIGlassEffect(style: .regular)
        glass.tintColor = UIColor.systemBackground.withAlphaComponent(0.62)
        sheet.backgroundEffect = glass
      }
    }
    presenter.present(navigation, animated: true)
    UIView.animate(withDuration: 0.25) { self.backdrop.effect = UIBlurEffect(style: .systemThinMaterial) }
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .clear
    navigationItem.largeTitleDisplayMode = .never
    navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .cancel, target: self, action: #selector(cancel))
    navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .done, target: self, action: #selector(confirm))

    picker.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(picker)
    let area = view.safeAreaLayoutGuide
    NSLayoutConstraint.activate([
      picker.centerXAnchor.constraint(equalTo: area.centerXAnchor),
      picker.centerYAnchor.constraint(equalTo: area.centerYAnchor),
      picker.leadingAnchor.constraint(greaterThanOrEqualTo: area.leadingAnchor),
      picker.trailingAnchor.constraint(lessThanOrEqualTo: area.trailingAnchor)
    ])
  }

  override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
    guard isBeingDismissed || navigationController?.isBeingDismissed == true else { return }
    transitionCoordinator?.animate(alongsideTransition: { _ in self.backdrop.effect = nil }, completion: { context in
      if context.isCancelled { self.backdrop.effect = UIBlurEffect(style: .systemThinMaterial) }
      else { self.backdrop.removeFromSuperview() }
    })
  }

  @objc private func cancel() { close(with: nil) }
  @objc private func confirm() { close(with: picker.date.timeIntervalSince1970 * 1000) }

  private func close(with value: Double?) {
    let callback = completion
    completion = nil
    navigationController?.dismiss(animated: true) { self.backdrop.removeFromSuperview(); callback?(value) }
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    backdrop.removeFromSuperview()
    completion?(nil)
    completion = nil
  }
}
