# Android UI移植（2026-11-24）

基準差分：`5f9e895..1709cce`（264ファイル）。iOS UI完成はユーザー判断。Androidの完成判定は以下の実装・検証で別管理する。旧MVP33タスクの分母/DONE履歴は変更しない。

## 固定作業区分

| ID | 対象 | 関連要件 | 状態・残作業 |
| --- | --- | --- | --- |
| A01 | 共通操作部品・Glass代替・通知遷移 | R10/R19 | 実装済み・型/対象Lint/通知切替2試験成功。Androidで消えるGlass背景、旧ボタン寸法、参加Toggle外周、メニュー素材、通知切替時の旧action保持を修正。実表示確認待ち |
| A02 | 地図・PIN・配置・sheet・チャット | R10/R12〜R15/R19 | 差分監査中。共通電信PINは接続済みだがAndroid描画/ドラッグ/keyboardは未確認 |
| A03 | 登録・QR・Home・通知・設定の全画面 | R03/R18/R19 | 共通画面の変更を再利用。Android一巡未確認 |
| A04 | 表示名・アイコン・native設定・Release | R02/R19 | Androidは旧アイコン。native設定同期・ビルド待ち |
| A05 | 統合確認・残件記録 | R19 | 接続実機0台。既存API35 arm64エミュレーター起動済み。実機特有NFC/カメラ/背景/Pushは未確認として区別 |

初回残量5区分、工数未計測。区分は進捗管理用でありMVP33タスクへ加算しない。共通コードに既に反映済みであることとAndroid実表示合格を区別する。

## 既存差分の再利用

Home/設定のnested routes、電信PIN/hooks/API、登録6桁自動認証、QR中央マーク、本人写真必須、Welcome/Splash、提供SVG、気配人物列・吹き出しは共通コードに存在。SwiftUI部品は.ios分岐に隔離済み。AndroidはMapLibre、既存の背景観測/認証実装を維持。

## 表現上の制約

`expo-glass-effect` SDK58の非iOS実装は単なるViewでありtintColorが背景にならない。Android adapterで背景色・外形・コントラストを保持する。既存GPU障害対策に従いMapLibre SurfaceViewを背景ぼかしで直接サンプリングしない。iOS Liquid Glassとの光学的一致を保証しない。
