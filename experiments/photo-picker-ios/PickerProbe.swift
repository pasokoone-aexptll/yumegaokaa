import UIKit
final class Screen: UIViewController, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
 override func viewDidLoad() {
  super.viewDidLoad(); view.backgroundColor = .systemBackground
  let button = UIButton(type: .system)
  button.setTitle("写真一覧の表示時間を測る", for: .normal)
  button.addTarget(self, action: #selector(openPicker), for: .touchUpInside)
  button.translatesAutoresizingMaskIntoConstraints = false
  view.addSubview(button)
  NSLayoutConstraint.activate([button.centerXAnchor.constraint(equalTo:view.centerXAnchor),button.centerYAnchor.constraint(equalTo:view.centerYAnchor)])
 }
 @objc func openPicker() {
  let start = CFAbsoluteTimeGetCurrent()
  let picker = UIImagePickerController(); picker.sourceType = .photoLibrary
  picker.mediaTypes = ["public.image"]; picker.allowsEditing = true
  picker.delegate = self
  NSLog("PickerProbe initialized %.1f ms",(CFAbsoluteTimeGetCurrent()-start)*1000)
  present(picker, animated:true) { NSLog("PickerProbe presented %.1f ms",(CFAbsoluteTimeGetCurrent()-start)*1000) }
 }
 func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { picker.dismiss(animated:true) }
 func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info:[UIImagePickerController.InfoKey:Any]) { picker.dismiss(animated:true) }
}
final class Scene: UIResponder, UIWindowSceneDelegate {
 var window: UIWindow?
 func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
  guard let scene = scene as? UIWindowScene else { return }
  window = UIWindow(windowScene: scene);window?.rootViewController=Screen();window?.makeKeyAndVisible()
 }
}
@main final class App: UIResponder, UIApplicationDelegate {
 func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
  let config=UISceneConfiguration(name: "Default", sessionRole:session.role);config.delegateClass=Scene.self;return config
 }
}
