# バックエンド実行経路の監査コンテキスト

2026-11-25。audit-context-buildingによる静的な処理理解。欠陥の断定・重要度付け・修正・クラウド操作は行っていない。対象はgateway、退会清掃、pushの実行経路。DB全体、実配備資格、通信実測は本調査の対象外。

## 入口と境界

- 本番候補入口 `scripts/field-gateway.mjs:10-30` はHTTPS API、verify-full付きDB URL、service key、公開キー、street IDを受け取る。gatewayと清掃を起動、FCM資格があればFCMも起動する。APNsはこの入口から起動されない（同:1-3,19-21,37-40）。
- WebSocket `/street` はBearerをAuth APIで照合後、DB会員・session・現行同意を検査する。Socketは受信専用で変更通知に本文を含めない。
- 退会清掃はservice_role REST RPC→Storage削除→DB依存レコード整理→Auth hard delete→完了確認。通常会員APIからこの処理を直接実行させない権限設定をmigration059に確認。
- APNs独立runnerは `scripts/push-worker.mjs:18-25` でローカルSupabaseのみ許す。FCMはfield gateway内で起動可能。実際の本番APNs配備はこのコードから確定できない。

## 関数記録

- [gatewayAuthorizer / startGateway / WebSocket](functions/BACKEND_GATEWAY.md)
- [maintenanceTick / account_erasure](functions/BACKEND_ERASURE.md)
- [deliverPush / APNs / FCM](functions/BACKEND_PUSH.md)

## 複数機能にまたがる前提

| ID | 依存している条件 | 根拠・未確定 |
| --- | --- | --- |
| B-A01 | apiURL、DB URL、service key、公開キーが同じ環境を指す | field-gatewayは各値の存在とHTTPS/TLSを検査するが、同一projectへの束縛検査は `nothing found`（field-gateway:10-30）。実配備設定の照合が必要 |
| B-A02 | gatewayのadvisory lockは同じDBの全instanceで共有される | gateway-runtime:69-89。DB接続がsession poolingであることはコメント/環境前提。実プーラー種別は未調査 |
| B-A03 | `/healthz` 200がDB清掃や認可成功を表すとは限らない | realtime-gateway:9-15はclosingだけを検査。rolling handoverは意図的にlock取得前HTTPをlisten（runtime:80-89） |
| B-A04 | StorageのDELETE成功後もメタデータが消えている | icon_cleanup:19、account_erasure:27-33がDB側で確認。Storage APIの実体削除は外部依存 |
| B-A05 | Pushは少なくとも一回配信、exactly-onceではない | push-delivery:1-2,20-31。送信成功とDB受付の間で失敗すると再送する。固定IDは重複抑制に使うが端末表示一回を保証しない |
| B-A06 | 本番iOS push senderが存在する | field-gatewayにはFCMだけ、APNs runnerはlocal-only。別配備の証拠は本範囲に `nothing found` |

## 次段階へ渡す確認事項

1. API/DB/鍵/街の環境一致、DB role権限、pooler session性を本番の秘密を表示せず照合。
2. 多数socket下で5秒ごとの再認可と変更時再認可が重なった際のAuthレート制限・待ち時間を確認。集約上限の実測は未実施。
3. 退会画像が非常に多い場合、assets一覧取得後の5分lease以内に全削除できるか。workerは画像ごとにlease延長しない（maintenance:56-65）。
4. icon cleanupのretry RPC自体が失敗した場合、そのtickは途中終了し、同周期のaccount cleanup/FCMへ進まない（maintenance:45、field-gateway:39-44）。期限切れleaseで回復するが、稼働監視の証拠は別途必要。
5. 本番iOS通知の配備経路・実APNs到達を確認。送信文言はAPNs/FCMとも「夢ヶ丘」で、現行アプリ名「電信出口」と異なる（apns:151、fcm:32）。これは表示事実であり、送信障害の断定ではない。

今回ソース変更・試験実行なし。実行権限、最終DB関数定義とクラウドの実挙動は主監査へ引き継ぐ。
