# App Store向けビルド準備

2026-11-25。C06／T033／R18。設定検査を実装済み。署名・Archive・配備・提出は未実施。

## 設定を確かめる

`npm run store:config` はExpoの実際のdotenv読み込みを使い、`YUMEGAOKA_STORE_BUILD=1` を付けて設定を評価する。ファイル生成、バックエンド変更、ビルド、アップロードはしない。全設定や秘密値を標準出力へ出さない。

必要な環境変数（値は公開資料に貼らない）：

| 変数 | 条件 |
| --- | --- |
| `YUMEGAOKA_STORE_API_ORIGIN` | 提出用に選んだSupabase HTTPS origin。開発用.envの暗黙流用を避けるため別途明示 |
| `EXPO_PUBLIC_SUPABASE_URL` | 上のoriginと完全一致。現在は `https://<project>.supabase.co` のみ許可、末尾スラッシュなし |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 対応プロジェクトの公開キー。service_roleや秘密キーを入れない |
| `EXPO_PUBLIC_STREET_ID` | 対象街のUUID。既定fixtureへのフォールバックを使わない |
| `EXPO_PUBLIC_REGISTRATION_DECLARATION` | `1`。058配備と公開規約設定を先に完了する |
| `YUMEGAOKA_APNS_ENVIRONMENT` | `production` |
| `APPLE_TEAM_ID` | ADP加入後の10文字のTeam ID |
| `EXPO_PUBLIC_GATEWAY_URL` | 通常利用者用のWSS接続先が必須。審査専用ホスト、資格情報・query・fragmentは使用不可 |

審査デモ設定はアプリの審査ログインと提出前検査で共有する。通常利用者用に審査Supabaseや審査用ゲートウェイを指定すると、設定評価時点で停止する。

このモードではLOCAL_ENTRY、VALIDATION_RELEASE、FIELD_TRIAL、UI_REVIEW、SIMULATE_READ_OUTAGEの有効化を拒否する。iOSの開発用ローカルネットワーク説明・ATS例外を生成設定から取り除く。通常の開発設定は保持する。

**検査成功は公開可能の判定ではない。** originの選択が正しいか、キーの権限、街の公開状態、gatewayの稼働、APNs証明／鍵／provisioning profile、削除worker、各手動ゲートは別に確認する。カスタムAPIドメイン採用時は許可条件をレビューして変更する。

## Archiveまでの順序

1. ADP有効化、提出用Bundle IDとTeamを確認。現在の `jp.yumegaoka.development` を勝手に変更しない。変更するとKeychain・既存インストール・Push登録などへの影響がある。
2. バックエンド・街・公開キーを確定し、上の変数を同じシェル／ビルド環境へ設定。開発フラグを無効化し `npm run store:config` を実行。
3. **prebuildとJS bundleを作るArchiveの両方で** `YUMEGAOKA_STORE_BUILD=1` と同じ環境を維持する。検査コマンドを一度実行しただけでは、別のXcodeビルドに環境は引き継がれない。
4. iOS prebuild後、生成Info.plist・entitlements・Expo設定を確認。NFC、location、production APNsが実際に含まれること、ローカルATS例外が残っていないことを確認する。
5. Distribution署名でArchive。最終.app／埋込みprofile／JS bundleを照合。ビルド番号、SDK、Privacy Manifest集約、開発用フラグ、通信先、export complianceを確認する。
6. TestFlightでOTP・招待・位置権限・NFC・通知・通報・ブロック・退会を一巡。App Privacyの申告と通信を照合する。
7. `.app-review-readiness.json` を証拠付きで更新し、complianceとmetadata監査。未確認をpassにしない。

現在このモードは明示的なビルド準備用。モードを付けずに行うXcode Archiveまで機械的に禁止する仕組みではない。最終バイナリ照合を省略しない。

## 今回の検証

- store-configとvalidation-releaseの4テスト成功。混入フラグ、未設定、URL取り違え／HTTP／資格埋込み、APNs sandboxを拒否し、NFC plugin・位置説明と開発設定の維持を確認。
- 実環境の `npm run store:config` はexit 2で停止（未準備の期待結果）。
- 架空の公開値を明示したExpo設定の評価はexit 0。ネットワーク接続や実配信・署名の検証ではない。
- 既存validation-release試験の旧表示名とReact Native Platform mockを現行実装へ合わせた。製品の条件緩和なし。
