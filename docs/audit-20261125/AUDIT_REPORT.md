# 提出前コード・DB監査（2026-11-25）

判定：DB全体の破損は確認できない。ただし再現性・テスト基盤・リセット後の認証復帰に不足があり、整理とリセットを一度に実行しない。今回は本番read-onlyの構造/件数検査、重要経路の静的分析、ローカル回帰試験。全画面・全競合・実機の網羅監査完了ではない。監査時点では修正・削除未実施。後続の本人最終承認による初期化結果はRESET_PLANを参照。

## 使用したスキル

- Supabase公式 supabase-postgres-best-practices：構造、権限、ロック、再現性。private schemaをRPC経由だけで公開する既存構成を、RLSの有無だけで違反判定しない。
- Trail of Bits audit-context-building：コードの実呼出しと前提を分担調査。FRONTEND_CONTEXT/BACKEND_CONTEXTおよびfunctionsに根拠。構造理解段階の推測を脆弱性と混同しない。
- OpenAI security-best-practices：権限境界・資格・セッションを確認。付属Web React/Express向け資料をReact Native/Swift/Node HTTPへそのまま適用しない。Swift専用の付属基準はない。

## 確認した問題（重要度は監査内の修正優先順位）

| ID/優先度 | 確認事実・影響 | 根拠・次の処置 |
| --- | --- | --- |
| A01 高（リセット前） | AndroidはAuth session=nullでlogoutがlogin_requiredを投げ、signOutに到達しない。古い/失効セッションからの復帰の障害になり得る | platformAuth.android.ts:19–22,35–36,362–375。tests/audit-android-logout.test.mjsで実exportのmock再現と正常対照2件成功。実機リセット後は未確認。後続でsessionなしでもlocal signOutする修正を実施、回帰2件と型検査成功。Android配備/実機は未確認 |
| A02 中 | migration記録65件は同一だが、本番と新規構築DBの招待関数3本の定義が異なる。058/059の適用順が逆。本番はage→erasure→従来、freshはerasure→age→従来 | schema-inventory.sqlのハッシュ比較。現在両方の検査が連鎖することはコード確認。検査欠落の証拠ではない。順番と定義を正規化する追加migrationと再現試験を準備 |
| A03 中 | 本番だけfield_trial_grant/guard_field_trialが存在し、migrationから再現できない | 本番43 tables/90 functions、新規42/89（対象schema）。以前の現地試験の記録と一致。初期化時にgrantデータは消すが、試験用schemaを残すかは提出構成と分離して整理 |
| A04 中 | ローカルDBにhas_current_consentがなく、現在のgateway-auth試験が失敗 | tests/gateway-auth.test.mjs:28、scripts/lib/gateway-authorize.mjs。058/060をtransaction内適用する同意試験は成功。本番の同関数は存在。ローカル環境整備と試験fixture更新が必要 |
| A05 中 | database.testの終了処理がvisit_countsのFKを考慮せず失敗し、DB接続を閉じない。テスト残骸と実行停止を起こす | tests/database.test.mjs:445–466。主要14小試験は成功後、streets削除が23503。後続試験の終了を含む初回結果と、総合テストを除いた結果を切り分け。製品のDB破損とは区別 |
| A06 中 | session-state試験のmockがclearDenshinDraftを提供せず失敗し、セッション変更の回帰確認にならない | tests/session-state.test.mjs:12、sessionState.ts:25、denshinDraft.ts:25には実関数あり。アプリの未定義関数ではない。mockと検証項目を更新 |
| A07 提出前 | 本番field gatewayはFCM経路のみ起動し、iOS APNs本番配信経路はこの構成から確認できない | scripts/field-gateway.mjs:19–21、BACKEND_CONTEXT。ADP/本番署名と合わせて通知の実経路を確定 |

## 不具合と断定しない継続調査

- 退会本文消去試験は初回unauthorized、切り分け再実行では成功。再認証時刻や環境依存の可能性を含め原因未確定。成功だけを採用せず、リセット前の認証検証に含める。

- UIセッション識別がemail+signed_inで、account ID/projectを含まない。同メールで作り直したとき・デモ切替時のキャッシュ境界を実機確認する（sessionState.ts:7–22）。
- iOS sessionはローカルトークン有無を返す。サーバーでAuth削除した後の起動と再ログインを確認する（FRONTEND_CONTEXT）。
- API URL/DB/service keyの同一環境性は設定依存。新設デモへの本番資格混入を起動前に拒否する検査は未接続。
- healthzの200は清掃/Auth/DBの正常性を証明しない（realtime-gateway.mjs:9–12）。
- 5秒再認可の重複、5分leaseより画像削除が長引いたときの回復は負荷試験未実施。今回の画像11件という小規模集計から全状況を保証しない。
- activeだがplacementのないtagが1件。現地試験用の可能性があるが、ID/実物照合前に不要と断定して消さない。

## 本番で確認できたこと

本番yumegaoka-fieldは読取のみ。認証8、会員6（運営2）、プロフィール6、投稿50、PIN1、招待14、通報1、Storage11、pool画像行6。街1、区域版2、tag6、配置4、設置draft4。観測時のvisit/退会済み会員/清掃jobは0。

参照切れavatar0、公開pool画像の参照切れ0、孤立プロフィール0、avatarの参照なし0、pool行なしStorage0、31日超過chat0、未検証制約0。統計リセット以降のdeadlock0（将来/全期間の無発生保証ではない）。anon/authenticatedのprivate schema利用不可・private table SELECT権限0を確認。4会員は最新同意なしで、再同意ゲート導入後の状態として説明可能。これをデータ破損と数えない。

schema比較は関数ハッシュ・ACL・対象policy・制約・table RLS/ACL・migration記録まで。columns/indexes/triggers/外部設定の完全差分ではない。移行再現の完全合格は未宣言。

## 試験の範囲

- 初回対象13ファイル：37 tests、33成功、4失敗（A04/A05/A06と退会試験のunauthorized）。
- 総合テストを除いた対象11ファイルの直列実行：15 tests、13成功、2失敗（A04/A06）。PIN操作/競合、同意、運営削除、退会本文削除、通報、画像upload競合、清掃worker、realtimeの成功を含む。
- database.test：主要14小試験成功、後片付け失敗A05。pool.end前に例外。
- avatar-cache 3件成功。
- Android logoutの追加監査再現2件成功（現在の失敗挙動を立証する試験。修正合格を意味しない）。
- 本番の削除試験・実ユーザー投稿操作・実機退会・全画面テストは実施していない。

## 不要物の扱いと次の順序

review-* / ui-preview等は候補だが、試験フラグと参照元を追わずに一括削除しない。昔のmigrationや互換ラッパーも現在の呼出し経路に残っているので、名前だけで削除しない。

A01と試験基盤を修正→環境差分を説明可能な状態へ整理→リセット計画の保存対象を照合→具体的対象の最終確認→停止/削除/新運営アカウント/再検証。リセットは原因修正の代わりにならない。現時点では監査資料と補助試験だけを追加した。
