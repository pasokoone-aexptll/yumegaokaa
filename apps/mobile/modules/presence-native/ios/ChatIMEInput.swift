import ExpoModulesCore
import UIKit

private final class CompositionField: UITextField {
 var compositionEnded: (() -> Void)?
 override func unmarkText() {
  super.unmarkText()
  compositionEnded?()
 }
}

// UIKit owns marked text and its underline. Never rewrite attributedText or
// reapply typing attributes on every React render while an IME is composing.
final class ChatIMEInput: ExpoView, UITextFieldDelegate {
 let onTextChange = EventDispatcher()
 private let field = CompositionField()
 private var eventCount = 0
 var maxLength = 500
 required init(appContext: AppContext? = nil) {
  super.init(appContext: appContext)
  field.delegate = self
  field.textColor = UIColor.white.withAlphaComponent(0.6)
  field.tintColor = .white
  field.font = UIFontMetrics.default.scaledFont(for: .systemFont(ofSize: 18))
  field.adjustsFontForContentSizeCategory = true
  field.markedTextStyle = [.underlineStyle: NSUnderlineStyle.single.rawValue, .underlineColor: UIColor.white]
  field.returnKeyType = .default
  field.overrideUserInterfaceStyle = .dark
  field.addTarget(self, action: #selector(edited), for: .editingChanged)
  field.compositionEnded = { [weak self] in
   DispatchQueue.main.async { self?.edited() }
  }
  addSubview(field)
 }
 override func layoutSubviews() {
  super.layoutSubviews()
  field.frame = bounds.inset(by: UIEdgeInsets(top: 0, left: 15, bottom: 0, right: 0))
 }
 func setTextState(_ state: [String:Any]) {
  guard let text = state["text"] as? String,
        let acknowledged = state["eventCount"] as? Int,
        acknowledged >= eventCount,
        field.markedTextRange == nil,
        text != field.text else { return }
  field.text = text
 }
 func setPlaceholder(_ value:String) {
  field.attributedPlaceholder = NSAttributedString(string:value, attributes:[.foregroundColor:UIColor.white.withAlphaComponent(0.4)])
 }
 func setEditable(_ value:Bool) { field.isEnabled=value }
 func setLabel(_ value:String) { field.accessibilityLabel=value }
 @objc private func edited() {
  if field.markedTextRange == nil, let text=field.text, text.count>maxLength {
   field.text=String(text.prefix(maxLength))
  }
  eventCount+=1
  onTextChange(["text":field.text ?? "", "eventCount":eventCount, "composing":field.markedTextRange != nil])
 }
 func textFieldDidEndEditing(_ textField:UITextField) { edited() }
 func textFieldShouldReturn(_ textField:UITextField)->Bool {
  if textField.markedTextRange != nil { textField.unmarkText() }
  else { textField.resignFirstResponder() }
  return false
 }
}
