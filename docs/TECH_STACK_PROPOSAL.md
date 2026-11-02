# 技術基盤の比較案 v0.1

2026-10-29。Supabase＋PostgreSQLを基盤として採用。単一バックエンド・端末区画化も採用済み。Auth・Realtime・Storage・Edge Functionsを使う構成を設計の土台とするが、メールOTPも採用済み。中核APIはPostgreSQL RPC、配信はprivate Realtimeの変更通知＋再取得で実装済み。他機能への接続は未実装。クラウド契約・作成・デプロイは行っていない。

## 採用した基盤と具体構成の設計方向

Supabaseを中心とし、PostgreSQL、Auth、Realtime、Storage、TypeScriptのEdge Functionsを使う構成を設計の土台とする。これは一つのアプリケーションバックエンドを管理型の部品で構成する案であり、独立した業務マイクロサービス群を作る案ではない。

| 部分 | 候補と役割 |
| --- | --- |
| DB | PostgreSQL。滞在・最新気配・イベント参加等の関連と一意性を管理 |
| 認証 | Supabase Auth。メールOTPを採用。メール所有確認と招待資格は別に検証 |
| 業務API | 当初比較はEdge Functions併用。現行中核は認証付きRPC境界とDBトランザクションに実装。Edge Functionsの新設を必須とはしない |
| 配信 | 招待参加者向けのprivate channel。内部の滞在・気配行を直接購読させない |
| 画像 | Storage。本人アイコンの容量制限・変換・メタデータ除去を別途実装 |
| 削除・通知 | 定期ジョブ。取得時の期限判定とは分離。通知はE01のアプリ内＋Push。中核清掃はpg_cron実装済み。清掃/通知ジョブとAPNs直接送信ロジックを実装。実APNs接続はADP待ち（PUSH_DELIVERY参照） |

API呼び出しを順に並べるだけではトランザクションにならない。退出と気配更新、イベント最後の席、招待の単回消費は同一DB処理で競合制御する。クライアントによる直接更新の抜け道を権限設定で閉じる。管理権限の秘密鍵をアプリに含めない。

## 比較（本プロジェクトへの設計評価）

| 構成 | 利点 | 負担・採否の理由 |
| --- | --- | --- |
| Supabase＋PostgreSQL | 関連データ、一意制約、同時更新をSQLでまとめやすい。認証・配信等を一つの基盤で調達可能 | RLS、API、配信権限、バックアップ等の理解は必要。採用済みだが自動的に要件を満たさない |
| Firebase Auth＋Firestore＋Functions | ドキュメント購読や管理型の機能を利用可能。トランザクションもある | この設計では関係データ・集計用データの持ち方を別途工夫する。TTL削除を10分の公開終了に使えない。実装不可という評価ではない |
| 自前API＋管理型PostgreSQL＋個別認証・配信 | APIと通信を統一して制御しやすい | 調達・統合・配信運用の担当が増える。具体ホスティングを未比較なので価格・性能は評価していない |

## 気配の配信で守ること

Supabase RealtimeのPresenceはオンライン接続の状態であり、夢ヶ丘の物理的な滞在・10分の気配を置き換えるものとして採用しない。

SupabaseのDatabase Broadcastは送信内容をrealtime.messagesに保存する仕様がある。そのため、個人に対応する気配行をそのままbroadcast_changesに渡す方式は避ける案。気配については街単位の「更新あり」のような最小通知を送り、認証付きAPIで期限内の集計を取得する方式を候補とする。個人ID・トークン・区画の移動履歴を通知に含めない。通知だけでも時刻の痕跡は残る。送信元と頻度を制限し、通知をまとめて再取得の集中を防ぐ。

チャットは別の公開データを必要とする。本文直接配信とID通知後取得のどちらにするかは、削除反映・再取得コスト・目標速度を比較して決める。既存接続への利用停止の反映も別設計であり、private channelにするだけで即時停止が完成するとは扱わない。

## 実装・契約前に残る条件

- メールOTPは採用済み。コード期限・再送/試行制限は未確定。一般参加者への認証メールに使う送信サービスと費用も必要。標準SMTPをそのまま本番運用できると仮定しない。
- PostgreSQLの上書きでもログやバックアップに過去の区画が残り得る。バックアップ保持と内部気配の削除条件を確定する。現行の原則7日を満たすかプラン・対象データごとに確認する。
- 月額予算、DB/Functions配置地域、接続・メッセージ・取得量、画像・地図・メールを含む概算を契約前に提示する。無料で本番運用できるとは約束しない。
- 受理→表示p95 1秒は未検証の目標。基盤の機能説明から保証しない。
- この判断ではReact Native/Expoの具体構成、NFCライブラリ、区画サイズ、イベント通知経路を確定しない。

## 一次資料（2026-10-29参照）

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)：TypeScript/Denoのサーバー関数。
- [メールOTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)、[SMTP](https://supabase.com/docs/guides/auth/auth-smtp)。
- [Realtime権限](https://supabase.com/docs/guides/realtime/authorization)、[Database Broadcast](https://supabase.com/docs/guides/realtime/broadcast)：DB配信メッセージの保存・削除仕様を含む。
- [バックアップ](https://supabase.com/docs/guides/platform/backups)、[料金](https://supabase.com/pricing)：契約前にプランと保持対象を再確認。
- [Firestoreトランザクション](https://firebase.google.com/docs/firestore/manage-data/transactions)、[TTL](https://firebase.google.com/docs/firestore/ttl)：削除は即時でなく通常期限後24時間以内、削除までは取得され得る。

採用根拠：Supabase＋PostgreSQLを基盤にする提案に対し、ユーザー「うん、そうしよう。それで行く。」。その後、招待リンク→メールコード認証→プロフィール設定、通常のログイン維持、同じメールでの機種変更というフローにユーザーが「うん。それで良い」と同意し、メールOTPも採用。クラウド契約・料金プラン・デプロイは未実施。ローカル基盤と製品本体の中核部分は実装済み。具体バージョンはlockfileに固定し、K01構成で既存ビルド成功。実装範囲はMVP_IMPLEMENTATION_AUDITを参照する。

## iPhone構成の採用

K01は承認済み。[IPHONE_STACK](IPHONE_STACK.md)を参照。RN＋TypeScript＋Expo開発ビルド、Apple Maps(iOS)/MapLibre(Android、2026-11-02変更)、react-native-nfc-manager、背景観測Swiftモジュール、ローカルビルドを採用。具体バージョン・混在ビルド・実機での成立性は未確認。
