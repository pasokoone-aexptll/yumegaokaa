# Android UI移植（2026-11-24）

基準差分：`5f9e895..1709cce`（264ファイル）。iOS UI完成はユーザー判断。Androidの完成判定は以下の実装・検証で別管理する。旧MVP33タスクの分母/DONE履歴は変更しない。

## 固定作業区分

| ID | 対象 | 関連要件 | 状態・残作業 |
| --- | --- | --- | --- |
| A01 | 共通操作部品・Glass代替・通知遷移 | R10/R19 | 実装済み・型/対象Lint/通知切替2試験成功。Androidで消えるGlass背景、旧ボタン寸法、参加Toggle外周、メニュー素材、通知切替時の旧action保持を修正。API35でMap上のヘッダー/人数/通知/最新へ、参加切替/公開設定メニューを実部品fixture操作確認 |
| A02 | 地図・PIN・配置・sheet・チャット | R10/R12〜R15/R19 | 仮置き/確定のズーム倍率漏れを修正し同位置・同寸法を確認。足元リングドラッグ確認。現在地表示・カメラ余白解除を接続。シートハンドル/角丸/人数展開を接続。Android native footerで半画面→全画面→半画面の固定ボタン表示を確認。チャット新着と送信確定時の重複なしをfixture確認。実データでの作成/編集/保存は未確認 |
| A03 | 登録・QR・Home・通知・設定の全画面 | R03/R18/R19 | 共通画面を再利用。登録メール欄のkeyboard隠れを再現・修正・確認。招待/名前/本人写真/Pool、通知/通知詳細/Block/メールOTP/運営をfixture表示確認。実認証・実カメラ・ログイン後の実データ一巡は未確認 |
| A04 | 表示名・アイコン・native設定・Release | R02/R19 | 提供Icon ComposerのExclude.png/背景グラデーションからadaptive/legacy/monochromeを生成。表示名/QRカメラ権限同期、arm64 Releaseビルド成功。レビュー無効の通常APKもビルド/起動・レビューURL閉鎖を確認。iOSの光学glassはAndroid固有表現として別扱い |
| A05 | 統合確認・残件記録 | R19 | 監査・型・対象Lint・対象テスト・API35のUI確認を記録済み。接続実機0台。実データの全画面一巡と実機特有NFC/カメラ/背景/Pushが残り、Android全体DONEにはしない |

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

前回：5区分とも移植着手前。今回：A01〜A04の必要実装とOS専用差分監査を実施し、利用可能なエミュレーターで対象UIを確認。A05の実データ/実機統合確認は未完。工数は未計測のままで、件数を工数削減率へ換算しない。シートの下端ボタン欠落はA02の既存操作条件に直接関わるため必要修正であり、分母追加はなし。

- テスト不足：ログイン後のHome/実プロフィール/アカウント設定、PIN作成/編集/保存、実チャット送受信、実OTP/QR復号を同じAndroid版で一巡。共通コードがあることを実データ合格に置き換えない。
- 実機待ち：物理Androidで画面密度/keyboard/戻る操作、カメラ/NFC、位置・背景、Pushの確認。現在接続はemulator-5554のみ。
- 配布条件：通常APKも既存ローカル開発用設定と署名。クラウド本番版、Play公開版、iOS再ビルドは含まない。

旧MVP33件は変更なし：実装29/33（87.9%）、統合27/33（81.8%）、iPhone実機11/33（33.3%）、DONE27/33（81.8%）、BLOCKED3/33。今回のAndroid fixture成功を旧実機率やDONEへ加算しない。
