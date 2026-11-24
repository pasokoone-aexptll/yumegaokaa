# Gateway関数記録

## `gatewayAuthorizer` — scripts/lib/gateway-authorize.mjs L3-L40

**Purpose:** HTTP upgradeと接続後の資格更新判定。**Inputs & Assumptions:** tokenは未信頼。API URL/公開キー/DB handle/streetは信頼済み構成。streetのUUID形式はL4で検査。APIとDBの同一環境性はこの関数内に `nothing found`。

**Outputs & Effects:** 有効ならaccount/session/street、無効ならnullまたは例外。Authへの外部GET、DBのSELECTのみ。

**Block-by-Block:**
- L7-L11：4秒timeoutでAuth `/user` を呼び、非成功を拒否。JWT自前decodeだけの認証を避ける。
- L13-L27：JSON decodeを捕捉、Auth返却userとsub、UUID、authenticated roleを照合。
- L28-L38：実sessionの所属/期限、有効会員、退会なし、現行同意、街の存在を確認。ここで初めてidentityを返す。

**Cross-Function Dependencies:** `createRealtimeGateway`のupgrade/validateが呼ぶ。Authは外部black box。DB `has_current_consent` は060:6-9で現行policy版とterms_acceptedを照合。例外は呼出元がupgrade拒否またはsocket切断に変換する。

**Open Questions:** APIとDBの構成一致。Auth API障害時に一斉切断した後の端末再接続負荷。実運用資格の期限設定。

---
## `startGateway` — scripts/lib/gateway-runtime.mjs L5-L100

**Purpose:** DB変更購読と単一gateway所有を維持。**Inputs:** 信頼済み接続構成、rolling mode。**Effects:** 専用DB接続、pool max4、HTTP listen、NOTIFY購読、5秒interval。

**Block-by-Block:** L14-L29 pool/authorizer構築。L34-L41 closeは再入防止して全socketとDBを閉じる。L42-L57 flushは多重呼出しを1つのqueuedフラグへ集約。L59-L67 DB error/endで閉じる。L69-L89 advisory session lockを取得し、rolling時はHTTPを先に開いてlock移譲を待つ。L91-L95 5秒周期再認可、timer unref。

**Dependencies:** createRealtimeGatewayのacceptingはownsLockとclosedを確認。LISTENのDB切断時closeで旧instanceのsocketも閉じる。flush内awaitのfinallyはrunningを復旧。revalidateはintervalごとにvoid呼出し、前周期完了待ちの制御は `nothing found`。

**Open Questions:** 接続方式がsession lock/LISTENに適合するか。5秒以上の再認可で周期が重なる実測。close/changedとsocket送信の競合試験。

---
## `createRealtimeGateway` — scripts/lib/realtime-gateway.mjs L6-L125

**Purpose:** 受信専用変更通知とアカウント当たり3socket制限。**Inputs:** authorize/acceptingは注入依存。HTTP upgrade headerは未信頼。

**Block-by-Block:** L9-L15 healthはclosing状態のみ。L17-L33 maxPayload1024、圧縮無効、pong未受信socketをheartbeatで破棄。L35-L55 pathname/受付状態/Bearer長8192/認証を検査し5秒timeout。L56-L65 quota検査と予約の間にawaitなし、TCP closeまで枠を保持。L67-L75 ws登録、message送信は1008で拒否、ready通知。L76-L78例外は401。L80-L94毎回identity一致を確認し、失敗はterminate。L98-L109全接続または街の接続を並列再認可、成功時changedだけ送る。L115-L123 shutdownは全所有TCPを破棄しサーバーclose。

**Dependencies:** Authorizerの本人/session/street照合を信頼。clients Mapはws closeで除去、accountsはTCP closeで除去。未知の一般RPC本文は一切ここに流れない。

**Open Questions:** 未認証upgradeの全体件数制限は `nothing found`。外側Renderの接続/レート制限は未確認。認証後awaitから戻った時acceptingの再検査はL53ではなくclosedのみであるが、lock喪失のclose連携の全競合挙動は実測が必要。
