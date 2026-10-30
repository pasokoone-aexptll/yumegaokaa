import XCTest
import CoreLocation
import CryptoKit

final class Smoke: XCTestCase {
 @MainActor func testSignOutForFixtureSwitch() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  if app.textFields["メールアドレス"].waitForExistence(timeout:3) { return }
  let settings=app.descendants(matching:.any).matching(identifier:"Settings").firstMatch
  XCTAssertTrue(settings.waitForExistence(timeout:20));settings.tap()
  tap(app,"ログイン・接続状態")
  tap(app,"ログアウト")
  XCTAssertTrue(app.textFields["メールアドレス"].waitForExistence(timeout:15))
 }
 @MainActor func testProfilePhotoPersistence() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  XCTAssertTrue(app.switches["街への参加"].waitForExistence(timeout:30))
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  tap(app,"プロフィール")
  let name=app.textFields["表示名"]
  XCTAssertTrue(name.waitForExistence(timeout:15))
  let previousName=name.value as? String
  tap(app,"写真を選ぶ")
  let photo=app.images.matching(identifier:"PXGGridLayout-Info").firstMatch
  XCTAssertTrue(photo.waitForExistence(timeout:20));photo.tap()
  XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout:15))
  app.buttons["Done"].tap()
  XCTAssertTrue(app.staticTexts["保存しました"].waitForExistence(timeout:30))
  XCTAssertEqual(name.value as? String,previousName)
  attach(app,"profile-photo-saved")
  app.terminate();app.launch()
  XCTAssertTrue(app.switches["街への参加"].waitForExistence(timeout:30))
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  tap(app,"プロフィール")
  XCTAssertTrue(name.waitForExistence(timeout:15))
  XCTAssertEqual(name.value as? String,previousName)
  attach(app,"profile-photo-reopened")
 }
 @MainActor func testStreetIconPhotoSelection() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  XCTAssertTrue(app.switches["街への参加"].waitForExistence(timeout:30))
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  tap(app,"街のアイコン")
  tap(app,"提供画像を差し替える")
  let photo=app.images.matching(identifier:"PXGGridLayout-Info").firstMatch
  XCTAssertTrue(photo.waitForExistence(timeout:20))
  photo.tap()
  XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout:15))
  attach(app,"photo-crop")
  app.buttons["Done"].tap()
  let replace=app.buttons["提供画像を差し替える"]
  XCTAssertTrue(XCTWaiter.wait(for:[XCTNSPredicateExpectation(predicate:NSPredicate(format:"exists == true AND enabled == true"),object:replace)],timeout:30) == .completed)
  XCTAssertFalse(app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@","できませんでした")).firstMatch.exists)
  attach(app,"photo-saved")
 }
 @MainActor func testInviteIssueRevoke() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  XCTAssertTrue(app.switches["街への参加"].waitForExistence(timeout:30))
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  tap(app,"友人を招待")
  XCTAssertTrue(app.buttons["招待を発行"].waitForExistence(timeout:15))
  tap(app,"招待を発行")
  XCTAssertTrue(app.buttons["コードを共有"].waitForExistence(timeout:20))
  app.buttons.matching(identifier:"この招待を停止").firstMatch.tap()
  XCTAssertTrue(XCTWaiter.wait(for:[XCTNSPredicateExpectation(predicate:NSPredicate(format:"exists == false"),object:app.buttons["コードを共有"])],timeout:15) == .completed)
  XCTAssertTrue(app.staticTexts.matching(identifier:"停止済み").firstMatch.waitForExistence(timeout:10))
  attach(app,"invitation-revoked")
 }
 @MainActor func testOperatorReportedEventRoster() throws {
  let app=try operatorApp()
  tap(app,"‹ 戻る");tap(app,"通報対応")
  XCTAssertTrue(app.staticTexts["UI reported event"].waitForExistence(timeout:20))
  tap(app,"オフ会の詳細を確認")
  tap(app,"参加者一覧")
  XCTAssertTrue(app.staticTexts["UI別の参加者"].waitForExistence(timeout:15))
  XCTAssertFalse(app.buttons["イベントを編集"].exists)
  XCTAssertFalse(app.buttons["イベントを中止"].exists)
  attach(app,"operator-non-host-event-roster")
  tap(app,"‹ 戻る")
  XCTAssertTrue(app.staticTexts["通報対応"].waitForExistence(timeout:10))
 }
 @MainActor func testOperatorResolvePeerReport() throws {
  let app=try operatorApp()
  tap(app,"‹ 戻る")
  tap(app,"通報対応")
  XCTAssertTrue(app.staticTexts["UI peer message for report and block"].waitForExistence(timeout:20))
  XCTAssertEqual(app.buttons.matching(identifier:"元の投稿を削除").count,1,"Only act on the dedicated fixture report")
  tap(app,"元の投稿を削除")
  XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["削除"].tap()
  tap(app,"対応完了")
  XCTAssertTrue(app.staticTexts["未対応の通報はありません。"].waitForExistence(timeout:20))
  attach(app,"operator-peer-report-resolved")
 }
 @MainActor func testPeerReportBlockUnblock() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  XCTAssertTrue(app.switches["街への参加"].waitForExistence(timeout:30))
  let body="UI peer message for report and block"
  let message=app.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@",body)).firstMatch
  XCTAssertTrue(message.waitForExistence(timeout:30));message.press(forDuration:1.2)
  XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["通報"].tap()
  tap(app,"運営へ送信")
  XCTAssertTrue(app.staticTexts["通報を受け付けました。通報者の情報は相手に公開されません。"].waitForExistence(timeout:15))
  tap(app,"戻る")
  XCTAssertTrue(message.waitForExistence(timeout:15));message.press(forDuration:1.2)
  XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["ブロック"].tap()
  XCTAssertTrue(NSPredicate(format:"exists == false").evaluate(with:message) || XCTWaiter.wait(for:[XCTNSPredicateExpectation(predicate:NSPredicate(format:"exists == false"),object:message)],timeout:15) == .completed)
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  tap(app,"ブロック設定")
  XCTAssertTrue(app.staticTexts["UI別の参加者"].waitForExistence(timeout:15))
  tap(app,"解除")
  XCTAssertTrue(app.staticTexts["ブロックしている人はいません。"].waitForExistence(timeout:15))
  tap(app,"‹ 戻る")
  app.descendants(matching:.any).matching(identifier:"Map").firstMatch.tap()
  XCTAssertTrue(message.waitForExistence(timeout:20))
  attach(app,"peer-visible-after-unblock")
 }
 @MainActor func testOperatorMemberDateSelection() throws {
  let app=try operatorApp()
  tap(app,"‹ 戻る")
  tap(app,"参加者・招待枠・利用停止")
  let member=app.buttons.matching(NSPredicate(format:"label CONTAINS %@", " · 利用")).firstMatch
  XCTAssertTrue(member.waitForExistence(timeout:20));member.tap()
  let date=app.buttons.matching(identifier:"制限終了日時を選択").firstMatch
  XCTAssertTrue(date.waitForExistence(timeout:20))
  date.tap()
  XCTAssertTrue(app.pickerWheels.firstMatch.waitForExistence(timeout:10))
  tap(app,"キャンセル")
  XCTAssertEqual(date.value as? String,"未設定")
  date.tap()
  XCTAssertTrue(app.pickerWheels.firstMatch.waitForExistence(timeout:10))
  tap(app,"決定")
  XCTAssertNotEqual(date.value as? String,"未設定")
  attach(app,"operator-member-date-selected")
  tap(app,"‹ 戻る")
  tap(app,"最新の状態を取得")
  XCTAssertTrue(app.staticTexts["招待の監督"].waitForExistence(timeout:15))
 }
 @MainActor func testOperatorStickerPreparation() throws {
  let app=try operatorApp()
  let title="UI sticker "+String(Int(Date().timeIntervalSince1970))
  let name=app.textFields["管理名"];name.tap();name.typeText(title);name.typeText("\n")
  tap(app,"設置場所を選択")
  XCTAssertTrue(app.buttons["この場所にする"].waitForExistence(timeout:10))
  app.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.45)).tap();tap(app,"この場所にする")
  tap(app,"登録を開始");tap(app,"書き込む")
  XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["書き込む"].tap()
  tap(app,"再読取して照合");tap(app,"現地への設置を確認")
  XCTAssertTrue(app.staticTexts["公開待ち"].waitForExistence(timeout:10))
  tap(app,"登録内容を編集")
  let edit=app.textFields["管理名"];edit.tap();edit.typeText(" edited");edit.typeText("\n");tap(app,"変更を保存")
  XCTAssertTrue(app.staticTexts[title+" edited"].waitForExistence(timeout:10))
  tap(app,"この登録を取り消す")
  XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["取り消す"].tap()
  XCTAssertTrue(app.buttons["登録を開始"].waitForExistence(timeout:15))
  attach(app,"operator-sticker-canceled")
 }
 @MainActor private func operatorApp() throws -> XCUIApplication {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  XCTAssertTrue(app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.waitForExistence(timeout:40))
  app.descendants(matching:.any).matching(identifier:"Map").firstMatch.tap()
  tap(app,"アカウント・接続状態")
  XCTAssertTrue(app.staticTexts["simulator-validation@example.test"].waitForExistence(timeout:10),"Use only the dedicated local fixture")
  tap(app,"地図に戻る")
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  tap(app,"運営");tap(app,"認証アプリを登録")
  let key=app.staticTexts["totp-setup-key"]
  XCTAssertTrue(key.waitForExistence(timeout:15))
  let secret=key.label
  let alphabet=Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567")
  var bits=0,buffer=0,bytes=[UInt8]()
  for c in secret.uppercased() where c != "=" {
   guard let n=alphabet.firstIndex(of:c) else {throw NSError(domain:"UITest.InvalidSetupKey",code:1)}
   buffer=(buffer<<5)|n;bits+=5
   if bits>=8 {bits-=8;bytes.append(UInt8((buffer>>bits)&255));buffer &= (1<<bits)-1}
  }
  var counter=UInt64(Date().timeIntervalSince1970/30).bigEndian
  let data=withUnsafeBytes(of:&counter){Data($0)}
  let hash=Array(HMAC<Insecure.SHA1>.authenticationCode(for:data,using:SymmetricKey(data:Data(bytes))))
  let offset=Int(hash.last!&15)
  let number=((UInt32(hash[offset])<<24)|(UInt32(hash[offset+1])<<16)|(UInt32(hash[offset+2])<<8)|UInt32(hash[offset+3]))&0x7fffffff
  let code=String(format:"%06u",number%1000000)
  let field=app.textFields["認証アプリのコード"];field.tap();for character in code {field.typeText(String(character))};field.typeText("\n");XCTAssertTrue((field.value as? String)==code,"Complete code input")
  tap(app,"追加認証");tap(app,"ステッカー管理")
  return app
 }
 @MainActor func testOperatorAreaPublication() throws {
  let app=try operatorApp()
  let prefix="UI area "+String(Int(Date().timeIntervalSince1970))
  for (index, point) in [CGVector(dx:0.35,dy:0.40),CGVector(dx:0.65,dy:0.40),CGVector(dx:0.50,dy:0.65)].enumerated() {
   let name=app.textFields["管理名"];XCTAssertTrue(name.waitForExistence(timeout:10));name.tap();name.typeText(prefix+" "+String(index));name.typeText("\n")
   tap(app,"設置場所を選択");XCTAssertTrue(app.buttons["この場所にする"].waitForExistence(timeout:10))
   app.coordinate(withNormalizedOffset:point).tap();tap(app,"この場所にする")
   tap(app,"登録を開始");tap(app,"書き込む");XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["書き込む"].tap()
   tap(app,"再読取して照合");tap(app,"現地への設置を確認")
   XCTAssertTrue(app.staticTexts["公開待ち"].waitForExistence(timeout:10));tap(app,"‹ 戻る")
  }
  tap(app,"街の範囲・移設・停止");tap(app,"変更後の範囲を見る")
  tap(app,"この範囲を公開");XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["公開"].tap()
  XCTAssertTrue(app.staticTexts[prefix+" 0 · 有効"].waitForExistence(timeout:15))
  attach(app,"operator-area-published")
  let replacement=app.buttons["新しいステッカーに交換"].firstMatch
  for _ in 0..<5 {if replacement.isHittable {break};app.swipeUp()}
  XCTAssertTrue(replacement.isHittable);replacement.tap();XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["準備する"].tap()
  tap(app,"書き込む");XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["書き込む"].tap()
  tap(app,"再読取して照合");tap(app,"現地への設置を確認");tap(app,"‹ 戻る")
  for _ in 0..<5 {if app.buttons["変更後の範囲を見る"].isHittable {break};app.swipeDown()}
  tap(app,"変更後の範囲を見る");tap(app,"この範囲を公開");XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout:5));app.alerts.buttons["公開"].tap()
  XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "· 廃止")).firstMatch.waitForExistence(timeout:15))
  attach(app,"operator-replacement-published")
 }
 @MainActor func testSuspendedAccountGate() async throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  if app.textFields["メールアドレス"].waitForExistence(timeout:5) {
  let email=app.textFields["メールアドレス"]
  XCTAssertTrue(email.waitForExistence(timeout:60),"Expected product login; inspect screenshot if development launcher is visible")
  let address="simulator-validation@example.test"
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
  }
  XCTAssertTrue(app.staticTexts["利用停止中"].waitForExistence(timeout:35))
  XCTAssertTrue(app.buttons["ログアウト"].exists)
  XCTAssertFalse(app.switches["街への参加"].exists)
  XCTAssertFalse(app.textFields["入力…"].exists)
  attach(app,"suspended-account-gate")
 }
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
  let enteredTitle=title.value as? String
  XCTAssertFalse((enteredTitle ?? "").isEmpty)
  tap(app,"場所を選択")
  XCTAssertTrue(app.buttons["この場所にする"].waitForExistence(timeout:10))
  app.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.45)).tap()
  tap(app,"この場所にする")
  XCTAssertEqual(title.value as? String,enteredTitle)
  tap(app,"閉じる")
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  for (button,heading) in [("プロフィール","プロフィール"),("街のアイコン","街のアイコン"),("アカウント管理","アカウント管理"),("友人を招待","友人を招待"),("お知らせ","お知らせ"),("ブロック設定","ブロック設定"),("運営","運営")] {
   tap(app,button);XCTAssertTrue(app.staticTexts[heading].waitForExistence(timeout:10));tap(app,"‹ 戻る")
  }
  app.descendants(matching:.any).matching(identifier:"Map").firstMatch.tap()
  attach(app,"mvp-navigation-map")
 }
 @MainActor func testPoolRegistrationFromPending() async throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  tap(app,"画像を選んで街に提供")
  let photo=app.images.matching(identifier:"PXGGridLayout-Info").firstMatch
  XCTAssertTrue(photo.waitForExistence(timeout:20));photo.tap()
  XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout:15))
  app.buttons["Done"].tap()
  XCTAssertTrue(app.switches["街への参加"].waitForExistence(timeout:30))
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  tap(app,"街のアイコン")
  XCTAssertTrue(app.staticTexts["今日のあなたのアイコン"].waitForExistence(timeout:15))
  attach(app,"pool-image-confirmed")
 }
 @MainActor func testInvitationOnboarding() async throws {
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
  if app.buttons["ログアウト"].exists {tap(app,"ログアウト")}
  // Repeat this scenario only with the dedicated local fixture account.
  if app.descendants(matching:.any).matching(identifier:"アカウント・接続状態").firstMatch.exists {
   tap(app,"アカウント・接続状態");tap(app,"ログアウト")
  }
  // Expo development client may show the launcher before loading the local bundle.
  let email=app.textFields["メールアドレス"]
  XCTAssertTrue(email.waitForExistence(timeout:60),"Expected product login; inspect screenshot if development launcher is visible")
  let address="onboarding-"+String(Int(Date().timeIntervalSince1970))+"@example.test"
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

  let invite=app.textFields["受け取った招待コード"]
  XCTAssertTrue(invite.waitForExistence(timeout:30))
  XCTAssertFalse(app.buttons["招待を発行"].exists)
  invite.tap();invite.typeText("local-ui-onboarding-test");invite.typeText("\n")
  app.buttons["招待を受け取る"].tap()
  let name=app.textFields["表示名"]
  XCTAssertTrue(name.waitForExistence(timeout:20))
  app.terminate();app.launch()
  XCTAssertTrue(name.waitForExistence(timeout:30),"Resume unfinished profile after restart")
  name.tap();name.typeText("Onboarding visitor");name.typeText("\n")
  tap(app,"次へ")
  XCTAssertTrue(app.buttons["画像を選んで街に提供"].waitForExistence(timeout:20))
  app.terminate();app.launch()
  tap(app,"画像を選んで街に提供")
  let photo=app.images.matching(identifier:"PXGGridLayout-Info").firstMatch
  XCTAssertTrue(photo.waitForExistence(timeout:20));photo.tap()
  XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout:15))
  app.buttons["Done"].tap()

  XCTAssertTrue(app.switches["街への参加"].waitForExistence(timeout:30))
  app.terminate();app.launch()
  XCTAssertTrue(app.switches["街への参加"].waitForExistence(timeout:30))
  XCTAssertFalse(app.textFields["表示名"].exists)
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap()
  tap(app,"街のアイコン")
  XCTAssertTrue(app.staticTexts["今日のあなたのアイコン"].waitForExistence(timeout:15))
  XCTAssertTrue(app.buttons["提供画像を差し替える"].exists)
  attach(app,"pool-image-confirmed")
  tap(app,"‹ 戻る")
  app.descendants(matching:.any).matching(identifier:"Map").firstMatch.tap()
  attach(app,"onboarding-complete")
  tap(app,"アカウント・接続状態");tap(app,"ログアウト")
 }
 @MainActor func testRecruitmentAndChatExpansion() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  addUIInterruptionMonitor(withDescription:"Location") { alert in
   for title in ["Allow While Using App","Allow","OK","Appの使用中は許可","許可"] {
    if alert.buttons[title].exists {alert.buttons[title].tap();return true}
   }
   return false
  }
  XCUIDevice.shared.location=XCUILocation(location:CLLocation(latitude:35.7295,longitude:139.7109))
  defer {XCUIDevice.shared.location=nil}
  // Expo BlurEffectView has a built-in no-animation mode for UI automation.
  // This tests interaction, not the production intensity=45 appearance.
  app.launchArguments += ["-detoxServer", "-detoxSessionId"]
  app.launch()
  let toggle=app.switches["街への参加"]
  XCTAssertTrue(toggle.waitForExistence(timeout:30))
  tap(app,"街のチャット ⌃ 広げる")
  XCTAssertTrue(app.buttons["街のチャット ⌄ 地図へ"].waitForExistence(timeout:10))
  let draft="未送信の入力を保持"
  let input=app.textFields["入力…"]
  input.tap();input.typeText(draft)
  attach(app,"expanded-chat-with-keyboard")
  tap(app,"街のチャット ⌄ 地図へ")
  XCTAssertEqual(input.value as? String,draft)
  attach(app,"chat-collapsed-with-draft")
  if toggle.value as? String != "1" {
   toggle.tap();tap(app,"開発用タグで入街（NFC代用）");app.tap()
  }
  assertParticipation(app, active:true, timeout:25)
  if app.buttons["地図へ"].exists {tap(app,"地図へ")}
  app.descendants(matching:.any).matching(identifier:"Home").firstMatch.tap()
  tap(app,"ピンを作成")
  let title="UI recruitment "+String(Int(Date().timeIntervalSince1970))
  let field=app.textFields["募集ピン名を入力"]
  XCTAssertTrue(field.waitForExistence(timeout:15));field.tap();field.typeText(title);field.typeText("\n")
  tap(app,"公開する現在地を確認")
  let location=app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@","この位置を公開")).firstMatch
  XCTAssertTrue(location.waitForExistence(timeout:20));tap(app,"ピンを作成")
  XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout:20))
  let name=app.textFields["募集の題名"]
  name.tap();name.press(forDuration:1.2)
  let selectAll=app.descendants(matching:.any).matching(NSPredicate(format:"label IN %@",["Select All","すべてを選択","すべて選択","全選択"])).firstMatch
  XCTAssertTrue(selectAll.waitForExistence(timeout:5));selectAll.tap();name.typeText(title+" edited");name.typeText("\n")
  tap(app,"題名を保存")
  XCTAssertTrue(app.staticTexts[title+" edited"].waitForExistence(timeout:15))
  tap(app,"募集を終了")
  XCTAssertTrue(app.staticTexts["募集は終了しました"].waitForExistence(timeout:15))
  tap(app,"‹ 戻る")
  tap(app,"募集中のピン")
  XCTAssertFalse(app.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@",title)).firstMatch.exists)
  app.descendants(matching:.any).matching(identifier:"Map").firstMatch.tap()
  toggle.tap()
  assertParticipation(app, active:false, timeout:20)
  attach(app,"recruitment-ended-and-checked-out")
 }
 @MainActor func testHostEditRosterNotifications() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  let home=app.descendants(matching:.any).matching(identifier:"Home").firstMatch
  XCTAssertTrue(home.waitForExistence(timeout:30));home.tap()
  // Run scripts/prepare-ui-test.mjs --host-event before this scenario.
  let title="UI host workflow"
  let card=app.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@",title)).firstMatch
  XCTAssertTrue(card.waitForExistence(timeout:15));card.tap()
  app.swipeUp();tap(app,"参加者一覧")
  XCTAssertTrue(app.staticTexts["実機確認"].waitForExistence(timeout:15))
  tap(app,"イベントを編集")
  XCTAssertTrue(app.textFields["オフ会名"].waitForExistence(timeout:15))
  tap(app,"終了日時を選択")
  adjustMinute(app)
  tap(app,"決定");app.swipeUp();tap(app,"保存")
  XCTAssertTrue(app.buttons["再取得"].waitForExistence(timeout:15))
  tap(app,"‹ 戻る")
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap();tap(app,"お知らせ")
  XCTAssertTrue(app.staticTexts["参加予定のイベントに変更があります"].waitForExistence(timeout:15))
  tap(app,"詳細を確認")
  XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout:15))
  app.swipeUp();tap(app,"イベントを中止")
  XCTAssertTrue(app.alerts.buttons["中止する"].waitForExistence(timeout:5));app.alerts.buttons["中止する"].tap()
  XCTAssertTrue(app.staticTexts["イベントを中止しました"].waitForExistence(timeout:15))
  tap(app,"‹ 戻る")
  XCTAssertTrue(app.staticTexts["参加予定のイベントが中止されました"].waitForExistence(timeout:15))
  tap(app,"確認しました")
  XCTAssertTrue(app.buttons["確認済み"].waitForExistence(timeout:15))
  app.terminate();app.launch()
  app.descendants(matching:.any).matching(identifier:"Settings").firstMatch.tap();tap(app,"お知らせ")
  XCTAssertTrue(app.buttons["確認済み"].waitForExistence(timeout:15))
  attach(app,"notification-read-after-restart")
 }
 @MainActor func testChatSendReloadDelete() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  XCTAssertTrue(app.switches["街への参加"].waitForExistence(timeout:30))
  let body="UI chat "+String(Int(Date().timeIntervalSince1970))
  let input=app.textFields["入力…"]
  XCTAssertTrue(input.waitForExistence(timeout:15))
  input.tap();input.typeText(body)
  tap(app,"送信")
  XCTAssertTrue(app.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@",body)).firstMatch.waitForExistence(timeout:20))
  app.terminate();app.launch()
  XCTAssertTrue(app.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@",body)).firstMatch.waitForExistence(timeout:30))
  app.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@",body)).firstMatch.press(forDuration:1.2)
  XCTAssertTrue(app.alerts.buttons["削除"].waitForExistence(timeout:10))
  app.alerts.buttons["削除"].tap()
  XCTAssertTrue(app.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@","削除されたメッセージ")).firstMatch.waitForExistence(timeout:20))
  XCTAssertFalse(app.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@",body)).firstMatch.exists)
  attach(app,"chat-after-delete")
 }
 @MainActor func testEventCreateJoinCancel() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"jp.yumegaoka.development")
  app.launch()
  let home=app.descendants(matching:.any).matching(identifier:"Home").firstMatch
  XCTAssertTrue(home.waitForExistence(timeout:30));home.tap()
  tap(app,"ピンを作成");tap(app,"オフ会通知")
  let title="UI event "+String(Int(Date().timeIntervalSince1970))
  let titleField=app.textFields["オフ会名を入力"]
  titleField.tap();titleField.typeText(title);titleField.typeText("\n")
  tap(app,"開始日時を選択")
  XCTAssertTrue(app.pickerWheels.firstMatch.waitForExistence(timeout:10))
  tap(app,"キャンセル")
  XCTAssertEqual(app.buttons["開始日時を選択"].value as? String,"未設定")
  for label in ["開始日時を選択","終了日時を選択"] {
   tap(app,label)
   adjustMinute(app)
   tap(app,"決定")
  }
  app.swipeUp()
  tap(app,"場所を選択")
  XCTAssertTrue(app.buttons["この場所にする"].waitForExistence(timeout:10))
  app.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.45)).tap();tap(app,"この場所にする")
  app.swipeUp();tap(app,"ピンを作成")
  XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout:20))
  tap(app,"参加する")
  XCTAssertTrue(app.buttons["参加を取り消す"].waitForExistence(timeout:15))
  tap(app,"‹ 戻る")
  let card=app.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@",title)).firstMatch
  XCTAssertTrue(card.waitForExistence(timeout:15));card.tap()
  tap(app,"参加を取り消す")
  XCTAssertTrue(app.buttons["参加する"].waitForExistence(timeout:15))
  app.swipeUp();tap(app,"イベントを中止")
  XCTAssertTrue(app.alerts.buttons["中止する"].waitForExistence(timeout:5));app.alerts.buttons["中止する"].tap()
  XCTAssertTrue(app.staticTexts["イベントを中止しました"].waitForExistence(timeout:15))
  attach(app,"event-after-cancel")
 }
 @MainActor private func loginRegisteredAccount() async throws {
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
  if app.buttons["ログアウト"].exists {tap(app,"ログアウト")}
  // Dedicated local registered fixture; native onboarding is a separate test.
  let email=app.textFields["メールアドレス"]
  XCTAssertTrue(email.waitForExistence(timeout:60),"Expected product login; inspect screenshot if development launcher is visible")
  let address="simulator-validation@example.test"
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
 }
 @MainActor func testSimulatorAccountLogin() async throws {
  try await loginRegisteredAccount()
 }
 @MainActor func testRegisteredNavigation() async throws {
  try await loginRegisteredAccount()
  try testMVPNavigation()
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
  if app.buttons["Continue"].waitForExistence(timeout:4) {app.buttons["Continue"].tap()}
  if app.buttons["Reload"].exists {app.coordinate(withNormalizedOffset:CGVector(dx:0.9,dy:0.487)).tap()}
  // Repeat this scenario only with the dedicated local fixture account.
  if app.descendants(matching:.any).matching(identifier:"アカウント・接続状態").firstMatch.exists {
   tap(app,"アカウント・接続状態");tap(app,"ログアウト")
  }
  // Expo development client may show the launcher before loading the local bundle.
  let email=app.textFields["メールアドレス"]
  XCTAssertTrue(email.waitForExistence(timeout:60),"Expected product login; inspect screenshot if development launcher is visible")
  let address="simulator-validation@example.test"
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
  if springboard.alerts.firstMatch.exists { app.tap() } // Only trigger the permission monitor for an actual prompt.
  if app.staticTexts["位置情報を許可してから、もう一度入街してください。設定アプリで許可を変更できます。"].waitForExistence(timeout:3) {
   toggle.tap();tap(app,"開発用タグで入街（NFC代用）")
  }
  assertParticipation(app, active:true, timeout:25)
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
  assertParticipation(app, active:true, timeout:25)
  toggle.tap()
  assertParticipation(app, active:false, timeout:25)
  app.terminate();app.launch()
  assertParticipation(app, active:false, timeout:30)
  XCTAssertEqual(toggle.value as? String,"0")
  attach(app,"after-exit-relaunch")
 }
 @MainActor private func assertParticipation(_ app:XCUIApplication, active:Bool, timeout:TimeInterval) {
  let toggle=app.switches["街への参加"]
  XCTAssertTrue(toggle.waitForExistence(timeout:timeout))
  let expected=XCTNSPredicateExpectation(predicate:NSPredicate(format:"value == %@",active ? "1" : "0"),object:toggle)
  XCTAssertEqual(XCTWaiter.wait(for:[expected],timeout:timeout),.completed)
 }
 @MainActor private func adjustMinute(_ app:XCUIApplication) {
  XCTAssertTrue(app.pickerWheels.firstMatch.waitForExistence(timeout:10))
  let wheel=app.pickerWheels.element(boundBy:app.pickerWheels.count-1)
  let value=wheel.value as? String ?? ""
  let digits=value.filter { $0.isNumber }
  guard let minute=Int(digits),minute<60 else {XCTFail("Expected minute wheel");return}
  let replacement=String(format:"%02d",(minute+5)%60)
  wheel.adjust(toPickerWheelValue:replacement)
 }
 @MainActor private func tap(_ app:XCUIApplication,_ title:String) {
  let element=app.descendants(matching:.any).matching(identifier:title).firstMatch
  XCTAssertTrue(element.waitForExistence(timeout:15));element.tap()
 }
 @MainActor private func attach(_ app:XCUIApplication,_ name:String){let a=XCTAttachment(screenshot:app.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
}
