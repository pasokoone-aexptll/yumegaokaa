# T029：固定完了条件の証拠対応（cp104 / 2026-10-31）

要件8章とT029の既定条件を照合。追加要件ではない。過去の成功を関連変更なしで再実行しない。RN画面一巡・実機はT031/T032、クラウド配備はT033。

| 条件 | 現行実装 | 確認証拠 |
| --- | --- | --- |
| 招待単回/7日/7日5件 | 004招待API、027共通受付、032運営枠 | cp50同時受領/上限、cp96期限拒否、invitations試験 |
| チャット500字/10秒5件/1分20件 | 005execute、027の会員行ロックで直列化 | chat-limits成功（TECH_VALIDATION）、chat-flow再送非増加 |
| 履歴50件/10秒5回 | 019chat_read_api、会員ロック | chat-limits、chat-read-concurrency、cp86の125件空白をページ回復 |
| 募集同時1/ピン毎分3（取消でも枠維持） | 007、共通会員ロックとrequest_limits | cp93 recruitment-flow/concurrency、取消再作成の拒否 |
| イベント同時3/90日/24時間、50字/1000字 | 006execute_event_command、編集API、共通会員ロック | cp98 event-flow境界/4件目拒否、cp75編集権限 |
| 1端末原則1、アカウント3接続 | gatewayConnection、realtime-gateway、単一runtime排他、035＋local realtime無効 | cp100/103同時4本→3本のみ、失効切断、無応答枠解放、直接WS拒否、実Auth再接続 |
| 画像2MB/再エンコード/メタデータ除去 | avatar共通変換、Storage bucket制限/所有権policy | avatar-smoke、cp56/58/59変換実体、cp69/70実機、avatar-conversion |
| 10分受付/24時間結果、削除後再生成なし | 027command_api：サーバー発行ID/owner照合、ロック、期限、body hash、存在しないID拒否。清掃処理はT030 | chat-flow期限/取消/同一結果、cp104他人受付/本文変更/受付削除後の再送拒否、行数1維持 |
| 資格停止/越権/署名偽装 | 公開API guard、各所有権/運営MFA検査、gatewayAuthorizer | account-access/operator-access/member-operations既存成功、cp101/103実GoTrue署名/会員/session失効、機能別owner拒否 |

cp104追加実行：chat-flowのみ成功。cp103型/Lintは製品コード変更がないため再利用。全機能の運営画面確認までT029のDONEへ含めず、T024/T031に維持する。ローカルゲートウェイの常駐起動は `npm run realtime:local`。新しいアプリの画面での接続確認は未実施でT031に残す。
