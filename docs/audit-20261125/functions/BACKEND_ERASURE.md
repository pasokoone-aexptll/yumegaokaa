# 退会清掃関数記録

## `maintenanceTick` — scripts/lib/maintenance.mjs L2-L82

**Purpose:** 期限清掃、街アイコン消去、退会Auth/画像最終消去。**Inputs:** apiURL/serviceKeyは信頼済みサーバー設定。DB job結果は特権RPCから受領。**Effects:** DB RPC、Storage DELETE、Auth admin hard delete。15秒HTTP timeout（L3-L13）。

**Block-by-Block:** L15-L21 RPC非成功を例外へ。L24 cleanupが失敗するとそのtick終了。L25-L30 simulate時だけ疑似通知。L32-L48最大100 icon job、Storage削除成功後finish、例外ならretry。L51-L78最大100 account job。assetsを配列確認し全画像を逐次DELETE→prepare_auth_delete→Auth hard delete→finish。Auth404は既削除として許容。例外はlease付きretry。成功・失敗ログに個人ID/本文/鍵を出さない。

**Dependencies:** `icon_cleanup` 026:8-26 はskip locked＋5分lease、finish前Storage metadata不存在確認。`maintenance_jobs` 018:64-79 はservice_role、skip locked、lease、5分retry。059:77-90のfinish wrapperはAuth/memberの不存在も確認。field-gateway:37-44はtick終了後にFCM、失敗しても60秒後に再試行。Local workerはsimulate=true、loop多重実行防止。

**Assumptions:** 外部Storage DELETEの成功が実削除へ対応すること。ただしDB側再検査あり。asset全件削除がleaseに収まることは `nothing found`。request自体にjoblease更新なし。retry RPCが失敗すると外側へ伝播し後続jobをその周期には処理しない。

**Open Questions:** 削除件数が多いアカウントの上限と実時間、API失敗時の監視、期限内に完了できないleaseの回復試験。

---
## `public.account_erasure` — supabase/migrations/202611250059_account_erasure.sql L15-L73

**Purpose:** Auth hard delete前の対象特定とDB依存整理。**Inputs:** service_roleのみ、job ID/lease。**Effects:** assetsではlease延長とStorage metadata一覧、prepareではDB依存削除とAuth sessions消去。

**Block-by-Block:** L19 service_role明示検査。L20-L26 job leaseをロック照合、有効会員や未退会を拒否、5分へ延長。L27-L33 Storage owner、固定avatar path、street_icon所有対応を列挙し、prepare時の残存を拒否。L35-L69依存を順に消去しmemberとAuth sessionを消す。未知の外部キーはDB例外でtransaction rollback。L72-L73一般roleへ実行権なし。

**Dependencies:** workerがStorageを先に消去。Auth hard deleteはこの関数外のAPIで行う。059:93-98はcleanup jobが残る間invite_acceptを拒否し、DB削除とAuth削除の間の再登録を防ぐ。finishはAuth/member両不存在を確認してから018のlease一致job削除へ進む。

**Assumptions:** asset owner_idと現在の所有テーブルで消す対象を網羅できる。将来追加された保持テーブルやバケットまで自動保証する処理は `nothing found`。Auth keyとDB/Storageが同じprojectであることは構成前提。

**Open Questions:** 最新cloud関数定義との差分、全外部キーの削除順、owner情報がない旧画像、従来匿名化投稿の残存は主DB監査へ渡す。
