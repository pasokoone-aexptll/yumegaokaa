# T030：保存期限・清掃の対応表

cp119。MVP_REQUIREMENTS 9章を基準とする。既存成功証拠はTECH_VALIDATIONを参照。清掃はmaintenance_jobs('cleanup')から合成されたDB関数とmaintenance-workerで実行する。期限後の取得拒否と物理削除は区別する。クラウドの常時稼働・バックアップはT033。

| 対象 | 期限・処理 | 実装と証拠 | 残る確認 |
| --- | --- | --- | --- |
| チャット | 30日非公開・その後24h以内削除 | 008/019、feature-retention、chat-flow | cp120：定期worker稼働確認 |
| 募集 | 終了後非公開・24h以内削除 | recruitment-retention：親滞在が有効でも削除、cp68 | cp120：定期worker稼働確認 |
| イベント・参加・通知 | 終了/中止から24h | feature-retention：23h保持/25h親子削除、cp68 | 退会通知宛先方針Q08 |
| 気配 | 10分非公開・失効後1h以内削除、退出時削除 | database T08/T13、親ロック競合、cp114再確認 | 常時稼働保証はクラウド |
| 入街試行・終了滞在 | 最小再送情報24h | core cleanup、再送/期限拒否database試験 | cp120：23h保持/25h削除を実DB確認 |
| 入街ログ | 30日 | arrival-chat-flow：30日期限で取得外、cp66 | cp120：29日保持/31日削除を実DB確認 |
| 共通操作受付 | 受付期限後24h | 008、cp119 feature-retention：23h保持/25h削除 | なし（公開再送拒否はcp104） |
| 制限用記録 | 7日 | request_limitsに本文/座標/トークンなし、008、cp119で6日保持/8日削除 | インフラのアクセスログ運用はT033 |
| 通報証拠 | 解決30日、未対応90日整理/180日削除 | feature-retention、report-flow。運営限定の別テーブル | Q08の退会後関係 |
| 運営操作記録 | 90日 | 009、feature-retentionの89日保持/91日削除 | なし |
| ステッカー下書き | 最終更新から7日 | feature-retentionの6日保持/8日削除 | なし |
| 未公開街pool画像 | 24h | 031、cp41のStorage実削除、street-icon-smoke | cp120：稼働PID48042と直近周期成功、既存lease/retryコード照合 |
| 取り下げ/退会画像 | 非公開化後Storage清掃 | 026/031、maintenance-workerのlease/retry、cp41 | Q08、端末キャッシュは下記 |
| 選択画像の端末コピー | upload/変換終了finallyで削除 | avatar.ts、cp84 avatar-cache3件。原本と対象外パスを保護 | cp121起動時回収実装・Swift実ファイル試験成功。cp123本体起動で既存4件→0件。表示用HTTPキャッシュ抑止は未完 |

## 今回の検証範囲

cp119はfeature-retentionへ受付24hと制限用7日を追加し、実DBのworker入口で成功。専用fixtureはトランザクションrollback。既存の機能清掃ケースも同じ入口に含まれるため実行された。新しい保存期間を導入していない。製品コード・ネイティブ変更なし。

ログ確認：maintenance-workerは件数と固定エラー文のみ、APIClientは資格保存失敗のOSStatusのみ。秘密値・本文・座標の出力はこの経路にはない。全インフラログを確認済みとはしない。

T030は未完。残作業台帳のT030-02はcp120で上表の最終照合/worker確認を完了、T030-03は端末キャッシュ、T030-01はQ08として維持する。

cp120：feature-retentionに終了滞在・入街試行・入街ログの期限前後を追加し成功。DB cron有効、19:02/19:03 UTCの2周期succeeded。画像worker PID48042稼働、maintenance67.logの直近2周期は清掃正常（対象0件）。これは現時点のローカル稼働確認であり、Mac停止後/クラウド常時稼働保証ではない。
