# 最初の一本：DB・API・画面・テスト対応契約 v0.1

この契約は中核フローの範囲を定める。MVP全体の完了条件・実装順序は[MVP_TASKS](MVP_TASKS.md)。本書だけの完了をMVP完成と呼ばない。

2026-10-29。対象は「NFCで入街→気配更新→Map表示→退出」。承認済み製品仕様を [要件](MVP_REQUIREMENTS.md) から参照する。ここはその実装用の内部設計案。製品コード・SQLを実装中。クラウドは未作成。未決定の初期値を勝手に採用しない。

## 1. この一本の完成条件と前提

招待登録・認証済みのiPhoneで有効タグを読み、滞在を開始する。新しい街内観測が1件の気配となり、別の認証済み閲覧端末のMapに人数として現れる。移動すると旧区画から消えて新区画へ移る。OFF後、本人端末の測位が停止し、サーバーと閲覧端末でも気配が消える。新しいNFCなしで復活しない。

運営登録フローは [NFC_OPERATIONS](NFC_OPERATIONS.md) に従う。有効タグ・公開範囲・運営提供アイコンを入力として利用する。最初のDB/画面開発ではテスト用データを投入できるが、それをNFC書込・公開フローの完了とは扱わない。位置シミュレーションも実機背景測位の合格には代用しない。

チャット全文、イベント管理、通報画面はこの一本に含めない。ただし入街ログを1回生成するDB境界、終了時の募集終了処理は接続点として定義し、省略したままMVP完成とはしない。

## 2. 作業単位と対応（この表から実装・レビューする）

| ID | 利用者の操作／変化 | DB処理 | API | 画面状態 | 要件・テスト |
| --- | --- | --- | --- | --- | --- |
| S01 | Mapを開く | 資格、街設定、本人visitを読む | get_street_config / get_my_visit | boot→outside/active/other_device | R03/R05、T01/T12 |
| S02 | NFC読取 | 有効タグと設置版から試行作成 | prepare_checkin | scanning→checking | R04/R11、T02 |
| S03 | 入街確定 | 新visit・guard・ログ・試行結果を同時確定 | commit_checkin | checking→active_empty | R04、T03/T04 |
| S04 | 新しい街内観測 | 最新presence置換＋visit延長 | observe_visit(inside) | active_empty→active_present | R05/R07/R21、T05/T06 |
| S05 | 他端末で気配を見る | 有効行だけを区画・失効時刻で集約 | get_presence_snapshot | loading→ready | R08/R10、T07/T08 |
| S06 | 移動・静止中の更新 | seq検査、旧区画を置換 | observe_visit(inside) | activeを維持 | R07/R09、T05/T09 |
| S07 | OFF | visit終了・presence削除・募集終了 | end_visit | stop_pending→outside | R06/R12、T10/T11 |
| S08 | 街外・期限切れ | 観測検査後終了／読み取り時失効 | observe_visit(outside) / get_my_visit | outside | R05/R06/R11、T06/T09 |
| S09 | 通信断・復帰 | 対象試行／visit照会、古い更新を拒否 | get_checkin_result / get_my_visit | uncertain/recovering | R04〜R09、T04/T11/T12 |
| S10 | 清掃・範囲更新 | 条件再検査、現行版参照の切替 | 内部ジョブ／運営公開 | 期限は継続 | R11/R17、T13/T14 |

## 3. DB契約

UUIDは主キーと参照、整数の版／順序はbigint（APIでは十進文字列）、日時はtimestamptz。下表はDDL作成時の仕様。無関係なメール・生座標・観測履歴列を足さない。

| 実装テーブル（app_private） | フィールド・不変条件 |
| --- | --- |
| members | account_id PK/FK、active、epoch。資格と滞在guardを同じ親行へ統合し、先に排他ロック |
| streets | id、name、area_version、grid_version |
| areas | street_id/version PK、公開polygon。不変版として参照 |
| tags | id、street_id、revision、active。運営の設置座標・登録フローは後続実装 |
| attempts | id、account_id、session_id、street_id、tag_id nullable、tag_revision、expected_epoch、issued_at、accept_until、state、result_visit_id、result_kind |
| visits | id、account_id、street_id、writer_session_id、started_at、expires_at、ended_at、end_reason、revision、last_seq、last_observed_at。未終了行のaccount部分一意索引 |
| presence | visit_id PK/FK、area_version、grid_version、cell_id、observed_at、expires_at。最新1件、観測から600秒 |
| arrival_logs | id、source_visit_id UNIQUE、account_id、street_id、created_at。visit削除を妨げるFKなし |
| recruitments | visit_id参照・期限・終了。終了連動だけの接続境界。募集作成APIは未実装 |

当初案のcurrent_visit_idは重複保持せず、visitsの所有者と部分一意索引から現在滞在を読む。失効済み未終了行は終了してから新規作成する。区画投影は初期版の固定値としてRPC/Swiftに実装し、grid_definitionsの運営変更APIはまだ持たない。これは内部実装の具体化であり、期限・更新元・NFCの要件は変更しない。

area_versionをpresenceへ追加する理由：範囲変更だけで旧気配を別の場所へ動かさないため。公開集約キーはstreet/grid/cell/area_version。旧版の同一区画と新版を別の表示単位にする場合でも人数合計は重複させない。版ごとのアンカーを返し、10分以内に旧観測が消えれば旧表示単位も消える。既存の区画別集約の具体化であり、個人キーは追加しない。

終端処理は共通の内部関数end_visit_lockedを用い、理由・終了時刻を設定、presence削除、関連募集終了、epochとrevision更新。終了済みなら何も延長／再生成しない。公開対象外判定は削除ジョブとは独立。

## 4. 認証・トランザクション

外側は型・サイズ検査、内側のDB関数で認証主体・現在資格・session・所有者を再検査する。account_idやsession_idをAPI本文から採用しない。通常利用者に内部テーブルへの直接DMLやpresence行のSELECTを与えない。サービス鍵はアプリに入れない。

account親排他→街版共有→対象タグ／試行／visit→子行の共通順。複数同種はID順。Read Committedで親ロック後の別文で現在状態を読む。必要ロック後に取得した時刻を判定時刻tとする。外部通信をトランザクション中に実行しない。commitの処理済み分岐は過去の成功本文でなく現在visit状態を返す。

DB確定後のRealtime通知はstreetの変更合図のみ。通知の不達はデータ不達と同一視せず再取得で回復。Snapshotは単一SQLの同じスナップショットで人数と失効予定を計算。再試行・取得間隔の設定は本書B02に残す。

## 5. API入力・結果

実HTTPは `POST /rest/v1/rpc/street_api` に `{operation,payload}` を渡す。

共通の成功応答は `{server_time, result, visit?}`。日時はUTC ISO 8601。失敗はPostgRESTの `{code,message,details,hint}`。既知の短いエラー名だけを返す。失敗応答にはserver_timeを含めず、時刻同期はtime RPCを使う。認証不正401、利用資格なし403、存在しない／他人の私有対象404、状態競合409、入力不正422、上限429、通信／内部一時障害503。詳細な内部例外・秘密を本文へ返さない。

VisitViewは `{visit_id,street_id,revision,last_seq,state,expires_at,can_update,presence_expires_at}`。stateはactive/ended/expired、presenceなしはnull。本人にだけ返す。get_my_visitで不在はvisit:null。本人の別sessionならcan_update:false。ended/expiredの旧対象も更新不可。

| 操作 | 本文／引数 | 成功resultと主要な拒否 |
| --- | --- | --- |
| get_street_config | street_id | current_area_version、境界、grid定義、観測設定。資格なし403 |
| prepare_checkin | tag_id、payload_version | attempt_id、accept_until。inactive_tag、unsupported_payload |
| commit_checkin | attempt_id | created/reused。attempt_expired/canceled/conflict、tag_changed。いずれも無断再作成しない |
| cancel_checkin | attempt_id | canceled。createdならそのvisit終了、reusedなら元visit維持。記録不在は404→本人状態照会 |
| get_checkin_result | attempt_id | pending/committed/canceled/rejected＋現在visit。期限切れpendingはexpiredとして返す |
| get_my_visit | なし | visitまたはnull |
| observe_visit | 下記union | accepted/ignored。ended/expired/wrong_writer/area_changed/stale_observation/invalid_cell |
| end_visit | visit_id、reason=manual/logout | ended/already_ended。不在404でも新規生成せず本人状態照会、別のvisitを終了しない |
| get_presence_snapshot | street_id | 下記Snapshot。非会員403、存在しない街404 |

observe_visit入力：

```text
共通: visit_id: UUID, seq: DecimalString, observed_at: UTCDateTime,
      area_version: DecimalString, horizontal_accuracy_m: finite number
inside: verdict="inside", grid_version: DecimalString, cell_id: string
outside: verdict="outside"（区画・緯度経度は送らない）
```

精度は端末の申告値。サーバーが0以上50以下を検査できても現地の真正性証明ではない。outsideは端末で明確な街外を30秒以上離して2回確認後に送る。サーバーが生座標なしでこの判定を独立再現できるとは扱わない。受理まで120秒、新しいseqと時刻、最新範囲版、有効visitを検査。seq以下はignoredで延長なし。新観測のinsideだけがpresence置換＋expires_at=t＋3時間を行う。

Snapshotの具体形（値は説明例）：

```json
{
  "street_id": "<UUID>",
  "server_time": "2026-10-29T03:00:00Z",
  "checked_in_count": 7,
  "presence_count": 2,
  "cells": [{
    "grid_version": "1", "area_version": "3", "cell_id": "12:8",
    "anchor": {"latitude": 35.0, "longitude": 139.0},
    "count": 2,
    "expiry_groups": [
      {"expires_at": "2026-10-29T03:04:00Z", "count": 1},
      {"expires_at": "2026-10-29T03:09:00Z", "count": 1}
    ]
  }]
}
```

anchorは区画・範囲から算出した代表点で、個人の観測座標ではない。取得時の全cell count合計=presence_count、各expiry_groups合計=cell countを保証。checked_in_countは有効滞在数で独立。個人ID・session・観測順序なし。配列を人物識別のために対応付けない。

## 6. 画面の状態と端末内保存

| 状態 | 表示・許可 | 次の遷移 |
| --- | --- | --- |
| boot/recovering | 状態確認中、勝手にONにしない | get_my_visitと退出意思を照合 |
| outside | トグルOFF、Map閲覧可能 | ON→権限確認→scanning |
| scanning | NFC標準画面＋アプリ案内 | 読取→checking、取消→outside |
| checking/uncertain | 入街確定待ち／通信確認中。更新開始しない | commit照会→active_empty、取消→stop_pending |
| active_empty | ON、滞在人数には含まれるが本人の気配なし | 新観測→active_present、期限→outside |
| active_present | ON、気配更新可能 | 気配期限→active_empty、OFF→stop_pending |
| other_device | この端末はOFF。別端末が参加中と案内 | 新NFCで置換、ログインのみでは更新不可 |
| stop_pending | 観測停止、OFF意思、サーバー反映待ち | 終了確認または対象失効→outside |

Map取得状態はloading/ready/stale/errorで独立管理。滞在OFFでもreadyの地図を見られる。チャット・募集の代わりに気配を消した画面へ縮退させない。

端末へ保存するのは認証（安全な領域）、visit_id、attempt_id、採番、退出意思、操作世代。位置キュー・移動履歴を永続保存しない。再起動時は退出意思を先に処理し、番号同期後の新観測だけ送る。同じ要求の再送で新番号を発行しない。サーバー終了を確かめるまで古い成功応答でONへ戻さない。

地図は取得世代を持ち旧応答を破棄。期限に沿って各表示枠を薄くし、0で人数から除く。6以下は一群、7は5＋2、以降残り6以下まで5を分離。画面オフセットのみで地理位置を変えない。ブラウズ再開時は時刻と状態を再取得する。

## 7. テスト仕様：入力→期待値→検証層

DBは実PostgreSQLの独立接続で並行実行し、モックでロックの正しさを証明しない。時刻境界は試験用の制御可能な時刻源を用いるが、本番RPCから任意時刻を指定できる作りにしない。以下は未実行。

| ID | 条件／操作 | 期待するDB・API・画面 | 層 |
| --- | --- | --- | --- |
| T01 | 未会員／会員で初期取得 | 未会員403、会員はvisitなしでもMap取得可 | 認可統合 |
| T02 | inactiveタグ／古い設置版／発行から120秒 | visitを作らず、古い開始でONにならない | DB/API |
| T03 | 同じcommitを同時2回 | visit1、arrival1、期限同一。別試行同時開始はepochで整合 | DB並行 |
| T04 | cancel→commit／逆順、応答紛失 | 取消後に新visitが残らない。reused取消は元visit維持。UIはOFF意思優先 | DB＋画面 |
| T05 | seq1 A→seq2 B→seq1 A再送 | presence1件でB、last_seq2、最後の再送で期限延長なし | DB/API |
| T06 | 精度50/50.1、古さ120/120.1、visit期限ちょうど | 境界内のみ受理、失効後復活なし。未来幅はB01決定後追加 | 単体＋DB |
| T07 | 同区画2人、片方だけ更新 | 旧側のみ期限で消え2→1。更新した人以外を延命しない | 集約＋描画 |
| T08 | 人数6/7/8/11/12 | 6、5+2、5+3、5+6、5+5+2。合計不変、個人IDなし | 描画＋API |
| T09 | 区画境界20m前後、精度不足、街外2回 | 区画切替・保留・退出が合意通り。保留で期限延長なし | 端末単体＋実機 |
| T10 | updateとendを両順序で並行 | 最終visit終了、presence0、募集非公開。遅延更新拒否 | DB並行 |
| T11 | OFF時通信断→再接続→古い応答 | 即測位停止、終了通知優先、ON復帰なし | 端末統合 |
| T12 | 別session更新、再ログイン、再NFC切替 | wrong_writer、ログインだけでは移行なし。NFCで旧終了・新開始が原子的 | 認可＋DB |
| T13 | 古い期限で掃除候補選択→新更新 | 再検査で新鮮な行を削除しない。期限後1時間以内削除 | DB並行＋ジョブ |
| T14 | 範囲公開と更新が並行 | 旧版更新は再判定、変更のみで全員退出しない。旧アンカー維持 | DB＋描画 |
| T15 | snapshot中に移動／通知欠落 | 同一取得内で二重計上なし、再取得で回復、通信断でも期限消去 | DB＋端末 |
| T16 | 実iPhoneでNFC→ロックして移動→OFF | 実タグ読取・実通信・別閲覧画面・測位停止を通しで確認 | 実機E2E |

T16はOSに常時更新を保証させる試験ではない。欠測時10分消去と3時間失効、停止操作も確認。電池は測定条件と観測値を記録し短時間の0%を省電力証明としない。

## 8. 残る実装着手条件と進める順番

| ID | この一本に必要な未確定点 | 影響する作業 |
| --- | --- | --- |
| B01 | [OBSERVATION_RULES](OBSERVATION_RULES.md)で時計・区画・境界の推奨方式を具体化。G01（街外確認の最大120秒）承認済み、Swiftの19 assertionを確認、本体実機は未確認 | 測位アダプターとT06/T09。DBの重複・終了テストは先に具体化できる |
| B02 | RN/Expo構成・NFC/位置ライブラリ、タグ書式・実機種、Mapタイル、Realtimeの配線 | ネイティブ接続とT16。クラウド契約や全機能設計の先行完了は不要 |
| B03 | 解決済み：2026-10-29本体実装を許可 | 最初の一本まで自律的に継続 |

DDL/RPC・端末状態と接続を実装中。T01〜T15の一部を実行済み、T16は未確認。実際のテーブル名・HTTPエラー形式と本設計案との差分はIMPLEMENTATION_PROGRESS、実行証拠はTECH_VALIDATIONを参照。Auth・運営のテスト用前提を使った試験は、本番の招待・運営フロー完了とは区別する。

## 9. 現在のフェーズ

2026-10-29：最初の縦断実装I1〜I4。DDL/RPC・Swift背景処理・RN画面を作成し、実DBとHTTPの一部試験、シミュレータビルドを確認。実機NFC・本体背景通信は未確認。工程はIMPLEMENTATION_PROGRESS、証拠はTECH_VALIDATION。全機能のMVP完成とは区別する。
