# 最初の一本のUI検証

NFCは開発用入力、位置はXCTestのシミュレーション。製品の画面・Swift観測・ローカルAuth/DB/APIを使用する。ロック中の実歩行の代替ではない。

1. ローカルSupabaseとMetroを起動する。`npm run setup:local`でアプリのLAN接続先を作る。
2. `node scripts/prepare-ui-test.mjs`で専用ローカルアカウントを作る。サービス鍵はこのMacの準備処理だけで使う。
3. `ruby tests/ios-ui/generate.rb`でUIテスト用プロジェクトを生成する（xcodeproj gemが必要）。
4. Debug本体をXcode標準のシミュレータ署名でビルドし、インストールして開発サーバーを開く。本体には `CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=-` を使用する。Keychainを使う本体へ `CODE_SIGNING_ALLOWED=NO` を指定しない。次項のテストrunnerとは区別する。
5. `xcodebuild -project tests/ios-ui/Smoke.xcodeproj -scheme Smoke -destination 'platform=iOS Simulator,id=<SIMULATOR_ID>' CODE_SIGNING_ALLOWED=NO test`。

テスト専用メールは `iphone-validation@example.test`。Mailpitからワンタイムコードを読み、実際のログイン画面へ入力する。Mailpitの既定接続は `http://127.0.0.1:54324`。テスト成果物は一時ディレクトリへ置き、OTP入力を含み得る詳細ログを公開・docsへ転記しない。

初回Expoの案内を閉じる処理を含む。開発メニューを閉じる座標はiPhone 17のテスト画面に基づくため、他画面サイズでは更新が必要。製品のテスト操作はアクセシビリティ要素を使用する。

実機では無料署名のアプリ数上限にUIテストrunnerが当たった。本体インストールは可能。既存アプリを勝手に削除せず、実機UI・実歩行は手動確認として残す。

2026-10-30：メール入力値を照合し、送信前に存在したメールを除外して新着OTPのみ使用する。再送では前回コードを選ばない。MapLibre注釈はXCTestの文字要素として取得できなかったため、`checked-in`画像を目視確認する。送信成功表示だけで地図描画成功と判定しない。

今回はOTP→入街→送信を確認した後、地図を画像確認し、入街済み状態から再起動・退出・再起動だけを一時的な限定テストで実行して成功。保存した一本の試験を先頭から再実行して合格したという記録ではない。UI変更時に該当箇所だけ再確認し、無関係なDB試験・本体ビルドを反復しない。


## 運営のステッカー準備
専用アカウントでログインしたシミュレータを使用。`node scripts/prepare-ui-test.mjs --operator` はこのローカル専用アカウントに限り運営資格を付け、TOTPを初期化する。`-only-testing:Smoke/Smoke/testOperatorStickerPreparation` で実TOTP登録/追加認証→登録→NFC代用→照合→設置→編集→取消を操作する。実タグの検証ではない。設定キー・入力コードを含み得るxcresultやスクリーンショットは一時領域に保管し共有しない。終了後は `node scripts/prepare-ui-test.mjs --revoke-operator` で試験資格とTOTPを廃棄する。公開・交換は別試験に残す。
