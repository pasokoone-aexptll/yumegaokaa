# APNs直接配信（T019 / R13）

2026-11-01承認。外部Push中継サービスは使わず、単一バックエンドのワーカーからAPNsへHTTP/2＋ES256トークン認証で送る。初期規模は同時利用30人。30人での性能を検証済みという意味ではない。

## 実装と境界

- `202611010038_push_delivery.sql`：本人の有効Authセッションに端末tokenを登録。sandbox/productionを分離し、同じtokenの所有者は一つ。token一覧を一般APIに公開しない。ログアウトで登録解除、Authセッション削除・利用停止・退会でも削除する。
- `push_attempts`は通知×端末で一意。成功した端末へ別端末の失敗を理由に再送しない。claimは排他lease、送信直前に会員資格・セッション・参加登録・イベント版と期限を再確認する。既存の疑似配信outboxとは分離する。
- 通信失敗/429/5xxは30秒から最大5分の待ちで再試行。無効tokenは取り下げる。遅れて届いた無効化応答で新しい登録を消さない。403は設定エラーとしてそのバッチを止める。
- APNsの200は「受付」。端末への表示保証ではない。受付後にDB応答を失った場合は再送し得る。同一notification IDをapns-id/collapse-idに使うが、exactly-once配信を保証しない。
- 本文は一般的なお知らせだけ。イベント名・参加者名・座標を含めない。通知タップは認証されたアプリ内お知らせへ遷移し、現在の権限で再取得する。外部URLをpayloadから開かない。
- APNs受付後の通知を参加取消し等で回収することはできない。送信直前の再確認と汎用本文で範囲を限定する。オフラインログアウト時のサーバー失効も即時保証はできない。
- 端末tokenは配信に必要な機密データ。JSやログへ渡さずサーバーの非公開テーブルに保存。attemptは元通知または端末登録の削除でcascade削除し、既存通知の保持期限を延ばさない。

## iOS / 仮UI

`PushNotifications.swift`、Expo AppDelegate subscriber、`usePushNotifications`で接続。お知らせ画面の明示操作で初回許可を求める。通常起動/復帰では許可済みの場合だけ登録を同期。拒否時もアプリ内通知は利用可能。

既定ではPush capabilityを追加しない。Personal Team検証は`unavailable`を表示する。ADP準備後、`YUMEGAOKA_APNS_ENVIRONMENT=sandbox`（配布はproduction）を指定してprebuild/署名する。アプリ環境とワーカー環境を一致させる。APNs設定を追加したビルドはまだ生成・実機確認していない。

## ワーカー起動（外部設定後のみ）

`scripts/push-worker.mjs`は明示起動のローカル用ランチャー。`APNS_PRIVATE_KEY_FILE`、`APNS_KEY_ID`、`APNS_TEAM_ID`、`APNS_ENVIRONMENT`、`APNS_TOPIC`が必要。秘密鍵はリポジトリ外に保管。`node scripts/push-worker.mjs --once`で一巡、指定なしで30秒間隔。クラウドへの配置/secret管理はT033で扱う。今回実際のApple認証情報を設定したり、Appleへ送信したりしていない。

## ローカル証拠と未確認

`tests/push-delivery.test.mjs`で生成したP-256鍵の署名検証、ローカルHTTP/2疑似APNsのヘッダー/本文、実DBの端末登録・認可・端末別再送・古い無効化・参加取消し・利用停止・セッション削除を検証。fixtureはrollbackする。

未確認：実APNs認証/受信/通知拒否、実端末token更新、cold/warm通知タップ、署名されたPush capability、実ネットワークでの再試行。これらが残るためT019はBLOCKEDを維持する。

参照：[Apple APNs応答](https://developer.apple.com/documentation/usernotifications/handling-notification-responses-from-apns)、[トークン認証](https://developer.apple.com/documentation/UserNotifications/establishing-a-token-based-connection-to-apns)。
