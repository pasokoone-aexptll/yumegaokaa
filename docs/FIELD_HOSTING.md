# 街での試験運用案（2026-11-05）

採用案は月$7の短期現地試験。利用者向けWebサイトの作成は現地試験の前提にしない。

初期想定は1街・同時30人、Supabaseプロジェクト1つ。端末はSupabaseの認証・RPC・非公開Storageを使い、街の変化は専用WebSocketゲートウェイから受け取る。Macを停止してもこれらとメールOTP、定期削除が動くことを配備の条件にする。

| 案 | 月額の目安（USD） | 適した使い方 |
|---|---:|---|
| Supabase Free + Render 1台 | $7 | 短期の持ち出し。DB 500 MB、Storage 1 GB、1週間未使用で一時停止。バックアップは別途準備。 |
| Supabase Pro + Render 1台 | $32 | 継続運用候補。ProのMicro 1プロジェクトと日次DBバックアップ7日。ゲートウェイと定期処理を1台にまとめるため、再起動時は両方が止まる。 |
| Supabase Pro + Render 2台 | $39 | 定期処理を別workerへ分離。配信・削除処理の再起動をWebSocket接続から独立させたい場合。 |

Render Hobbyの512 MB常時稼働を1台$7として算出。SMTPはResend Freeの100通/日・3,000通/月以内を想定し、送信ドメインのDNS設定が必要。超える場合のProは追加$20/月。税、ドメイン、通信・Storage超過、地図タイルの提供契約は別枠。Proは通信250 GBを超えると通常egress $0.09/GB。仮に1ドル150円なら$32は約4,800円/月。30人が1日1回OTPを要求すると月約900通、各人4回では日上限を超える。負荷・通信量は配備先で実測する。

料金の根拠は[Supabase](https://supabase.com/pricing)、[Render](https://render.com/pricing)、[Resend](https://resend.com/pricing)。

## 配備前の実装点検

- ゲートウェイの接続数制限はプロセス内にあるため1台で運用する。端末は既にEXPO_PUBLIC_GATEWAY_URLで外部WSSを指定できる。PostgresのLISTEN用にはセッションを維持する接続が必要。
- ローカルmaintenance-workerは通知を疑似配信する。本番では削除処理と実配信だけを起動する。サービス鍵・DB接続情報はサーバーに限定する。
- 過去のSQLにはRealtimeへの送信が残る。ローカル再構築には同スキーマが必要。配備時は通常のSupabaseスキーマを適用し、余分な送信の負荷は計測後に整理する。
- 復元対象にはDBに加えて画像オブジェクトがある。配備前に画像の保全方法、復旧手順と権限を決める。運営アカウントは環境別に管理する。
- 現地のiOS入街はADP待ち。検証用ローカル入口を公開環境にそのまま開放しない。Androidは実タグで確認し、iPhone用試験入口が必要なら対象アカウントと期限を限定する設計をレビューする。
- 配備後は30人で再接続・投稿・画像取得時の失敗と遅延を測る。現時点で月額は見積もり、同時利用性能は未計測。

現地試験用Freeプロジェクトでメールテンプレート変更を試したところ、標準SMTPでは管理APIがHTTP 400を返した。標準メールはリンク形式。コードを手入力する既存フローにはカスタムSMTPが必要。独自ドメインは一般参加者のメール送信を始める段階で準備する。標準SMTPは時間あたり2通が目安。[Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

Renderの単一サービス定義は render.yaml、起動入口は scripts/field-gateway.mjs。PostgresにはTLS検証付きのセッション接続を使い、清掃処理を同居させる。実Push workerは別途資格・設定後に接続する。クラウドへの移行、確認コード用メールテンプレートの設定、実際の携帯回線からの受信は配備先で確認する。

現地プロジェクトのOTP桁数はユーザー指定の6桁を適用済み。再比較で該当差分0件。メール本文はカスタムSMTP待ち。Renderのyumegaokaワークスペースへログイン済み。配備先のソースにExisting Imageを使えるため、ゲートウェイだけを含むイメージ定義をdeploy/fieldに用意した。レジストリ・実配備は未設定。

30人の接続・再接続は、試験専用30アカウントの短期access tokenを1行1件で標準入力し、`node scripts/field-reconnect-check.mjs wss://yumegaoka-field.onrender.com/street` で計測する。全員が同時にreadyになったことを確認してから接続を閉じ、同じ30人で再接続する。出力は各回の件数・readyまでのp95・最大時間。投稿・画像の負荷は別計測。
