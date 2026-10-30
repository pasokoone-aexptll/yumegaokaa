# MVPのUI検証

NFCは開発用入力、位置はXCTestのシミュレーション。製品の画面・Swift観測・ローカルAuth/DB/APIを使用する。ロック中の実歩行の代替ではない。

1. ローカルSupabaseを起動する。Debug版を使う場合だけMetroも起動する。`npm run setup:local`でアプリのLAN接続先を作る。
2. `node scripts/prepare-ui-test.mjs`で専用ローカルアカウントを作る。サービス鍵はこのMacの準備処理だけで使う。
3. `ruby tests/ios-ui/generate.rb`でUIテスト用プロジェクトを生成する（xcodeproj gemが必要）。
4. 本体をXcode標準のシミュレータ署名でビルドし、インストールする。現在はJS内蔵Releaseを優先し、Debug版だけ開発サーバーを開く。本体には `CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=-` を使用する。Keychainを使う本体へ `CODE_SIGNING_ALLOWED=NO` を指定しない。次項のテストrunnerとは区別する。
5. 下記の対象指定コマンドで、準備した状態に対応するケースだけ実行する。

テスト専用メールは `iphone-validation@example.test`。Mailpitからワンタイムコードを読み、実際のログイン画面へ入力する。Mailpitの既定接続は `http://127.0.0.1:54324`。テスト成果物は一時ディレクトリへ置き、OTP入力を含み得る詳細ログを公開・docsへ転記しない。

初回Expoの案内を閉じる処理を含む。開発メニューを閉じる座標はiPhone 17のテスト画面に基づくため、他画面サイズでは更新が必要。製品のテスト操作はアクセシビリティ要素を使用する。

実機では無料署名のアプリ数上限にUIテストrunnerが当たった。本体インストールは可能。既存アプリを勝手に削除せず、実機UI・実歩行は手動確認として残す。

2026-10-30：メール入力値を照合し、送信前に存在したメールを除外して新着OTPのみ使用する。再送では前回コードを選ばない。MapLibre注釈はXCTestの文字要素として取得できなかったため、`checked-in`画像を目視確認する。送信成功表示だけで地図描画成功と判定しない。

今回はOTP→入街→送信を確認した後、地図を画像確認し、入街済み状態から再起動・退出・再起動だけを一時的な限定テストで実行して成功。保存した一本の試験を先頭から再実行して合格したという記録ではない。UI変更時に該当箇所だけ再確認し、無関係なDB試験・本体ビルドを反復しない。


## 運営のステッカー準備
専用アカウントでログインしたシミュレータを使用。`node scripts/prepare-ui-test.mjs --operator` はこのローカル専用アカウントに限り運営資格を付け、TOTPを初期化する。`-only-testing:Smoke/Smoke/testOperatorStickerPreparation` で実TOTP登録/追加認証→登録→NFC代用→照合→設置→編集→取消を操作する。実タグの検証ではない。設定キー・入力コードを含み得るxcresultやスクリーンショットは一時領域に保管し共有しない。終了後は `node scripts/prepare-ui-test.mjs --revoke-operator` で試験資格とTOTPを廃棄する。公開・交換は別試験に残す。


## JS内蔵Releaseでの統合確認

現在はRelease本体をインストールして利用する。Metroは不要だが、実ローカルSupabaseへの通信は必要。対象機のUDIDはその都度確認する。本体の変更がなければ既存Releaseを再利用し、runnerだけをビルドする。

```sh
xcodebuild -project tests/ios-ui/Smoke.xcodeproj -scheme Smoke \
  -destination 'platform=iOS Simulator,id=<SIMULATOR_ID>' \
  -derivedDataPath /tmp/yumegaoka-ui-release \
  -resultBundlePath /tmp/<UNIQUE_RESULT>.xcresult \
  -collect-test-diagnostics never \
  -only-testing:Smoke/Smoke/<TEST_NAME> test
```

runnerも未変更なら`test-without-building`。`-collect-test-diagnostics never`は失敗後のsysdiagnose待ちを避けるためで、通常の結果・画像添付は残る。各試験は状態を変更するため、全件を無条件に連続実行せず、前提条件を揃えて対象フローを選ぶ。

| ケース | 準備と対象 |
| --- | --- |
| testRegisteredNavigation | `--registered-fixture`。実OTP、再起動、3タブと設定画面往復 |
| testEventCreateJoinCancel | 登録済み状態。イベント作成→参加→Home→取消→主催中止 |
| testHostEditRosterNotifications | `--host-event`。専用イベント編集/名簿/変更・中止通知/既読復元 |
| testRecruitmentAndChatExpansion | 登録済み状態。位置はシミュレーション。拡大/キーボード/下書き、募集作成/編集/終了/退出 |
| testPeerReportBlockUnblock | `--peer-message`。別利用者投稿の通報/ブロック/解除。実機2台の同時操作ではない |
| testOperatorResolvePeerReport | 上記の未対応通報が1件ある状態で`--operator`。実MFA→証拠確認→投稿削除→対応完了。終了後`--revoke-operator` |

`testRecruitmentAndChatExpansion`だけはexpo-blur内蔵の自動操作用引数を使い、部分強度アニメーションによるXCTestのidle待ちを回避する。製品のintensity45は変更していないが、当該試験のblur外観は製品と同一ではない。

実機写真選択は手動確認中。`--registered-fixture`は実Auth/API/Storageで登録済み状態を用意するだけで、初回登録やネイティブ写真選択の成功証拠にしない。最新の実行結果・制限はdocs/MVP_TASKS.md、TECH_VALIDATION.mdを参照する。

`testOperatorMemberDateSelection`は`--operator`で準備し、実MFA→参加者管理の制限終了日時のキャンセル/確定→運営一覧復帰を確認する。利用者の制限状態は変更しない。終了後に`--revoke-operator`を実行する。

`testStreetIconPhotoSelection`は登録済み専用アカウントで使用する。先に`simctl addmedia <SIMULATOR_ID> apps/mobile/assets/icon.png`でfixtureを追加し、最新画像がこのfixtureであることを確認する。写真選択の`PXGGridLayout-Info`を待ち、標準編集の`Done`で確定して保存復帰を確認。UI結果だけでなく専用アカウントの最新公開行とStorage画像の容量/寸法を照合する。個人写真のライブラリには実行しない。
