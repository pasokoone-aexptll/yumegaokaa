# App Privacy申告の実装根拠

2026-11-25。C05／R03/R07/R15/R17/R18。ソース照合資料。App Store Connectへの申告、Release通信・最終Archive照合は未実施。

## 申告候補と未確認の境界

| 経路 | 確認した実装 | 申告時の扱い・残確認 |
| --- | --- | --- |
| 認証 | APIClient.swiftはSupabase Authへメール・OTPを送信、資格はKeychainに保存 | Email Address／User ID、App Functionality、本人との関連あり。OTP配信先と基盤ログを照合 |
| プロフィール | avatar.ts→profile_avatar_set、表示名と本人写真必須 | Name／Photos or Videos。本人写真と街pool画像は用途を分ける |
| 画像変換 | avatar.tsでpickerのexif:false、512以内の再レンダリングとJPEG出力、2MB以下を判定 | exif:falseは選択結果にEXIFを返さない設定だけではメタデータ除去の証明にならない。保存された実JPEGのGPS/EXIFを検査して確定 |
| 気配観測 | PresenceEngine.swiftは端末で生GPSをGrid.project。observe要求はvisit_id・seq・area_version・observed_at・horizontal_accuracy_m・verdict、通常公開時はcell_id／grid_versionを追加 | Location、本人との内部関連あり。100m区画だけでCoarseと即断しない。Appleの精度定義・区画復元可能性と照合 |
| ゴースト | 非公開状態ではcell_idを送らない分岐があるが、滞在の状態・精度・時刻等は送信 | 「一切収集しない」と説明しない。状態切替中の要求も実通信で確認 |
| PIN | denshin_pinsに指定座標・本文・作者・参加情報を保存 | User Content／Location。指定座標と本人の現在位置は同一とは限らない。気配の区画化とは別扱い |
| 投稿・通報 | messages／reports、通報証拠は別管理 | Text Messages／Other User Content等を実用途で選択。退会本文削除と通報証拠保持は別確認 |
| 通知 | push_devices・通知配信、iOS APNsトークン | User ID等の分類を確定。通知本文・保持期間・配送ログを点検 |
| 診断 | APIClient.swiftの失敗診断は端末内、URL・payload・account ID・資格を除外 | この診断だけを外部収集と扱わない。一方Supabase/Render等のログは別途確認 |
| 地図 | iOSはApple Maps。AndroidはMapLibre／OpenFreeMap系style | iOSのApp PrivacyにAndroid専用通信を混ぜない。iOSへリンクされるSDKと実際の通信はArchiveで照合 |

根拠：[Apple App Privacy定義](https://developer.apple.com/app-store/app-privacy-details/)。用途がApp Functionalityだけでも対象データの申告は必要。端末内限定処理と、要求処理以上の期間アクセス可能な外部送信を区別する。

## SDK照合表（apps/mobile/package.json・iOSソース確認）

| グループ | 主な依存 | 確認事項 |
| --- | --- | --- |
| ランタイム／画面 | React Native、Expo、expo-router、@expo/ui、screens、safe-area、SVG等 | SDK同梱Privacy Manifestと署名、Required Reason API集約をArchiveで確認 |
| 認証／保存 | Supabase JS、expo-secure-store、native Keychain | iOSはnative Auth経路。JS依存の存在だけで全通信を決めない |
| 写真／カメラ | expo-camera、image-picker、image-manipulator、image、file-system | QR以外の撮影用途、音声権限、画像キャッシュ・実アップロード内容を確認 |
| 位置／地図／NFC | react-native-maps、MapLibre、nfc-manager、PresenceNative | 実行OS別の通信先、背景位置、NFC entitlementを確認 |
| 開発 | expo-dev-client、各review route | store設定はUI_REVIEW等を拒否。開発SDKが最終Archiveでどう構成されるかは別確認 |

この依存表で広告SDK・広告識別子・追跡目的の実装は確認していない。これを最終のTrackingなし申告にはまだ使わない。現在のPrivacyInfo.xcprivacyのCollectedData空配列も「収集データなし」という結論ではない。

## 退会の残検証

057はchat本文・PIN本文の消去を追加。maintenance.mjsはavatarsの本人パスを削除してからAuthのsoft delete、成功時だけjob完了、失敗時retry。街pool画像は独立したicon_cleanupで回収する。soft deleteを物理完全消去と同一視しない。

提出前に、クラウド057適用状況、本人以外から画像・本文が見えなくなること、Auth/Storage job完了、失敗再送、残る通報証拠・監査・バックアップの期限と説明を照合する。所有者不明の過去匿名投稿をこの作業で削除しない。
