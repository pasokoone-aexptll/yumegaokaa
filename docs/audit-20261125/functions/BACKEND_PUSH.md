# Push関数記録

## `deliverPush` — scripts/lib/push-delivery.mjs L3-L41

**Purpose:** provider共通のlease付き少なくとも一回配信。**Inputs:** 特権RPC、sender、environment/limit。**Effects:** claim→recheck→provider send→結果保存。

**Block-by-Block:** L9-L16最大limit件をclaimし非activeなら終了。L18-L20送信直前recheck、非activeは送らない。L21-L24構成エラーはretryを設定して全tick停止。L25-L33provider結果をlease/登録時刻付きで保存。L34-L38通信/保存失敗はretry。retry自体の失敗は上位へ伝播。

**Dependencies:** 045:32-85のqueue処理と046:56-84のprovider別wrapper。claimは1分lease/skip locked、recheckは通知の有効性、デバイス登録とmemberを再確認。成功後DB応答が失われると再送し得る。端末配送exactly-onceを保証しない（L1-L2）。

**Open Questions:** 最新DB通知可否関数全体の最終定義、実providerとの通知到達、再送の端末表示。

---
## `apnsSender` / `providerToken` — scripts/lib/apns.mjs L4-L163

**Purpose:** ES256 provider JWTとAPNs HTTP/2送信。**Inputs:** trusted team/key/topic/env、queue item。**Effects:** tokenを最大3000秒で再生成、HTTP/2接続再利用、期限・token形式・environment検査。

**Block-by-Block:** L10-L17 P256/identity形式。L20-L39 JWT生成/時刻巻戻り時更新。L65-L74 sandbox/production URL固定。L76-L83接続を再作成しGOAWAYでclose。L87-L95対象と期限検査。L100-L110固定notification IDでid/collapse/expirationを送る。L112-L145 timeout/4096byte応答上限/JSON失敗/transport closeを扱う。L147-L156通知本文は一般案内だけで投稿本文・参加者・座標なし。

**Dependencies:** classifyAPNs L41-L56は200をaccepted（端末配送証拠ではない）、410/bad tokenを無効化、429/5xxをretry、403を構成エラー。他はfailed。runner `scripts/push-worker.mjs:18-25` はlocal-only。

**Open Questions:** 本番用APNs runner配備は本範囲にnothing found。環境変数/資格の実状態は読んでいない。

---
## `fieldFcmTick` — scripts/lib/fcm.mjs L4-L52

**Purpose:** FCM OAuthと送信、queue連携。**Inputs:** API URL/service key、サービスアカウントJSON。**Effects:** 固定project `yuwegaoka-staging`（L6-L7）にのみ送る。OAuth access tokenをexpiry前60秒までcache。HTTP timeout12秒。

**Block-by-Block:** L11-L25 RS256 assertion→Google OAuth。L27-L40 token指定通知、UNREGISTEREDはinvalid_token、401/403はcacheを失効させconfiguration_error、429/5xx retry。他failed。L42-L51 service_role RPCを使いenvironment=fcm、limit30で共通deliverPush。

**Dependencies:** field-gateway:19-21はFCM資格がある時のみ起動。サービスアカウントprojectは固定文字列と一致させるが、Supabase projectとの結び付けは構成前提。

**Open Questions:** 新しい分離審査環境ではFCM資格を設定しない手順の実施確認。本番移行時のFirebase project意図と、通知タイトル「夢ヶ丘」の扱い。
