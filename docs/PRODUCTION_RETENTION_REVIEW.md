# 本番候補環境の保存・削除点検

2026-11-25（JST）。C02/C05/C06、R17/R18/R19。既存の現地試験環境 yumegaoka-field を確認。本番への転用・提出可否は未確定。個人ID・投稿本文・秘密値は取得結果へ出力していない。

## 確認結果

| 対象 | 今回の証拠 | 判定と残件 |
| --- | --- | --- |
| DB migration | linked projectを確認し、read-only transactionで履歴を照会。最新059。057単独、続いて059単独のdry-run後に配備成功 | 退会本文削除は配備済み、058年齢申告は未配備。新規登録を止める058は正式ポリシーとアプリの準備前に適用しない |
| DB清掃 | yumegaoka-cleanupがactive、毎分。11/25 05:31〜05:35 JSTの直近5件succeeded | 定期実行を確認。全テーブルの物理削除や将来の稼働保証ではない |
| 退会後のDB残存 | 所有者なし本文、退会者の本文付きchat／PIN、退会者を対象としたreport、account cleanup待機が各0件 | 現時点の対象件数のみ。旧イベント／募集、Auth、Storage、端末キャッシュは別途確認。0件で退会実操作の成功とはしない |
| Storage | オブジェクト総数11 | 内訳・所有関係・削除完了は未検証。画像本体の取得なし |
| 日次バックアップ | run45323128200初回失敗。Dockerイメージ取得時のtoomanyrequests/Data limit exceeded | ユーザー承認後、同runの失敗ジョブを再実行しsuccess。2026-11-25 05:39 JST、暗号化・非公開R2アップロード・暗号文読み戻し比較が成功。復号／復元試験は今回未実施 |
| R2保存期限 | 既存運用はdaily/の7日保管（FIELD_BACKUP） | S3資格での読取はAccessDenied。その後、Cloudflare管理画面でexpire-daily-backups／daily/／Delete objects after 7 day(s)／Enabledを確認。APAC、公開URL無効、独自ドメインなし、バケットロックなしも確認 |
| 復元時の再削除 | 初回の隔離復元成功は既存証拠 | 退会後に古い世代へ戻した際の削除再適用、認証・画像の照合手順が未完。バックアップ7日だけで削除完了期限を決めない |

## 次の作業

1. 057は配備済み。配備専用ブランチのworkerを9fa778cへ更新。Renderの実稼働版9fa778cと定期清掃を確認済み。059のhard deleteへ移行済み。検証範囲は後段参照。
2. 058は規約正文・版・URL・アプリ有効化を揃えてから配備する。公開中の準備中ページをregistration_policyへ設定しない。
3. バックアップのイメージ取得失敗対策（再試行／事前取得）を別途整備する。今回の再実行成功だけで再発防止済みとしない。
4. R2 lifecycleの7日設定は管理画面で確認済み。復元後の再削除手順を確定する。
5. 委託先ログ、問い合わせ保持、国外取扱い、通報証拠の保持根拠を詰めて公開ポリシーへ反映する。

## 公開サイトとの関係

https://hello.dreamcloud.sh にトップ、問い合わせ・削除依頼、運営者情報を公開。privacy/termsは準備中の案内のみ。匿名HTTPSで各ページ200を確認したがC01全体は未完。私的氏名・住所、DB接続資格、バックアップ内容をサイトへ含めていない。

## 057配備後の対象確認

クラウド上の配備済み関数に対し、合成アカウント・街・本文・PINをtransaction内だけ作成。再認証なし拒否、OTP再認証付き退会成功、本人本文消去、他者本文維持、PIN本文消去・閉鎖、清掃job追加、同一要求再送をassertして全変更ROLLBACKした。実利用者の退会・Storage削除・Auth管理APIをこの試験で実行していない。

## 配備された保存期限

クラウドのpg_get_functiondefで確認。chat作成30日、command期限後24時間、rate記録7日、旧event終了等から24時間、operator audit90日、report未対応180日／解決30日、終了visit24時間、arrival log30日、PIN失効／削除24時間、通知24時間、未公開NFC draft7日／公開draft90日。いずれも清掃対象になる条件であり、障害時を含む完了保証ではない。

Supabaseプロジェクトはap-northeast-1（東京）、ACTIVE_HEALTHY。R2はAPACであり、全情報が日本だけに保存されると表現しない。

## 認証情報・通報証拠の修正（059）

ユーザー承認：通報証拠は原則退会時削除、問い合わせメール・記録は対応完了後90日削除、手数料無料。

059をクラウドへ適用。退会時に通報者／対象者として関連するreportを消去。service_roleと有効な清掃leaseでのみaccount_erasureを実行できる。Storageの所有物・プロフィール画像・pool画像の一覧を取得し、Storage APIで消去してから業務表の参照を削除する。Auth管理APIにshould_soft_delete=falseを渡す。Auth／memberが残る間はfinishを拒否し、失敗時のjobは再試行する。DB整理とAuth消去の間の再登録も拒否する。

058に依存しない設計で、057→059の順でクラウド適用済み。後で058を適用する際は順序差を確認し、dry-runで058のみを対象としてinclude-all等を判断する。未公開の規約URLを設定しない。

配備専用ブランチcodex/field-runtimeの9fa778cをRenderへ手動配備。2026-11-25 06:04:11 JST、deploy dep-dc2vndd9el5s73d0h9ugがLive。自動配備は無効で、確認時の旧版36261daから更新した。

### 検証

- ローカル全変更ROLLBACK：service_role以外・不正lease拒否、画像残存時のDB整理拒否、他者本文維持、他者参加の本人PIN削除、招待参照の整理、Auth未削除のfinish拒否、削除途中の再登録拒否、再送と最終Auth削除可能性を確認。
- worker HTTP試験4件：通常成功、画像失敗、Auth失敗、既にAuthが消えた404。完了／再試行の分岐とhard delete要求を確認。
- クラウドにメールを送らない合成Authアカウントと私有画像fixtureを作成。修正workerをローカルからクラウドへ一度実行し、Auth GET404、auth.users／members／storage.objects／cleanup job各0件を確認。全fixtureは消去済み。実利用者のアカウントは試験対象にしていない。これはRender常時稼働の確認とは別。

## 正式公開までの残件

- Renderの修正版稼働・合成アカウントの削除を確認済み。実機からの退会操作は未確認。
- 058は未配備。年齢区分を現在収集中と説明せず、一般公開時の方針と現地試験を区別する。
- 問い合わせの90日削除は運用方針でありメール自動清掃機能ではない。SUPPORT_OPERATIONSを担当者が実施する。送受信設定の確認は11/26以降。
- 外部サービスの実プラン／追加ログ転送／国外取扱いを確認し、公開文面に反映する。子どもの同意方式に関する法務確認はAGE01に継続。

[Supabase Auth削除仕様](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)／[Renderログ期間](https://render.com/docs/logging)／[Resendメール保持](https://resend.com/security/gdpr/)。Render Hobbyログ7日、Resend標準メール・ログ30日／バックアップ7日は公式仕様として確認。実画面でRender HobbyとSupabase Freeを確認。SupabaseのLog Drainsはアップグレードが必要で未設定。Render追加ログ転送とResendの現在の個別契約は未確認。

## Render実稼働での追加確認（11/25 06:04〜06:12 JST）

2つ目のメールを送信しない合成Auth・私有画像・退会済みmember・清掃jobを作成し、ローカルworkerを実行せず待機した。切替中の旧instance bmpbsがsoft deleteを試みたが059のfinishガードが完了を拒否し再試行へ。新instance mwrqbが06:10:17にcleanup=1、以後2周期cleanup=0。Auth GET404、auth.users／members／storage.objects／cleanup jobの対象各0件を読み取り確認し、fixtureは消去済み。実利用者は試験対象外。プロバイダーの監査ログやバックアップまで即時消滅したという証拠ではない。

Supabase管理画面でFree・東京、RenderでHobby・Oregonを確認。Supabaseの通常API／DBログは[Free仕様](https://supabase.com/pricing)で1日、Render Hobbyは7日。国外処理はリージョンと別に事業者の運用・委託先も存在するためPRIVACY_POLICY_DRAFTへ区別して反映。058は未配備、公開文書の一般公開版への適用と既存試験利用者への同意取得方針はユーザー確認中。
