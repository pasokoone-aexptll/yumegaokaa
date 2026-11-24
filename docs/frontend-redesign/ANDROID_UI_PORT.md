# Android UI移植（2026-11-24）

基準差分：`5f9e895..1709cce`（264ファイル）。iOS UI完成はユーザー判断。Androidの完成判定は以下の実装・検証で別管理する。旧MVP33タスクの分母/DONE履歴は変更しない。

## 固定作業区分

| ID | 対象 | 関連要件 | 状態・残作業 |
| --- | --- | --- | --- |
| A01 | 共通操作部品・Glass代替・通知遷移 | R10/R19 | 実装済み・型/対象Lint/通知切替2試験成功。Androidで消えるGlass背景、旧ボタン寸法、参加Toggle外周、メニュー素材、通知切替時の旧action保持を修正。API35でMap上のヘッダー/人数/通知/最新へ、参加切替/公開設定メニューを実部品fixture操作確認 |
| A02 | 地図・PIN・配置・sheet・チャット | R10/R12〜R15/R19 | 仮置き/確定のズーム倍率漏れを修正し同位置・同寸法を確認。足元リングドラッグ確認。現在地表示・カメラ余白解除を接続。シートハンドル/角丸/人数展開を接続。Android native footerで半画面→全画面→半画面の固定ボタン表示を確認。チャット新着と送信確定時の重複なしをfixture確認。ローカルAPIで自身のPIN作成→位置確定→保存→編集→再保存・詳細への反映を確認 |
| A03 | 登録・QR・Home・通知・設定の全画面 | R03/R18/R19 | 共通画面を再利用。登録メール欄のkeyboard隠れを再現・修正・確認。招待/名前/本人写真/Pool、通知/通知詳細/Block/メールOTP/運営をfixture表示確認。ローカルOTP実認証、名前・写真選択/切り抜き・Storage保存、Welcome/Homeを確認。Home/プロフィール/Pool/アカウント/招待QR/Block/運営資格なしも実API表示確認。実カメラQRは未確認 |
| A04 | 表示名・アイコン・native設定・Release | R02/R19 | 提供Icon ComposerのExclude.png/背景グラデーションからadaptive/legacy/monochromeを生成。表示名/QRカメラ権限同期、arm64 Releaseビルド成功。レビュー無効の通常APKもビルド/起動・レビューURL閉鎖を確認。iOSの光学glassはAndroid固有表現として別扱い |
| A05 | 統合確認・残件記録 | R19 | 監査・型・対象Lint・対象テスト・API35のUI確認を記録済み。接続実機0台。主要4タブと設定の実データ一巡を追加確認。複数人操作・運営MFA/招待取消も実API確認。利用可能端末での移植確認を完了。物理AndroidのNFC/カメラ/背景/Pushは未確認で、Android製品全体DONEにはしない |

初回残量5区分、工数未計測。区分は進捗管理用でありMVP33タスクへ加算しない。共通コードに既に反映済みであることとAndroid実表示合格を区別する。

## 既存差分の再利用

Home/設定のnested routes、電信PIN/hooks/API、登録6桁自動認証、QR中央マーク、本人写真必須、Welcome/Splash、提供SVG、気配人物列・吹き出しは共通コードに存在。SwiftUI部品は.ios分岐に隔離済み。AndroidはMapLibre、既存の背景観測/認証実装を維持。

## 表現上の制約

`expo-glass-effect` SDK58の非iOS実装は単なるViewでありtintColorが背景にならない。Android adapterで背景色・外形・コントラストを保持する。既存GPU障害対策に従いMapLibre SurfaceViewを背景ぼかしで直接サンプリングしない。iOS Liquid Glassとの光学的一致を保証しない。

## OS専用差分の監査

基準差分にあるiOS専用UIはNativeAction/NativeIconButton/NativeToggle/PinAuthorMenu、MapErrorDialog/MapStatusBanner/ModeDropdown/ParticipationSwitch/PlatformMap、OperatorFormとStreetBackdrop/NativeSheetAppearance/CityParticipationSwitch。NativeToggleは既存Android標準Switch、PinAuthorMenuは同じ通報/ブロックcallbackを持つAndroid標準Alertを再利用。他は今回のAndroid部品、既存HistoryBlur/SheetHandle、共通画面へ対応付けた。

Swift APIClientのcreateAccount指定は既存platformAuth.androidのshouldCreateUserへ既に対応済み。Swiftのローカル診断ログ/Simulator通信障害注入はiOS検証用であり、Androidの製品UI要件として追加しない。MapLibreの地図データ/初期pitch/GPU対策、PIN文字のAndroid単色表現は基準以前の既存方針を維持。

レビューAPKはEXPO_PUBLIC_UI_REVIEW=1かつemulatorでのみfixture表示。認証・実データ経路を確認した意味ではない。ビルド時の既存.env.localはローカル開発接続先であり、本番クラウド版の配布/Play公開は今回実施しない。

## 今回の到達点と残件

前回：5区分とも移植着手前。今回：A01〜A04の必要実装とOS専用差分監査を実施し、利用可能なエミュレーターで対象UIを確認。A05の利用可能なAPI35エミュレーターによる実データ統合確認を完了。物理端末の受入は未完。工数は未計測のままで、件数を工数削減率へ換算しない。シートの下端ボタン欠落はA02の既存操作条件に直接関わるため必要修正であり、分母追加はなし。

- 製品受入の未確認：実カメラQR受付。運営MFA/招待取消、別アカウントのチャット受信・PIN参加/名簿は確認済み。ローカルOTP/プロフィール保存/PIN作成・編集、Home/設定、本人チャット送信とタブ再訪表示、通知詳細・既読操作は確認済み。共通コードがあることを実データ合格に置き換えない。
- 実機待ち：物理Androidで画面密度/keyboard/戻る操作、カメラ/NFC、位置・背景、Pushの確認。現在接続はemulator-5554のみ。
- 配布条件：通常APKも既存ローカル開発用設定と署名。クラウド本番版、Play公開版、iOS再ビルドは含まない。

保存済み：`78c6250`（共通操作部品）、`4673e73`（Map/PIN/登録/native設定と検証記録）。作業ツリーのコード変更は保存済み。初回環境点検ではadb接続はemulator-5554のみ、ローカルAPIは停止。後続サイクルでColimaと夢ヶ丘の既存コンテナを再開し、認証APIのHTTP 200とゲートウェイ54325を確認。クラウド検証環境は照会中だが、ローカル合成アカウントによる実データ確認を先行する。既存データ初期化やクラウド設定変更は行っていない。

旧MVP33件は変更なし：実装29/33（87.9%）、統合27/33（81.8%）、iPhone実機11/33（33.3%）、DONE27/33（81.8%）、BLOCKED3/33。今回のAndroid fixture成功を旧実機率やDONEへ加算しない。

### ローカル統合検証の準備（継続中）

Colima停止とDB以外のコンテナ停止を切り分けて復旧。CLI migration up --localは履歴050/051/052欠番で停止し、新規移行は実行されていない。実DBでは051の関数本文（street_api_before_pin_activityへ改名済み）、055の2関数、056のstreet_api本文がリポジトリと一致。重複適用や履歴の無条件修復はしない。

通常ReleaseはローカルHTTPを許可していないため、ローカル接続確認には既存Debug manifestのusesCleartextTraffic設定とMetroを使用。既存.env.localは変更せず、起動プロセスだけ10.0.2.2を指定。実SMTP_HOSTがsupabase_inbucket_yumegaoka、port1025であることを確認し、外部メール配送を避ける。物理Androidは引き続き未接続。DebugビルドとローカルOTP実認証は成功。合成アカウントandroid-ui-port-20261124@example.testのみを作成。招待資格は既存local:invite補助で付与したためQR受付の証拠ではない。名前/写真選択/切り抜き/Storageへのavatar・Pool保存、Welcome/Home、PIN作成/地図指定/保存/本文編集/再保存を実操作確認。全画面一巡は継続中。

### 実接続で検出したnative競合（R04〜R09/R19）

認証後のlistener.removeで「Received 1 arguments, but 0 was expected」を再現。アプリのstopObservingがExpo EventEmitterの同名ライフサイクルを上書きしていたためstopVisitObservationへ変更。対象4試験/型検査/対象Lint/Debug再ビルド成功。再インストール後にセッション復元、プロフィール・PINの複数遷移を行い、新しい同エラーなし。修正後の通常Releaseも成功（/tmp/android-port-native-final-release.log、1分8秒）。最終Releaseの再インストール・通常起動と確認範囲のクラッシュログなしを確認。ローカルHTTP保護により実API確認はDebugへ戻して実施。

追加実データ証拠：/tmp/android-local-account-small.png、android-local-profile-settings-small.png、android-local-account-settings2-small.png、android-local-pool-small.png、android-local-invite-small.png、android-local-blocks-small.png、android-local-admin-small.png。Android表示の実招待QRをApple Visionで1件復号（非空payload確認、実カメラ受付とは別）。本人チャット入力・送信・確定・タブ再訪はandroid-local-chat-input-small.png、android-local-chat-sent-small.png、android-local-chat-return-small.png。通知生成・詳細・了解操作はandroid-local-notifications-small.png、android-local-notification-detail-small.png。

追加サイクル：合成相手android-ui-peer-20261124@example.testをローカルだけに準備（プロフィールは検証用fixture）。別セッションのcommand API投稿がAndroidに新着表示されることを確認。相手の募集PINをHomeから開き、半画面の参加ボタン→参加確定→人数1/3→全画面の主催者/参加予定名簿と固定ボタンを実APIで確認。証拠/tmp/android-local-peer-receive-small.png、android-local-peer-home-small.png、android-local-peer-join-small.png、android-local-peer-roster2-small.png。最終Release起動証拠/tmp/android-port-final-release-launch-small.png。

## 移植タスクの最終照合（2026-11-24）

元の目的は5f9e895..1709cceのUI移植、Androidビルド、利用可能な端末確認、未確認の明示。下表の範囲を完了し、Android製品全体の実機受入とは区別する。旧33タスクや物理端末の達成条件は変更しない。

| 目的 | 現在の根拠 |
| --- | --- |
| 基準差分の監査と移植 | 264ファイルを監査。共通画面/hooks/APIは既存共通実装を再利用。OS専用差分の対応は本書の監査節。Swift診断/Simulator障害注入はiOS検証用途、UIKitの外観・sheet・操作はAndroid adapterへ対応付け |
| 共通画面・Android専用UI | 78c6250/4673e73。Glass、操作部品、Map/PIN、シート、登録keyboard、運営Form、アイコン/権限を実装。各対象画像・試験はTECH_VALIDATIONと本書に対応 |
| Androidビルド | arm64 Debug/Release成功。最終Releaseはf0adf90のnative修正を含み、インストール/起動成功。既存全体LintのHooksエラーは残り、変更対象Lint/型検査/対象試験は成功 |
| 利用可能な端末での確認 | adbの接続はAPI35 emulator-5554のみ。登録/OTP/画像保存/Home/設定/PIN作成編集参加/名簿/チャット送受信/通知/招待QR/運営MFAと招待取消を実API経路で確認。fixtureで遷移・空状態・sheet往復も確認 |
| 記録と保存 | 実装・確認・未確認を本書/TECH_VALIDATION/SESSION_HANDOFFに記録し、サイクルごとにローカルcommit。既存データ初期化・クラウド配備・iOS再ビルドなし |

運営追加証拠：ローカル合成本人だけに一時的な運営資格を付与。通常の認証アプリ登録とTOTP入力でAAL2へ進み、実招待一覧→自分の未使用招待の取消確認→取消後のswitch更新を確認。/tmp/android-local-admin-mfa-small.png、android-local-admin-ready-small.png、android-local-admin-revoke-small.png、android-local-admin-revoked-small.png。検証後に資格をactive=falseへ戻し、設定キーを含む一時XMLを削除した。他人の招待・会員を操作していない。

未確認：物理Androidの実カメラQR受付/NFC/背景測位/Push、端末ごとの画面密度/keyboard、クラウド本番接続/配布。利用可能端末がないため確認済みとはしない。iOS Liquid Glassの光学的一致はAndroidの実装保証対象ではなく、機能・配置・視認性をAndroid表現で移植した。依存更新時はunstable_sheetFooterの再確認が必要。
