# 最初の一本の実装進捗

本書は最初の一本の実装履歴・証拠。MVP全体の進捗率・次の作業・完了判定は[MVP_TASKS](MVP_TASKS.md)を正本とする。

2026-10-29。ユーザーの「本体実装を始めよう」「動くものができるところまで」により、雛形・DB/API・iPhone接続の実装を承認。段階ごとの再承認は不要。契約・購入・クラウド設定・公開は別。

| フェーズ | 完了条件 | 現状 |
| --- | --- | --- |
| I1 雛形・環境 | 依存固定、ローカルDB起動 | 完了：Expo互換チェック・依存固定・Colima/Supabase起動 |
| I2 DB/API | 入街・更新・公開集約・終了、認可・競合試験 | SQL/RPC実装、実DBとHTTP通し確認済み。全設計ケースの網羅は未完 |
| I3 端末接続 | OTP・NFC・背景観測・Map・OFF | 本体コード実装、Debug/Releaseシミュレータの混在ネイティブビルド成功。実タグ・ロック中通信は未確認 |
| I4 通し確認 | 実iPhoneでNFCから退出まで | NFC実機確認はADP加入後へ延期。Personal Teamで開発用タグ入力から本物のDB/API・背景観測を通す確認を優先 |

## 実装の配置

- `apps/mobile`: Expo RouterのMap/OTP/アカウント画面、MapLibre、NFCの読取と空の開発タグへの書込。
- `apps/mobile/modules/presence-native`: Keychain・認証更新を一元管理するSwift APIClient、Core Location、時計補正・区画計算・最新観測の送信、OFF意図の永続化・ネットワーク復帰時の終了再送。
- `supabase/migrations`: 私有テーブル、認可付きRPC、期限清掃、変更合図のprivate Broadcast、会員停止の連動。
- `tests`: DB/公開表示/Swift計算。`scripts/http-smoke.mjs` はローカルAuthからHTTPで一巡する。
- `experiments/presence-ios`: 既存試作は変更していない。

## 実装時の内部判断と設計との差分

製品要件を変えず、初期DDLの論理名を実コードでは短い名前にした。membershipとguardは `app_private.members(active,epoch)` に統合。current_visit_idの重複保持を避け、所有者付きvisitsの部分一意索引で現在滞在を決める。同一accountの全RPCはこの親行を先にロックする。

APIは個別HTTPパスではなく `POST /rest/v1/rpc/street_api` のoperationで分岐。HTTPエラーはPostgREST形式 `{code,message,details,hint}`。既知エラーだけを401/403/404/409/422/429へ対応、未知例外は503 request_failed。設計案の `{server_time,error}` エンベロープは未使用。成功にはserver_timeを含める。入力は最大4KiB。

配信はprivate Broadcastのchanged合図（アプリpayloadは空、配送基盤は一回限りのmessage idを付与）＋集約再取得。前面では10秒ごとの再取得も行い、欠落から復帰する。個別観測・visit・accountを配信しない。描画の失効予定は受信からの10分ではなくサーバー時刻を基準に消す。

認証更新はSwift actor一か所。JSのSupabaseクライアントはRealtime専用で認証の保存・自動更新を無効化し、必要時にnativeのアクセストークンを取得する。背景送信はJSタイマーに依存しない。

## 意図的にまだ完成としていない部分

- 初期地図はMapLibreのデモスタイル。Figmaの完成見た目・街アイコン素材・本番タイル提供元は未確定。イベントとチャットはこの一本に混ぜない。
- 招待の利用資格はローカル管理コマンドで登録。本番招待UI・運営登録UI・復旧運用は未実装。
- 開発タグは固定の架空設置。書込機能は実タグ未確認。本番の運営公開フローとは違う。
- DB schemaの街投影・区画サイズは初期版に固定。運営によるgrid変更APIはない。
- 実機の静止・ロック中通信、OTP再認証、回線切断とOFF、2台表示、実NFC取消はT16等の未確認事項。
- npm auditは間接依存のZod（high）、deepmerge（low）を報告。Expo CLI/設定ツール経由。推奨されたExpo 51への破壊的降格は行わない。修正版互換性は公開前に再評価する。

## 互換性

Expoの雛形がRN 0.88.1を生成したが、`expo install --check` は0.88.0を指定したため、0.88.0へ揃え、互換チェックに合格。その構成のReleaseシミュレータビルド成功。最終構成のログイン画面の起動も確認。直接依存は実際のインストール版へ固定し、npm ciで再現する。

## 実機署名

2026-10-29：ユーザーがADP未加入と訂正。当面Personal Teamで進め、加入は約1か月後の予定。NFC読取・書込の実機確認を延期し、他の開発を止めない。

`YUMEGAOKA_LOCAL_ENTRY=1` の構成はNFC entitlementを除外。Debugまたは明示的な検証用Release（`YUMEGAOKA_VALIDATION_RELEASE=1`）かつローカルAPIの場合のみ、開発用ボタンで既存のタグIDを入力し、通常と同じ `native.checkin` → prepare/commit → 気配更新 → 集約 → 退出を実行する。会員認可や期限を迂回するAPIは追加しない。実NFCの成功として数えない。本番の毎回NFC必須は維持する。NFC付き構成へ戻すときはフラグを外してprebuildし、有効なADPチームで署名する。

Personal Team用Debug iPhoneビルドは2026-10-29に成功。変更後のTypeScriptとExpo ESLintも通過。R04/R11の実NFC確認は未実施であり、R05〜R10の実機通信確認も別途必要。開発用入力は仕様上のNFC必須を置き換えない。

## 通信断・再起動への補強（2026-10-29）

対象R04〜R10/R17/R21、T04/T05/T07/T10/T11/T12/T13/T15。製品の期限・同意・NFC条件は変更しない。

- `VisitLifecycle.swift`へ入街・結果照会・取消・退出を集約。処理中のOFFは世代を更新して先に記録し、戻った古い応答は採用しない。確定応答が紛失した入街は同じattemptを照会する。
- 端末のvisit/attempt/送信番号/OFFはApplication Supportの原子的JSON保存。バックエンドとAuth sessionごとに分離し、生座標・位置キューを保存しない。採番は送信前に保存し、再起動時はサーバーのlast_seqと最大値を採る。
- 未送信退出・未確定開始は5秒から最大30秒の間隔で回復を試みる。ネットワーク復帰と前面復帰でも照会。OS停止中の定刻実行を保証せず、期限は維持する。
- 位置権限拒否時は入街しない。別端末の滞在でこの端末のトグルをONにしない。
- 地図の取得中に届いた変更通知は次の取得へまとめ、ログアウト前の応答を破棄。人数分割後も各表示枠を元の期限でフェードする。丸い色付きの仮素材を使用し、本番アイコン素材の決定とは扱わない。
- 認証更新待ち・ログアウトの競合で古い認証応答を再採用しない。

本体のiPhone用DebugビルドをPersonal Teamで署名し、接続iPhoneへインストール・起動できた。UI自動試験用runnerは無料署名のインストール数上限で拒否されたため、既存の他アプリを削除せずシミュレータで検証する。実機のロック中歩行・機内モード操作は別途残る。

## この先の優先順

2026-10-30から[MVP_TASKS](MVP_TASKS.md)へ集約。中核の追加検証だけを先行し続けず、既存コードを再利用してT006（3タブ）、T007（Map）、T012（入退場UI）から全画面へ広げる。今回は監査で停止する。

## クラウドが必要になる時点

今はローカルSupabaseで進められる。Macと同じLANを離れた実機歩行・複数人の試験・本番OTP配信を行う段階で、Supabaseプロジェクトの地域・プラン・メール・公開URLが必要。その時にユーザーへ設定を依頼する。クラウドは作成していない。

## 再開後の確認（2026-10-30）

- OTP失敗を調査。今回再現した原因はUI試験のメール入力欠落と、過去の期限切れコードの選択だった。入力値を照合し、送信前のメールIDを除外して新着だけを使うよう修正。前回の汎用エラー全件が同じ原因だったとは断定しない。
- 製品側はメール入力の自動補正を無効化し、期限切れの説明とコード再送への戻り口を追加。認証保存失敗は秘密を含まないOSStatusだけ診断可能にした。シミュレータ本体はXcode標準署名で1回ビルドし直した。Keychain障害が元の原因だった証拠はない。
- 古いMetro設定を再起動で更新。入街トグルを覆っていたExpo開発用フローティングボタンを非表示にした。
- シミュレータで実OTP→認証→開発用タグ入街→製品Swift観測→実ローカルDB→気配表示を確認。MapLibre内の注釈はXCTestの文字検索では取得できず、そのアサーションは失敗したため、描画は画像で別途確認した。続きの入街済み状態から再起動→退出→再起動の限定UI試験は1件成功。通し試験全体が単一実行で合格したとは扱わない。
- 証拠：[気配表示](evidence/first-slice-presence.png)、[退出後の再起動](evidence/first-slice-after-exit.png)。詳細試験結果は `/tmp/yumegaoka-ui-exit.xcresult`。OTPを含み得る試験ログは公開しない。
- TypeScript/Lint成功。DB・状態管理は今回変更せず、前回のDB/表示21件、Swift観測19＋状態管理12 assertion、HTTP障害試験の結果を継続使用し、再実行していない。
- 認証世代ガードを含む既存Personal TeamビルドをiPhoneへ転送済み。今回のJS変更はMetro配信。新しいOSStatus診断ログだけはシミュレータビルドのみで、iPhoneを診断ログのためだけに再ビルドしていない。
- 地図背景は現在デモスタイルで、池袋の道路表示は未完成。気配の地図座標への描画と区別する。実機ロック中通信、物理回線断、2端末表示、実NFCは未確認。最初の一本の統合検証段階であり、MVP完成ではない。
- テスト街は架空の池袋範囲。実機が範囲外なら気配は出ず、街外判定で終了する。実機現地試験には試験場所の街設定とLAN外接続の準備が必要。クラウド作成・契約・公開は行っていない。

## cp103 再開地点
T029：アプリ共通通信はgatewayConnection/useStreetMapへ接続済み。035適用・直接Realtime停止済み。ローカル配信起動は `npm run realtime:local`（54325）。実Auth/DB共通transport再接続試験成功。次はMVP_REMAINING T029-05の既存上限/認可証拠照合。新RN画面は未ビルド、T031/T032でまとめる。旧iPhone版の直接Realtime通知は無効。残量初回30→26、外部3枠別、DONE12。無関係なテスト反復は不要。

cp104再開地点：T029/T022 DONE、14/33、残24項目。次T025-01の使用済招待受領者/ページング実UI。gateway起動はnpm run realtime:local、現在常駐は未起動。次のバッチReleaseではgateway接続・幅可変ヘッダー・ピン外観をまとめて確認する。今回はDB試験chat-flow/recruitment-flowのみ、製品変更なし。

cp105再開地点：T025 DONE、15/33、残23。次はT007-01/T015-01の幅可変ヘッダー/ピン描画とT031のgateway画面接続をまとめたRelease確認。シミュレータはcp96のまま。gateway常駐未起動。運営fixture清掃済み。

cp106再開地点：新Releaseをシミュレータへ反映済み（gateway/adaptive headerを含む）。testPresenceHeader成功、8枚/チェックイン10人を目視。イベントロゴは☁︎仮表示が残るためT007-01/T015-01未完。画像素材はapps/mobile/assetsに未収録。Figmaの雲＋斜め非常口ロゴ表現を次に具体化する。ローカルgateway session20058起動、再開時はlsofで確認。残23/DONE15。実機未更新。

cp107再開：ピンSVG実装と型/Lint成功、pod install済み。Release107ビルド session72066 が実行中（最終確認時コンパイル中）、/tmp/yumegaoka-release107.log。まず同sessionをpoll、成功ならsimctl install後、header UIの同じfixtureをUI_RESULT_PATHで新規xcresultへ出しピン描画を確認する。cp106には既存イベントピンが表示されていたが期限切れならfixtureイベントを用意。まだ再ビルド/再起動を重ねない。残23/DONE15。

cp108：現在地非送信・Map状態表示のコード経路照合でT007-02解消。残22、DONE15。Release107 session72066は最終pollで稼働中、RNSVGコンパイルまで進展・errorなし。再開時同sessionをpollし、再ビルドしない。

cp109再開：Release109成功・シミュレータへ更新済み。ピンSVG実表示確認でT007-01/T015-01解消、T015 DONE。残20/DONE16。次T018-01の既存outbox試験を確認し、2worker/取消の不足分だけ補完。ローカルgatewayの起動状態は再開時lsof確認。iPhoneは未更新。

cp110：T018 DONE、17/33、残19。次T020-01：chat-reconnect-integration/cp86とgateway-auth/cp103の接続を確認し、2閲覧者への実通知・差分復旧だけ不足なら追加。iPhoneは未転送。

cp111：T020 DONE、18/33、残18。gateway PID70930が54325待受を確認。次T023-01募集/イベント通報UIの未確認2入口を既存Smoke/operator fixtureで確認する。製品変更なし。

cp112再開：T023 DONE、19/33、残17。次T026-01。既存sticker-detail-stateとsticker-flowを読み、fake失敗/不一致/再開の実UI/DB不足だけ補う。シミュレータRelease109、専用通報fixture清掃済み。
