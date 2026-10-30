import XCTest
import CoreLocation

final class Smoke: XCTestCase {
 @MainActor func testMVPNavigation() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  XCTAssertTrue(app.descendants(matching:.any).matching(identifier:"Home").firstMatch.waitForExistence(timeout:40))
  app.descendants(matching:.any).matching(identifier:"Home").firstMatch.tap()
  XCTAssertTrue(app.staticTexts["ピン一覧"].waitForExistence(timeout:10))
  tap(app,"ピンを作成");tap(app,"オフ会通知")
  let title=app.textFields["オフ会名を入力"]
  title.tap();title.typeText("Navigation check");title.typeText("\n")
  tap(app,"場所を選択")
  XCTAssertTrue(app.staticTexts["地図をタップして開催場所を選択"].waitForExistence(timeout:10))
  app.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.45)).tap()
  tap(app,"この場所にする")
  XCTAssertEqual(title.value as? String,"Navigation check")
  tap(app,"閉じる")
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  for (button,heading) in [("プロフィール","プロフィール"),("友人を招待","友人を招待"),("お知らせ","お知らせ"),("ブロック設定","ブロック設定"),("運営","運営")] {
   tap(app,button);XCTAssertTrue(app.staticTexts[heading].waitForExistence(timeout:10));tap(app,"‹ 戻る")
  }
  app.descendants(matching:.any).matching(identifier:"Map").firstMatch.tap()
  attach(app,"mvp-navigation-map")
 }
 @MainActor func testLoginEntryRestartExit() async throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  addUIInterruptionMonitor(withDescription:"Permissions") { alert in
   for title in ["Allow While Using App","Allow","OK","Appの使用中は許可","許可","開く","Open"] {
    if alert.buttons[title].exists {alert.buttons[title].tap();return true}
   }
   return false
  }
  XCUIDevice.shared.location = XCUILocation(location: CLLocation(latitude:35.7295,longitude:139.7109))
  defer {XCUIDevice.shared.location=nil}
  app.launch()
  let springboard=XCUIApplication(bundleIdentifier:"com.apple.springboard")
  if springboard.buttons["開く"].exists {springboard.buttons["開く"].tap()}
  if app.buttons["開く"].exists {app.buttons["開く"].tap()}
  app.tap()
  if app.buttons["Continue"].waitForExistence(timeout:4) {app.buttons["Continue"].tap()}
  if app.buttons["Reload"].exists {app.coordinate(withNormalizedOffset:CGVector(dx:0.9,dy:0.487)).tap()}
  // Repeat this scenario only with the dedicated local fixture account.
  if app.descendants(matching:.any).matching(identifier:"アカウント・接続状態").firstMatch.exists {
   tap(app,"アカウント・接続状態");tap(app,"ログアウト")
  }
  // Expo development client may show the launcher before loading the local bundle.
  let email=app.textFields["メールアドレス"]
  XCTAssertTrue(email.waitForExistence(timeout:60),"Expected product login; inspect screenshot if development launcher is visible")
  let address="iphone-validation@example.test"
  if email.value as? String != address {
  email.tap()
  // Pace native keystrokes so RN's controlled input commits each change.
  for character in address {email.typeText(String(character))}
  }
  XCTAssertEqual(email.value as? String,address,"Do not send to a mistyped recipient")
  email.typeText("\n")
  let base=ProcessInfo.processInfo.environment["TEST_MAIL_URL"] ?? "http://127.0.0.1:54324"
  func messages() async throws -> [[String:Any]] {
   let (data,_)=try await URLSession.shared.data(from:URL(string:base+"/api/v1/messages")!)
   return (try JSONSerialization.jsonObject(with:data) as! [String:Any])["messages"] as! [[String:Any]]
  }
  let before=Set(try await messages().compactMap{$0["ID"] as? String})
  tap(app,"確認コードを送る")
  let codeField=app.textFields["メールの確認コード"]
  XCTAssertTrue(codeField.waitForExistence(timeout:20))
  var delivered:[String:Any]?
  for _ in 0..<20 {
   delivered=try await messages().first{m in
    !before.contains(m["ID"] as? String ?? "") &&
    (m["To"] as? [[String:Any]])?.contains{($0["Address"] as? String)==address} == true
   }
   if delivered != nil {break}
   try await Task.sleep(nanoseconds:250_000_000)
  }
  let message=try XCTUnwrap(delivered,"Require a newly delivered OTP, never reuse old mail")
  let (mailData,_)=try await URLSession.shared.data(from:URL(string:base+"/api/v1/message/"+(message["ID"] as! String))!)
  let mail=try JSONSerialization.jsonObject(with:mailData) as! [String:Any]
  let text=(mail["Text"] as? String ?? "")+" "+(mail["HTML"] as? String ?? "")
  let regex=try NSRegularExpression(pattern:"\\b[0-9]{6}\\b")
  let match=try XCTUnwrap(regex.firstMatch(in:text,range:NSRange(text.startIndex...,in:text)))
  let code=String(text[Range(match.range,in:text)!])
  codeField.tap();for character in code {codeField.typeText(String(character))};codeField.typeText("\n")
  tap(app,"ログイン")
  let toggle=app.switches["街への参加"]
  XCTAssertTrue(toggle.waitForExistence(timeout:30))
  attach(app,"map-before-entry")
  toggle.tap()
  tap(app,"開発用タグで入街（NFC代用）")
  app.tap() // Handle the system location permission prompt through the monitor.
  if app.staticTexts["位置情報を許可してから、もう一度入街してください。設定アプリで許可を変更できます。"].waitForExistence(timeout:3) {
   toggle.tap();tap(app,"開発用タグで入街（NFC代用）")
  }
  XCTAssertTrue(app.staticTexts["気配を観測中"].waitForExistence(timeout:25) || app.staticTexts["新しい気配を共有しました"].exists)
  XCUIDevice.shared.location = XCUILocation(location: CLLocation(latitude:35.72951,longitude:139.71091))
  XCTAssertTrue(app.staticTexts["新しい気配を共有しました"].waitForExistence(timeout:30))
  // MapLibre's native annotation is not exposed as XCTest text. Review this
  // screenshot for the rendered presence; the send status alone is not proof.
  attach(app,"checked-in")
  if app.buttons["地図へ"].exists {tap(app,"地図へ")}
  verifyRestartAndExit(app)
 }
 @MainActor private func verifyRestartAndExit(_ app:XCUIApplication) {
  let toggle=app.switches["街への参加"]
  app.terminate();app.launch()
  XCTAssertTrue(toggle.waitForExistence(timeout:30))
  XCTAssertTrue(app.staticTexts["気配を観測中"].waitForExistence(timeout:25) || app.staticTexts["新しい気配を共有しました"].exists)
  toggle.tap()
  XCTAssertTrue(app.staticTexts["未参加"].waitForExistence(timeout:25))
  app.terminate();app.launch()
  XCTAssertTrue(app.staticTexts["未参加"].waitForExistence(timeout:30))
  XCTAssertEqual(toggle.value as? String,"0")
  attach(app,"after-exit-relaunch")
 }
 @MainActor private func tap(_ app:XCUIApplication,_ title:String) {
  let element=app.descendants(matching:.any).matching(identifier:title).firstMatch
  XCTAssertTrue(element.waitForExistence(timeout:15));element.tap()
 }
 @MainActor private func attach(_ app:XCUIApplication,_ name:String){let a=XCTAttachment(screenshot:app.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
}
