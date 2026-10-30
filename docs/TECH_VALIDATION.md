# 技術検証と実装状況

MVP全体の進捗は[MVP_TASKS](MVP_TASKS.md)、2026-10-30のコード照合は[MVP_IMPLEMENTATION_AUDIT](MVP_IMPLEMENTATION_AUDIT.md)。今回の監査では新規テスト・ビルド・実機転送を実行していない。以下の既存結果を再実行済みとは扱わない。

更新：2026-10-30。本体実装を開始。設計承認、実装、試験成功、実機確認を区別する。工程は[実装進捗](IMPLEMENTATION_PROGRESS.md)。

| 対象 | 確認済み | 限界 |
| --- | --- | --- |
| 本体雛形 | Expo 58.0.21 / RN 0.88.0（Expo互換指定へ調整） / React 19.3.0 / MapLibre 11.5.0 / NFC 4.2.0。lockfileあり | 本番配布は未確認 |
| ローカルDB | Supabase / PostgreSQL 17、4 migration適用 | クラウド未作成、公開・負荷試験なし |
| DB/API | `tests/database.test.mjs` の17 subtest通過（親suite含むrunner表示18）。同時commit、取消、置換、順序、鮮度、期限、writer、境界版、清掃、利用停止、私有表権限 | T01〜T15の全分岐を網羅した意味ではない。親ロック待ち中の更新と清掃を追加確認。範囲公開の並行は今後追加 |
| HTTP通し | `scripts/http-smoke.mjs`。実Auth session→入街API→区画更新→公開snapshot→退出、private Realtimeの変更通知 | NFCはAPI入力で代用。画面操作を伴う試験ではない |
| OTP | `scripts/otp-smoke.mjs`。ローカルMailpitへのコード配送→コード認証→未招待403を確認 | 本番メール・実機画面操作は未確認。シミュレータ画面から実ローカルOTP成功（下記） |
| 表示計算 | `tests/presence.test.mjs` 3件。6/7/8/11/12分割、2→1→0の期限別失効・分割後の個別透明度 | 実Map上の1人表示は画像確認済み。2端末同期は未確認 |
| Swift計算 | `tests/native/main.swift` 19 assertion。PROJ4と投影比較4地点、負座標、20m保持、内外距離、街外30〜120秒 | 全地域・実位置・壁時計変更試験ではない |
| 型/Lint | TypeScript、Expo ESLint、expo install --check通過 | ネイティブ・通信の正しさを代替しない |
| 本体ネイティブビルド | 初期構成Debug、Expo推奨RN 0.88.0でReleaseシミュレータ成功。最終RN 0.88.0 Releaseを新しいiOS 27シミュレータへ入れ、本体ログイン画面の起動を確認（[画面](evidence/first-slice-login.png)）。MapLibre・NFC・Swiftローカルモジュールを含む | 実機署名はPersonal TeamのNFC権限制限で失敗。ADP未加入と確認。NFC付き構成の実機確認は延期。NFC entitlementを除いたPersonal Team向けDebug iPhoneビルドは成功。接続iPhoneへのインストール・プロセス起動成功。実機背景通信の通し確認は未実施 |
| 実機NFC/背景通信 | コード実装、実物のステッカーがあるとユーザー回答 | T16未実行。従来試作の歩行結果を本体成功としない |
| クラウド | なし | 外出中もMacのLAN外で使う段階で設定が必要 |

## 今回追加した障害試験

- `npm test`：DB17 subtest＋表示3 test、親suite込み21件成功。
- `npm run test:native`：観測計算19 assertion、製品`VisitLifecycle`の12 assertion成功。偽通信を注入し、原子的ファイルを読み直して再起動を模擬。実機プロセス再起動とは区別する。
- `npm run test:lifecycle-http`：同じ製品Swift状態管理をURLSessionで実Auth/DB/APIへ接続。commit確定後の応答紛失、観測応答紛失、同一要求再送で期限不変、再生成したクライアントの採番、区画置換、通信断OFF、復帰後の退出優先、退出後の更新拒否を確認。障害は通信層へ注入し、実機の機内モード試験ではない。
- iPhone本体：Personal Teamでインストール・起動成功。UIテストrunnerの追加は無料署名アプリ数上限で失敗。ユーザーの別アプリは削除していない。

## 本体と仕様の差分・残検証

具体的な内部実装と設計との差分は[実装進捗](IMPLEMENTATION_PROGRESS.md)。未実装は本番招待・運営登録・チャット・募集・イベント全体、対応する通知・管理UI。今回の最初の一本の完成とMVP全機能の完成を混同しない。

背景通信はSwift URLSessionとCore Location。認証情報はKeychain、更新はactor一か所。OFFを端末へ先に記録し、失敗時は後で終了を再送する。これらの実コードは存在するが、通信断・強制終了・端末時計変更・静止中・ロック中の本体実機試験は未確認。

私有表に利用者の生座標を保存する列はない。端末は区画と判定だけを送る。公開snapshotは個人IDなし。これをサーバーに対する完全匿名性や追跡不能の証明とはしない。

## 既存の隔離試作の証拠（本体とは別）

[Swift試作](../experiments/presence-ios/README.md) は変更していない。過去のモデル17項目成功記録と、ユーザーによる実機起動・歩行確認がある。NFC・認証・地図・実通信は含まない。

ユーザー提供IMG_1065.PNG・IMG_1066.PNGでは、受理10回・背景8回・区画変化6回。開始23:21:04、最終観測23:33:48、停止23:52:42。最大間隔1,134秒は最終観測から停止までと一致。停止処理でも気配を消すため、停止後の「気配なし」は自動失効の証明ではない。電池減少0ポイントは粗い参考値で、省電力性の証明ではない。

試作は距離フィルター50m・要求精度100m・開始点半径2km・近似区画。製品側は距離フィルターなし・受理精度50m・固定投影区画・公開街境界・移動30秒/静止約3分を実装中。両者を同じコードの検証結果として扱わない。Androidは将来移植時に扱う。

## OTPと画面の再確認（2026-10-30）

R03〜R10/R21：OTPの新着選択・入力照合を修正後、シミュレータでログイン、開発用タグ入街、気配送信を確認。[地図の1人表示](evidence/first-slice-presence.png)は画像で確認した。MapLibre注釈をXCTestの文字検索で取得する試験は失敗しており、自動描画アサーションの成功とは扱わない。

同じ入街済み状態から、再起動→滞在継続→OFF→未参加→再起動→OFF維持の限定UI試験1件が成功（`/tmp/yumegaoka-ui-exit.xcresult`）。[退出後](evidence/first-slice-after-exit.png)は人数0・気配なし。元の一本の試験を先頭から再実行せず、成功した部分と続きの試験を組み合わせた確認である。残したSmoke.swiftはこの一連の操作を含む。

製品側はコード期限切れの説明・再送導線、入力自動補正無効化、開発用ボタンのトグル干渉を修正。シミュレータ本体は標準署名で1回再ビルド。TypeScript/Lint成功。今回変更していないDB・状態管理の既存試験は再実行していない。詳細原因・実機転送差分・次の残作業は[実装進捗](IMPLEMENTATION_PROGRESS.md#再開後の確認2026-10-30)。背景地図はデモで道路表示は未完成。実機のロック中通信・物理的な通信断は未確認。

## 2026-10-30 全体実装再開後

T003/T004/T006/T013〜T018/T020〜T022/T029/T030を接続中。プロフィール・招待・募集清掃・チャット・イベント・募集のローカルDB統合試験が成功。証拠はtests/profile.test.mjs、invitations.test.mjs、recruitment-retention.test.mjs、chat-flow.test.mjs、event-flow.test.mjs、recruitment-flow.test.mjs。SQL試験はローカルでclaimsを設定しauthenticatedロールで公開RPCへ接続する。JWT署名そのものの新規検証ではない。

シミュレータの現在地追加版を1回ビルド成功。3タブと作成/場所選択/入力保持/設定内各画面のUI試験を実行。最初はTabBar限定の検索が誤って失敗し、アクセシビリティ識別の修正後、限定試験1件43.8秒で成功。新規イベント/チャット/募集画面を含む全通し試験、物理iPhone操作、本人画像、実Push/NFCは未確認。詳細はMVP_TASKSの最新checkpoint。今回の新機能を全面DONEとはしない。


## 2026-10-30 MFA/通報接続（R03/R15〜R18）
運営資格＋JWT AAL2＋現存セッション/検証済みTOTPのDB guardを実装。operator-access.test.mjsで資格なし・追加認証なし・factor失効・運営失効の拒否を確認。report-flow.test.mjsで通報、重複統合、サーバー由来証拠、運営削除、解決、30日後清掃を確認。SQLの列名/変数衝突を修正して再実行成功。chat-flow.test.mjsに取消後遅延再送拒否と確定済み結果回収を追加し成功。
型検査成功、Lintエラー0/既存StreetChat警告1。SwiftのMFA APIは未ビルド、稼働AuthのMFA設定反映・実Auth通信・新規画面実操作・実機転送は未確認。これらをDBテスト成功で代替しない。


## 2026-10-30 運営認証の実Auth確認と制限（R03/R16/R18）
scripts/mfa-smoke.mjs成功：実OTP→TOTP→運営API、資格失効後403。試験fixture削除済み。MFAネイティブビルドも成功（/tmp/yumegaoka-mfa-build.log）、iPhone転送はまだ。
member-operations.test.mjs成功：投稿制限中も滞在維持、解除後送信、利用停止で主催イベント中止/通知・滞在終了、解除しても復活なし、招待枠と発行停止を反映。report-flow.test.mjs再実行成功。改行整形とuseStreetChat分離後、型検査・Lintとも成功、警告なし。
UI新機能の実操作・競合全ケースは未確認。通報済み証拠は通常投稿削除後も運営限定期限で保持する。


## 2026-10-30 ステッカーと街範囲（R04/R11/R18）
sticker-flow.test.mjs成功。未照合状態から設置済みへ飛ばす要求拒否、3点凸包公開と同操作再送、範囲変更で滞在を消さないこと、停止後プレビュー拒否、地点不足時旧版維持をローカルDBで確認。準備・照合・設置・地図プレビュー画面と開発用物理NFC代用を接続。実画面操作と実NFCは未確認。交換・下書き再開・清掃の残処理はMVP_TASKS参照。


## 2026-10-30 本人アイコンのStorage連携（R03/R15/R17）
scripts/avatar-smoke.mjs成功：所有者アップロード、プロフィール保存参照、別会員読取、他人上書き/公開アクセス/2MB超過/停止会員読取の拒否。使い捨て画像・ユーザー削除済み。
選択・512pxデコード・JPEG再エンコードのクライアント処理を追加。ImageManipulatorのiOS保存実装はUIImageからエンコードする。実機出力のメタデータ/寸法確認、新依存のビルド・UI操作は未実施。型検査成功。署名URLによる公開化はしていない。


## 2026-10-30 アカウント・イベント接続（T005/T017/T018/T030、R03/R13/R14/R16〜R18）
- 017/018のDB処理、メール変更と退会画面、ネイティブ認証ブリッジ、ローカル清掃workerを追加。
- account-smoke成功：旧メールだけでは変更しない、新旧両確認で変更、退会前の認証を拒否、再認証後に資格停止/匿名化/プロフィール削除、workerによるAuth soft-deleteと清掃完了。最初の失敗はAuthの自動確認設定、その後の失敗は起動直後のテンプレート読込。設定反映・読込後の再試行で成功。秘密値は試験出力しない。
- event-flow成功：作成→参加→取消/再送→変更通知→名簿権限→中止の再送。
- /tmp/yumegaoka-account-profile-build.logでBUILD SUCCEEDED。画像選択とアカウントブリッジを含むシミュレータ向けビルドであり、実機操作の証拠ではない。
- TypeScript/Lint成功。退会フックの通信再試行処理はコード反映済みだが、画面での通信断/再起動試験は未実施。全MVP完了を意味しない。


## 2026-10-30 Map分割と匿名投稿（T007/T020/T023、R03/R15〜R19）
- Map画面の状態管理をuseStreetMap、マーカーをStreetMapMarkers、スタイルを別ファイルへ分離。TypeScript/Lint成功。
- 019の匿名投稿通報と表示をreport-flowで確認。退会後の匿名投稿はアカウント情報を復元せず通報でき、ブロック操作は表示しない。
- 本体の再ビルドなし。直前の成功したビルドをシミュレータへインストールし、testMVPNavigation成功（43.624秒、失敗0、/tmp/yumegaoka-map-refactor-ui-retry.log）。初回は既に除去した説明文を待つテストの不整合で失敗。地点確定ボタンを確認する形へ修正した。
- 実iPhone操作、新規アカウント画面の入力、全機能統合、背景観測の再検証ではない。


## 2026-10-30 登録下書きの編集・取消（T026、R04/R11/R17/R18）
020 migrationを実ローカルDBに適用。sticker-flowで設置位置編集後の設置再確認、古い公開要求拒否、取消再送、未公開ID廃止、遅延step拒否を確認。型検査/Lint成功。画面接続は実装済みだが実操作未確認。JS/SQL変更のため本体再ビルド・実機転送は省略。


## 2026-10-30 ステッカー交換（T027、R04/R11/R17/R18）
021をローカル適用。sticker-flowで準備中の旧タグ維持→新タグ設置→旧タグ廃止/新タグ有効化/新範囲公開→公開再送を確認。SQL変数衝突の初回失敗を修正して成功。型検査/Lint成功。物理NFC・運営画面一巡は未確認、ネイティブ再ビルド省略。


## 2026-10-30 運営ステッカーUI（T024/T026、R04/R11/R17/R18/R19）
実TOTPを使ったシミュレータ運営UIで登録→NFC代用→照合→設置→編集→取消に成功。初回TOTP拒否は試験のキー取得と入力照合の修正後に解消。認可を迂回していない。本体再ビルドなし、型検査/Lint成功。試験後に専用資格/因子を失効。公開/交換UI、実タグ、実iPhoneの結果ではない。後から加えた試験専用アカウント確認ガードは未再実行。


## 2026-10-30 範囲公開・交換UI（T027、R11/R18/R19）
シミュレータのtestOperatorAreaPublication成功、101.305秒。実TOTP→3地点登録と設置→凸包プレビュー→公開→交換準備/設置→再公開→廃止表示を確認。物理NFCのみ代用。旧運営試験と認証helperを共有し、試験ビルドの戻り値誤りを直して実行。本体再ビルドなし。専用アカウントの資格/因子を終了後失効。同時編集・通信断UI・実機の証拠ではない。
ローカル清掃workerを起動し初回清掃成功（0件）。通信期限を15秒へ設定、node --check成功。保持期限の全種別網羅試験や運用SLAの証拠ではない。


## 2026-10-30 認証切替UI（T005/T006/T031、R03/R17/R19/R21）
共有sessionStateとidentityごとの画面再生成を追加。初回Proxyはネイティブのイベント登録で描画エラー、明示的bridge呼出しへ修正。session-state.test、型検査、Lint成功。testLoginEntryRestartExitは59.996秒で成功し、ログアウト→OTP→入街→更新→再起動→退出→再起動を一本で確認した。本体再ビルドなし。遠隔失効・他アカウント往復・実iPhone背景の証拠ではない。


## 2026-10-30 利用資格ゲート（T003/T005/T024/T031、R03/R17〜R19）
022本人の資格照会、未登録/停止/退会のルーティング、観測停止を接続。DB状態試験とconfigure重複抑止/再試行、session状態試験成功。初回UIは認証再初期化競合でログアウトしたため修正。再試験は停止会員のOTPログイン→停止画面を26.007秒で通過し、入街/投稿欄なしを確認。fixture資格は復元。型検査/Lint成功。初回照会タイマー化後はLintのみ確認しUI再実行省略。遠隔停止からの動的切替・解除・実機は未確認。


## 2026-10-30：招待後のプロフィール導線
- T003/T004/R03：利用資格が有効でも表示名未設定ならprofile_requiredとしてプロフィールへ誘導。端末内の一時フラグではなくprofile_getの保存値で判断し、再起動時にも再開する。保存成功後に利用状態を再取得してMapへ遷移する。通常のプロフィール編集では画面を離れない。
- 未登録者の招待画面では発行操作を出さず、受領に絞った。説明文で次の画面を探させる案内を削除。写真の選択・変更は既存プロフィール画面を利用する。
- account-onboarding.test.mjsの2ケース成功：名前未設定/保存済み、未登録/停止/退会、プロフィール照会の通信失敗を確認。実際のhookを実行し、React/native境界はテスト代替。型チェック・Lint・diff check成功。
- 未確認：招待入力→名前保存→Mapの画面操作、写真選択、再起動を含む初回登録の実機統合。ネイティブ変更なしのため本体ビルド・転送は省略。T003/T004はIN_PROGRESS、5/33・実装到達7/33を維持。
- 次：この導線の画面確認、街アイコンの表示枠への割当、チャットと通知の更新接続。街アイコンは本人画像を流用せず、素材選定と描画の残りをT007で管理する。


## 実装チェックポイント20：チャットの新着・履歴接続
- T020/T021/R15/R16：Mapの既存private Broadcast購読から本文を含まない更新合図をチャットへ接続。購読復帰、前面復帰、5秒の補完照会でも再取得。履歴閲覧中も更新を止めない。
- readChatWindowで最新から既読の最古カーソルまで50件ずつ取り直す。50件を超える切断中の新着を補完し、ブロック/期限除外行を古いキャッシュから足し戻さない。読み込み済み範囲の古い境界を維持する。取得間隔は最低2.6秒、同時取得は直列化。削除/ブロック操作時に表示と参照キャッシュを更新し、古い進行中の応答を世代番号で無効化。
- 履歴中は新着へ強制移動せず「新着へ」操作を追加。通常表示は末尾へ追従。iOSの表示位置維持を設定。アンマウント後の予約再取得は止める。
- chat-window.test.mjs 3ケース成功：126件の範囲を3ページで復元、削除/非表示の置換、取消後応答破棄。型検査成功（RN0.88のScrollView ref型差分をComponentRefへ修正）、Lint成功、diff check成功。
- 未確認：実Broadcastから別端末のチャット描画、履歴スクロール保持と新着ボタンの実操作、大量履歴時の再取得負荷、背景ぼかし。DBの認可試験を今回再実行したものではない。本体ビルドはJS変更のみにつき省略。T020/T021はIN_PROGRESS。全体5/33、実装到達7/33維持。


## 実装チェックポイント21：初回登録の画面統合確認
- T003/T004/R03：testInvitationOnboarding成功（54.691秒、/tmp/yumegaoka-onboarding-ui-final.log）。ローカルAuthへ新しい検証用メールで実OTPログイン、単回招待の受領、未設定プロフィールでアプリ再起動、名前保存、Mapへの遷移、再起動後のMap復元、ログアウトまで確認。
- 初回は既存検証アカウントの名前未設定から抜ける操作がなく待機。初回設定と未登録の招待画面にログアウトを追加。次の失敗は同名の見出しを試験が押していたため、ボタンのセレクタへ修正。認可条件は変更していない。
- scripts/prepare-ui-test.mjs --onboardingで専用のローカル招待を準備できる。試験は新規@example.testを使用し、外部メール配信なし。本体再ビルドなし、テストrunnerのみ更新。
- 成功後にプロフィールのログアウト失敗表示を追加。型検査・Lint・diff check成功。このエラー表示追加後のUI再実行は省略。
- 写真選択・招待発行の応答消失・全体実機統合は未確認。T003/T004はIN_PROGRESS。全体5/33・実装到達7/33維持。次は街アイコンとチャット画面統合の残り。


## 実装チェックポイント22：通知画面の更新・既読接続
- T018/R13/R14：通知取得と既読操作をuseNotificationsへ分離。画面focus/前面復帰/10秒補完/既存street変更合図で再取得。未読の視覚表示、中止通知の確認済み表示、確認処理中の重複タップ抑止を接続。初回取得中に「通知なし」を出さない。
- 既読成功で古い一覧応答を世代番号で無効化し、未読への巻き戻りを防ぐ。notifications-state.test.mjs成功。型検査・Lint・diff check成功。
- 未確認：イベント変更から別端末通知画面までの統合、実機での既読操作。Push配信/外部設定はこの変更に含まない。JSのみで本体再ビルド省略。T018はIN_PROGRESS、全体5/33、実装到達7/33維持。
- 街poolは本人チャット画像との関係・本人の当日割当表示・取り下げ/日替わり境界を質問中。回答待ちを承認として扱わず、他の接続を継続する。


## 実装チェックポイント23：街poolのDB/API基盤
- T003/T004/T007/T030/R03/R10/R17：023 migrationをローカル適用。本人avatarと別の非公開street-icons bucket（JPEG/2MB）、ランダム画像パス、所有者/街別の提供レコード、現在日付の割当レコードを追加。公開パスにアカウントIDを埋め込まない。
- street_icon_prepare/get/publish/removeを追加。準備のみでは公開画像を取り下げず、Storageメタデータ確認後に差し替える。削除は画像IDを指定し、古い削除再送で新しい画像を消さない。日次割当は日本時間日付で更新し、日ごとの履歴行は蓄積しない。割当画像が取り下げられた場合は利用可能なpoolから再選択する。候補なしでは画像を捏造しない。
- 退会トリガーで提供を取り下げ、本人の割当を消す。通常読取ポリシーは取り下げ済み画像を拒否。提供中画像をStorageへ直接上書きできない。
- street-icon-pool.test.mjs成功：準備再試行、公開/差し替え、取り下げ画像への読取拒否、古い削除要求、日本時間0時の境界、割当履歴を増やさないこと、退会を確認。初回はfixtureの街ID誤りをseedへ修正して再実行。実Storageバイト転送ではなくメタデータfixtureによるDB検証。
- 未実装：登録/設定UI、実画像アップロード、地図集約との画像接続、未完了upload/取り下げ画像の物理清掃。未検証：複数接続での割当競合、Storage実HTTPと画像キャッシュの取り下げ、iPhone。全体5/33、実装到達7/33維持。次は画像転送・本人確認画面・地図接続を進める。


## 実装チェックポイント24：街poolの登録・設定画面
- T003/T004/T007/R03/R10：street-icons画面で共有用途の説明、提供/差し替え/取り下げ、当日の本人割当を表示。Settingsから参照可能。本人avatarとは別bucket/pathを使い、既存のJPEG再エンコード・縮小・サイズ制限を共通化して転送処理へ接続。
- 024 icon_enrollmentsで初回の提供完了と現在の提供画像を分離。登録は名前→pool画像の提供→Map。取り下げ後は再提供を強制せず、退会時は提供完了情報も削除する。
- account-onboarding 3ケースとstreet-icon-poolのDBケース成功。型検査・Lint成功。共有Avatarはbucketを明示選択できる。既存本人画像の保存先は変更しない。
- 未確認：写真選択→実Storage→画面表示の一巡、取り下げ時の画像キャッシュ、提供画面のUI確認。旧testInvitationOnboardingは名前保存までの旧導線の証拠であり、新しいpool必須フローの成功証拠ではない。テスト更新と実操作を次に実施する。
- 未実装：地図集約の当日画像接続、物理画像清掃。全体5/33・実装到達7/33維持。本体ネイティブ変更なし、ビルド/転送省略。pushなし。


## 実装チェックポイント25：当日アイコンと地図集約
- T007/T011/R07/R08/R10：025 migrationで気配集約へ当日割当の画像パスを接続。生存する気配の利用者へ内部割当を行い、人数・期限・画像枠を同一SQLスナップショットで集約。公開値に名前/account/visit識別子を追加しない。新規入街が割当準備直後に競合した場合は画像なしの既存マーカーで人数を維持し、次回取得で割当する。
- liveCellsは画像と個別透明度を同じ失効枠で保持。7人→5+2への分割も同じ観測地点の描画のみ。地図では本人Avatarの保存先と分けてstreet-iconsを読む。画像未提供/候補なしの気配は捏造せず既存マーカーを残す。
- street-icon-pool DBテスト成功：本人の当日画像が集約へ含まれる、画像数と人数一致、account/visitID非公開。presence.test.mjs 4ケース成功：人数保存、個別期限、フェード維持、画像付き分割/失効。型検査・Lint成功。
- 未確認：実画像を使ったMapLibre描画、日替わり/取り下げ後の端末画像キャッシュ、複数接続の競合、実機。未実装：pool物理画像清掃。T007はIN_PROGRESS。T011の既存集約検証はこの対象回帰試験で補足するが、地図全体をDONEにしない。全体5/33・実装到達7/33維持。ローカルcommitのみ、pushなし。


## 実装チェックポイント26：pool画像の実Storage・取り下げ清掃
- T004/T030/R10/R17：026 icon_cleanupはservice_role専用。取り下げ済み画像だけを5分leaseで取得し、Storage削除確認後に割当参照と提供レコードを削除。失敗は5分後に再試行。登録完了情報は取り下げ後も維持。
- maintenance-workerへpool清掃を接続。既存worker PID87802を確認して終了し、新版を1プロセス起動。Mac停止後はREADMEの手順で再起動が必要。
- scripts/street-icon-smoke.mjs成功。ローカルAuthの専用2利用者と実JPEGで、HTTP保存→公開→別会員が同一バイト取得→他人/公開済み画像の上書き拒否→公開URL拒否→取り下げ後読取拒否→通常会員の清掃API拒否→worker物理削除を確認。fixtureは削除。
- 未確認：アップロードと取り下げ/workerの同時競合、通信断再試行、端末キャッシュ、写真選択とMap描画。未完了アップロードの清掃期限/処理は残る。これらを完了とはしない。全体5/33・実装到達7/33維持。ネイティブ変更なし、本体ビルド省略。pushなし。


## 実装チェックポイント27：写真選択のUI検証は未完
- T003/T004/T007：testInvitationOnboardingを新仕様の名前→pool画像提供へ更新。シミュレータにアプリ同梱icon.pngを検証素材として追加。名前設定とpool画面への再起動復帰までは到達。
- 写真ピッカー表示後にUIテストが画像を選択できず失敗。collectionViewsに現れず、確認済み画面の先頭画像への座標操作でも選択されなかった。対象シミュレータは6410E701（iOS27）、アプリ/画面frameは402x874。写真ピッカーは表示されるが、アプリのaccessibility treeには背後の登録画面だけが出る。原因をOSの確定不具合とは断定しない。
- OTPを繰り返さないtestPoolRegistrationFromPendingへ範囲を絞って確認したが未解決。診断結果は/tmp/yumegaoka-pool-picker-diagnostic.log、スクリーンショット/tmp/yumegaoka-pool-focused.png。写真選択後の保存・Map遷移・表示を成功扱いにしない。
- 本体ネイティブ再ビルドなし。テストrunnerのみ変更。これ以上同条件での反復はせず、実機/手動選択またはシステムpicker自動操作の解決が必要。既存の実Storage HTTP試験の成功とは別の確認層。全体5/33・実装到達7/33維持。


## 実装チェックポイント28：招待発行の再送接続
- T003/T029/R03/R16：027でinvite_createを共通command受付へ接続。受付10分・結果の既定保持期限を再利用。旧直接発行APIは拒否。既存invite作成の7日5件制限/会員検査を再利用し、再送は同じ結果を返すため追加消費しない。
- 招待画面はsubmitCommandを使用。再起動/応答消失で未確認の受付があれば「前回の招待を確認」で結果を復元する。招待コードは結果復元に必要なため非公開commands結果に既定の短期保持期間だけ含まれ、招待テーブル本体はハッシュを保持する。
- invitations.test.mjs成功：同じ受付の再送/状態照会で同じ招待、発行1件、停止後の再送で復活なし、別受付による意図的な新規発行、単回消費、停止会員の再登録拒否。型検査・Lint・diff check成功。
- 未確認：実機での発行応答消失/再起動、同時消費・発行上限の並列境界。登録のpool写真選択は別途未完。T003/T029はIN_PROGRESS。全体5/33・実装到達7/33維持。ネイティブ変更なし、本体ビルドなし。pushなし。


## 実装チェックポイント29：ピン作成の未確認送信復元
- T014/T015/T029/R12/R13：作成画面の送信・現在地確認・取消をusePinCreationへ分離。保存済み共通commandから未確認イベント/募集を復元し、タイトル・日時・定員・地点をフォームへ戻す。イベントは再構成せず保存済み本文そのものを再送する。
- 結果未確認の内容を編集やタブ切替で上書きしない。既存の取消確認後に編集を再開し、取消時点ですでに作成成功ならその詳細へ移る。作成済みを確認した場合は下書きを消す。
- pin-recovery.test.mjs成功：初期化後の未確認イベントを復元→同じ本文で送信→作成済み詳細へ遷移。React/native境界は代替のhook試験。型検査・Lint・diff check成功。
- 未確認：実機の再起動/通信断での作成再開、地点選択の往復との統合。まだ送信していない下書きはメモリのみで、永続化は未実装。写真ピッカーの課題と混同しない。全体5/33・実装到達7/33維持。ネイティブ変更なし、ビルド省略。pushなし。

## 実装チェックポイント30：イベント詳細とHomeの状態接続
- T013/T016/T017/R13/R14/R19：詳細の取得・参加/取消・中止・名簿をuseEventDetailに分離。二重操作を同期refで抑止し、変更前の遅延取得で参加状態を戻さない。応答紛失は状態を再取得し、成功と推測しない。中止成功後は取得不能な詳細を再取得せず中止表示へ移る。
- Home一覧をuseHomePinsへ分離。画面復帰・前面復帰・街変更合図・10秒補完でイベント/募集を一緒に再取得。募集タブの初回ロード中も空表示にしない。名簿は取得中/空/失敗を区別し、変更時に古い名簿を破棄する。
- event-detail-state.test.mjs 3件成功：古い取得と参加の逆順、二重タップ、中止後の無用な再取得なし、応答紛失後の状態確認。型チェック・Lint成功。DB処理は変更していないため既存event-flow.test.mjsの成功結果を再利用し、再実行なし。ネイティブ変更なし、ビルド/転送なし。
- 未確認：実端末での詳細→参加→Home→取消、別利用者の変更/中止受信、最後の席の並列競合。T013/T016/T017はIN_PROGRESS。全体5/33（15.2%）、実装到達7/33（21.2%）を維持。ユーザーへの写真選択確認は未完であり、登録全体DONEにはしない。pushなし。

## 実装チェックポイント31：イベントの並列受付
- T016/T017/R13/R14：event-concurrency.test.mjsを追加。実PostgreSQLの独立した認証済み接続から、親イベントロックに対して最後の1席への参加と、中止/参加を並行送信して確認。
- 成功：最後の席は1人だけ受理、取消後の古い参加を拒否、開催中の参加を受理、中止後は詳細取得・参加再送を拒否し参加予定一覧から消える。専用試験データはfinallyで削除。既存event-flowの逐次試験を並列証拠として流用しない。
- シミュレータは起動中・Metroも稼働を確認。写真選択シートは表示されるが自動選択未確認。シミュレータGUIの起動先は見つからず、このターンでUI一巡の成功証拠は得ていない。写真登録をモック成功として扱わない。
- 製品コード変更なし。型チェック/Lint/ネイティブビルドは再実行不要のため省略。全体5/33、実装到達7/33、状態件数は変更なし。次は登録済みの専用試験アカウントでイベントUIの一巡確認。pushなし。

## 実装チェックポイント32：チャット集中表示・実機検証方式
- T006/T020/R15/R19：StreetChatを地図/ヘッダーより上の独立レイヤーへ移し、拡大中はexpo-blurで背景をぼかす。地図側タップまたは「地図へ」で閉じ、キーボードも閉じる。KeyboardAvoidingViewと画面高さに応じたチャット高さを接続。空状態の不要なスローガンを除去。
- T014/T016/R12/R13/R19：募集・イベント詳細のStackをmodalに設定し、合意した詳細シートとして開く構成へ変更。
- expo-blurはExpo SDK58互換の~58.0.5をexpo installで追加。型チェック・Lint・diff check成功。新ネイティブ依存のため既存バイナリでの動作を保証せず、次のまとめたReleaseビルドで描画・キーボード・小画面・地図タップ・シート復帰を確認する。実機確認なし、タスクDONEは増やさない。
- ユーザーはiPhoneの開発クライアントでloading errorと報告し、接続調査より実装継続を希望。実機テストは後でJS内蔵のReleaseビルドを直接iPhoneへ入れる方針を指定。ローカルSupabaseへの通信は引き続きMac接続が必要。現状localEntryは__DEV__で制限されており、Release検証専用の明示的構成が必要。公開用と混同してNFC認可を外さない。
- 未送信下書きの再起動永続化は追加しなかった。現行T015の下書き条件はMap往復保持であり、未確認送信の永続化とは区別する。先に全機能の一巡を優先。
- 依存監査：highは既存Expo CLI経由のzod oversized collection検証DoSとその上位依存。expo-blur自体の指摘なし。npmの提案はExpo51へのmajor downgradeで互換性を壊すため自動適用しない。開発ツールの修正版適合確認は残る。
- 全体5/33（15.2%）、実装到達7/33（21.2%）、DONE5/IMPLEMENTED2/IN_PROGRESS21/TODO2/BLOCKED3維持。次はRelease実機検証構成と残る画面統合。pushなし。

## 実装チェックポイント33：Release検証構成・イベント編集競合
- T032/R19/R21：app.config/developmentへ検証Releaseの明示フラグを追加。非ローカルAPIとNFC代替なしの組合せを構成段階で拒否。通常Releaseでは代替無効。scripts/ios-validation-release.mjsにprebuild→Release/実機インストールの手順を保存。ユーザーの「後で」に従い今回ビルド/転送は行っていない。
- validation-release.test.mjs成功：検証Releaseのlocal許可、通常Release/公開ホスト拒否、NFC設定分離。初回試験のConstants代替がESModuleのdefaultを二重ラップしたため失敗し、試験境界を修正後成功。型チェック・Lint・diff check成功。
- T017/R13：イベント編集のconflict時は入力を保持し最新内容を比較表示。保存を止め、ユーザーが破棄確認した場合だけ最新内容を再取得してフォームへ反映。初回取得失敗の再取得ボタン、送信中の入力ロックを追加。実機での競合/再編集は未確認。
- 仕様変更はユーザー指定の実機検証方式のみ。未送信下書きの永続化は追加していない。全体5/33（15.2%）、実装到達7/33（21.2%）、DONE5/IMPLEMENTED2/IN_PROGRESS21/TODO2/BLOCKED3。次は残る機能の統合と、まとめたReleaseビルド準備。pushなし。

## 実装チェックポイント34：募集詳細の終了・再取得接続
- T014/R12/R19：募集詳細をuseRecruitmentDetailへ分離。画面復帰/前面復帰/街変更/10秒補完で再取得し、終了した募集の地点・編集操作を画面から除く。手動終了成功は終了表示へ切り替え、Home/Map側へ更新合図を出す。
- 題名入力中は取得結果で入力や元revisionを上書きしない。競合をサーバーで拒否できる状態を保ち、利用者が確認した場合だけ最新題名へ置き換える。古い取得応答、二重送信を抑止。ネットワーク失敗中の地点表示を外し、回復後は入力と元revisionを保持して再開する。
- recruitment-detail-state.test.mjs 2件成功（更新/通信回復で入力・revision保持、終了後の再取得で復活なし）。初回で通信回復時に表示を戻せない分岐を検出して修正。型チェックはref初期値不足を修正後成功。Lint成功。ネイティブ変更なし、ビルド/転送は後のReleaseへ集約。
- 未確認：実機UIでの作成→題名変更→終了→Map/Home反映、退出/期限の実画面同期。既存DB処理は変更なし。T014はIN_PROGRESS。全体5/33、実装到達7/33、状態件数は維持。pushなし。

## 実装チェックポイント35：投稿制限をチャットへ接続
- T020/T024/R15/R16/R18：028で本人向けaccount_accessへchat_restricted_untilを追加。認証済み本人だけ、期限が有効な間だけ返す。active会員のまま投稿制限を扱い、利用停止とは区別する。既存API委譲を保ち、サーバーの投稿拒否条件は変更しない。
- useAccountAccessの10秒/前面復帰更新からチャットへ制限期限を渡す。送信操作を止め、理由と終了日時を表示。閲覧と入力保持、街の滞在は継続。期限切れ/運営解除は次回取得で反映。
- ローカル028適用済み。account-accessの実DB試験成功（本人状態、制限期限、期限切れ、停止/退会/認証期限）。account-onboardingの初回は追加フィールドで期待値不一致、期待値にnull制限を明示して3件成功。型チェック・Lint・diff check成功。
- 実機の運営→制限→利用者画面反映は未確認。ネイティブ変更なし、Releaseビルド/転送はまとめて後で行う。全体5/33、実装到達7/33、状態件数変更なし。pushなし。

## 実装チェックポイント36：ブロック変更を各画面へ反映
- T022/R15/R18：localBlocksにセッション内の即時除外状態を追加。ブロック成功でチャット/Map/Homeの募集/募集詳細を除外し、操作前の遅延取得も同じ除外状態で検査する。サーバー側の取得フィルターは維持。イベント・人数・気配には適用しない。
- 設定の解除を共有状態に通知して再取得する。別アカウントに端末内の除外状態を持ち越さず、identity変更で破棄。設定の二重解除は処理中ガードで抑制。
- session-state/recruitment-detail-state計4件成功。遅れた募集取得をブロック後に描画しないこと、解除後は取得可能、アカウント切替でローカル除外状態を破棄することを確認。型チェック・Lint・diff check成功。サーバー処理変更なし、DB試験の反復なし。実機画面間の反映は次のRelease検証へ残す。
- 全体5/33、実装到達7/33、状態件数は維持。ネイティブ変更なし、ビルド/転送なし。pushなし。

## 実装チェックポイント37：チャット未確認送信の回復UI
- T020/T029/R15/R16：送信/再起動復元をuseChatComposerへ分離。未確認本文を固定し「結果を確認」「未確定の送信を取り消して編集」を追加。cancelPendingCommandの既存サーバー直列化を利用し、取消より先に送信済みなら重複作成せず送信済みと案内する。未確定取消なら入力を残して編集可能に戻す。
- 保存済み受付を読めない場合は新規送信を停止し、再取得ボタンを提示。初回復元中の入力上書きや送信中の二重タップを防ぐ。既存の投稿制限、再送受付10分/結果保持方式は変更しない。
- chat-composer.test.mjs 3件成功：未確認本文復元/同じ内容で結果確認、取消結果が送信済みか未確定かによる分岐、保存読取失敗時の新規送信禁止。commands/native境界を代替するhook検証で、端末再起動・実通信断の証拠ではない。型チェック成功。Lintの初期effect内state更新指摘を修正して成功。diff check成功。
- 実機の通信断/再起動からの復旧はRelease確認に残す。全体5/33、実装到達7/33、状態件数維持。ネイティブ変更・ビルド・転送・pushなし。

## 実装チェックポイント38：まとめた実機Releaseの生成
- T031/T032をTODOからIN_PROGRESSへ更新。全画面間の接続とRelease検証準備に実際に着手しているため。分母33・DONE5・IMPLEMENTED2は不変。IN_PROGRESS23/TODO0/BLOCKED3。完了15.2%、実装到達21.2%。
- YUMEGAOKA_LOCAL_ENTRY=1 / YUMEGAOKA_VALIDATION_RELEASE=1でiOS prebuild/Pods導入。ExpoBlur58.0.5/PresenceNativeを含む。生成iOSはprebuildが再生成したため、生成物の手修正は正本にしない。
- 最初のReleaseはディスク空き185MiBでlibRNScreens.a書込errno28により失敗。過去の/tmp/yumegaoka-native-build/Build、yumegaoka-next-build/Build、yumegaoka-derived/Buildのみ削除し約13GiB確保。ソース/DB/過去Logsは保持。原因解消後に同じDerivedDataを使って再実行しBUILD SUCCEEDED。
- 成果物：/tmp/yumegaoka-validation-release/Build/Products/Release-iphoneos/app.app。名称「夢ヶ丘 検証用」、bundleID jp.yumegaoka.development、main.jsbundle 3.5MiB内蔵、ローカルネットワーク/ATS設定を確認。codesign --verify --deep --strict成功。ログ：/tmp/yumegaoka-validation-release-build.log（容量不足）、/tmp/yumegaoka-validation-release-retry.log（成功）。ソース基点70ac9d6、以降は進捗文書のみ。
- iPhone 00008150-0002059A3488C01Cはpaired/available表示だったが、devicectl installはCoreDevice4000/NWError60接続タイムアウトで失敗。未インストール・未起動・実機操作未確認。再ビルドせず同じappを転送する。ユーザーへUSB接続/ロック解除を依頼中。他作業は継続可能。
- この成功は全機能DONEの根拠にはしない。次：端末接続後に転送、初回登録/街pool/入退街/チャット/イベント/運営の操作と実DBを照合。実NFC/Push/クラウドは既存BLOCKEDのまま。pushなし。

## 実装チェックポイント39：pool取り下げと書込の競合
- T004/T030/R17：029でStorage書込認可をstreet_icons行ロックと直列化。取り下げ/公開を待った書込は最新行状態を検査し、削除後の遅延書込を拒否。通常読取の公開範囲は変更しない。ローカルDB適用済み、アプリの再ビルド不要。
- street-icon-pool.test.mjs成功。icon-upload-race.test.mjsで独立接続の実ロック待ちをpg_blocking_pidsから観測し、取り下げコミット後の書込拒否を確認。street-icon-smoke.mjsで実HTTP保存/会員読取/上書き拒否/取り下げ/worker物理削除/登録完了維持を確認。
- 未完了アップロードの保持期限は未決定。24時間削除案をユーザーへ確認中。回答前に期限清掃を追加しない。公開済み画像や登録完了とは別扱い。
- Release成果物は70ac9d6基点のまま保持し、今回変更はサーバー認可のみ。iPhone接続の回答待ち。全体5/33、実装到達7/33、DONE5/IMPLEMENTED2/IN_PROGRESS23/TODO0/BLOCKED3維持。型/Lint/ネイティブは対象コード変更なしで省略。pushなし。

## 実装チェックポイント40：通報対応画面の状態管理
- T024/R15/R18：useModerationへ一覧取得と対応操作を分離。画面離脱後・対応操作前の古い応答を破棄し、離脱時は証拠一覧を消去。読み込み中と未対応0件を区別し、同期ガードで連打を抑止する。
- 対応の応答紛失時は一覧を取り直し、成功とは断定しない。成功時はstreetChangesを通知して関連画面の再取得へ接続。サーバーのMFA/運営資格/証拠保存・削除期限は変更していない。
- moderation-state.test.mjsの3ケース（離脱後の証拠復活防止、重複操作と古い一覧、応答紛失後の再取得）成功。型チェックの初回で抽出時の残コードを検出・修正後、typecheck/Lint成功。既存DB通報フローの呼び出し契約を照合し、変更していないDB試験は再実行しない。
- 実機での通報→運営対応は未確認。JS変更を含むため、次のまとめたRelease生成で取り込む。現存Release成果物は70ac9d6基点で、この修正を含まない。今回はビルド・転送・pushなし。
- 全体5/33（15.2%）、実装到達7/33（21.2%）。DONE5/IMPLEMENTED2/IN_PROGRESS23/TODO0/BLOCKED3、増分0。次は運営・利用者間の操作統合とRelease実機確認。外部NFC/Push/クラウドの保留を維持。

## 実装チェックポイント41：運営の現在状態と未公開画像の期限
- T024/T025/R15/R18：030でMFA運営の参加者一覧に有効な投稿制限の終了日時と退会状態を追加。members画面へ接続し、制限の有無を表示、退会済みへの操作を無効化。連打を同期ガードし、応答不明時も一覧を再取得。利用者側は既存account_accessの前面/10秒更新を再利用。一般利用者への運営情報公開は増やさない。
- T004/T030/R17：ユーザーが未公開画像の準備開始24時間期限を承認。031で期限切れ準備の再利用・読取・書込・公開を拒否。清掃claimは期限切れ未公開画像をロックして取り下げ、既存Storage削除→finishへ接続。公開済み画像と登録完了は維持。ローカル030/031適用済み。
- icon-expiry.test.mjs、street-icon-pool.test.mjs、member-operations.test.mjs成功。運営試験の旧invite_create直呼びは現在の承認済みcommand_prepare/executeへ更新。制限状態の反映、投稿拒否/解除、利用停止で主催イベント中止/滞在終了、解除で復活なしを確認。
- street-icon-smoke.mjsで実JPEGアップロード→25時間前の未公開準備fixture→会員読取拒否→maintenance-worker --once→Storageオブジェクト/DB行削除を確認。試験画像/アカウントは清掃。時刻を変更したfixtureによる確認であり24時間の実待機試験ではない。typecheck/Lint成功。
- 状態件数・完了数は維持：DONE5/IMPLEMENTED2/IN_PROGRESS23/TODO0/BLOCKED3、5/33=15.2%、実装到達7/33=21.2%。未完は実機UI統合と運用時のworker稼働確認。既存Releaseに今回JSは未収録、次のまとめたビルドで反映。ビルド/転送/pushなし。次：全画面の操作統合、実機Release確認。

## 実装チェックポイント42：アカウント変更の復帰導線
- T005/R03/R17：useEmailChangeの初回読込/失敗/再読込をaccount画面へ接続。読込前・通信中の操作を無効にし、メール変更送信/確認の連打を同期ガード。応答紛失時はaccountDetailsを再取得して変更中のメールへの確認導線を復元し、成功と断定しない。離脱後の古い応答を破棄しOTP入力を消去する。
- useWithdrawalの確認コード送信/確定にも共通の同期ガードを追加、実行中はコード入力を固定。認証・退会API・削除要件は変更していない。
- email-change-state.test.mjsの3件成功（送信応答紛失の変更先復元、連打/離脱、読込失敗から復帰）。typecheck/Lint成功。既存Auth/DB契約は未変更のためaccount-smokeの再実行は省略。実メール2通確認/退会のネイティブUI操作は未確認。
- 全体5/33=15.2%、実装到達7/33=21.2%。DONE5/IMPLEMENTED2/IN_PROGRESS23/TODO0/BLOCKED3維持。今回完了増分0。ネイティブビルド/転送/pushなし。再開地点：全画面操作の統合と次のまとめたRelease実機確認。

## 実装チェックポイント43：JS内蔵Releaseでの画面統合
- T006/T031/T032/R03/R19：iPhoneのpaired表示を再照会したがdevice infoは接続不可/unavailable。実機転送は未実施。シミュレータiPhone17（6410E701-1891-45E2-B35D-CB42F5891EF8）へ現在ソース4389f25基点のReleaseをまとめて生成・インストール。
- 初回CODE_SIGNING_ALLOWED=NOの成果物は起動したがOTP後にKeychain保存エラー。手動entitlements署名はcodesign検証成功でもlaunchd spawn163で起動不可。既存DerivedDataを再利用しCODE_SIGNING_ALLOWED=YES/CODE_SIGN_IDENTITY=-のXcode標準シミュレータ署名で再リンク・ビルド成功。その版でOTP保存/再起動が成功。製品の認証処理は弱めていない。
- 成果物 /tmp/yumegaoka-validation-release/Build/Products/Release-iphonesimulator/app.app（JS内蔵）。標準署名ビルドログ /tmp/yumegaoka-validation-simulator-signing.log。実機用Releaseは引き続き70ac9d6基点で別成果物、今回JS修正を含まない。
- prepare-ui-test.mjs --registered-fixtureでローカル専用アカウントを実Auth/API/Storageにより名前・pool画像登録済みに準備。初回のAuth直接応答形式を修正後成功。初回登録/ネイティブ写真選択の証拠にはしない。製品の登録必須条件は維持。
- testRegisteredNavigation成功（80.432秒）：実OTPログイン→Mapトグル表示→再起動→Home→オフ会作成シート→Map地点選択→タイトル維持→設定のプロフィール/街アイコン/アカウント管理/招待/通知/ブロック/運営→Map復帰。結果 /tmp/yumegaoka-release-navigation-signed.xcresult、ログ同名.log。Map画像 /tmp/yumegaoka-release-map.pngで地図・ヘッダー・トグル・現在地/追加・チャット・タブを確認。
- 未確認：イベント等の作成確定と他利用者同期、全運営操作、写真選択、実機背景動作。画面表示だけで機能DONEにしない。次は同じシミュレータReleaseでイベント作成/参加・チャット送信を通す。本体の再ビルドは関連変更がない限り不要。
- 分母33、DONE5/IMPLEMENTED2/IN_PROGRESS23/TODO0/BLOCKED3維持。完了5/33=15.2%、実装到達7/33=21.2%、完了増分0。今回本体コード変更なし、UIテストと準備スクリプト更新。pushなし。

## 実装チェックポイント44：イベント・チャットのRelease実操作
- T015/T016/T017/T020/T022/T031/R13/R14/R15/R19：前回と同じJS内蔵Releaseを再利用、本体再ビルドなし。UI runnerへ実操作2ケースを追加。
- 初回はチャット行/イベントカードを個別StaticTextで検索して失敗。DB保存と画面を照合するとチャット本文・イベント作成/参加は成立していた。Pressableのまとまったアクセシビリティ要素へ検索を修正。製品コード変更なし。
- 初回テスト終了後、XcodeがcollectSimulatorDiagnosticsのsemaphore待ちで終了しなかったため、終了済みケースのログを保持してSIGINT→SIGTERMで当該プロセスだけ終了（exit143）。再実行は-collect-test-diagnostics neverでsysdiagnoseのみ省略。結果/画面添付は残す。
- testChatSendReloadDelete成功20.051秒：未入街で投稿→再起動後表示→長押し本人削除→削除跡。DBで最新投稿のbody=null/deleted_atありを確認。
- testEventCreateJoinCancel成功38.129秒：日時/題名/Map地点から作成→参加→Homeで表示→詳細から取消→主催者中止。DBで試験イベントUI event 1793336001のcanceled=true/有効参加0件を確認。初回失敗試験のUI event 1793335696は参加1件の試験データとして残り、次の操作確認で整理する。一般利用者データは変更していない。
- 結果 /tmp/yumegaoka-release-actions-query.xcresult、ログ同名.log。入力境界、一般参加者の複数端末UI、編集/名簿/通知、実機はこの試験の範囲外。成功済みの関連DB競合/名簿権限試験はコード確認で再利用、無関係な再実行はしない。
- T016をIN_PROGRESS→IMPLEMENTED。ローカルUI接続が揃った証拠を追加したが依存T015全条件・実機統合をDONEと誤認しない。DONE5/IMPLEMENTED3/IN_PROGRESS22/TODO0/BLOCKED3。完了5/33=15.2%、実装到達8/33=24.2%、完了増分0。次：同じReleaseで主催編集/名簿/通知とチャット拡大・他利用者反映。pushなし。

## 実装チェックポイント45：主催編集・名簿・重要通知
- T017/T018/T031/R13/R14/R17/R19：既存Release（本体再ビルドなし）でtestHostEditRosterNotifications成功49.750秒。前回残ったUI event 1793335696を利用し、参加者一覧→終了日時編集→変更通知→通知から詳細→中止→中止通知既読→再起動後既読保持を確認。
- DB照合：対象イベントrevision=3/canceled=true、通知kind=canceled/read=true。未処理だった前回試験イベントを中止して整理できた。Pushはこの試験に含めない。
- 日時置換の初回試験はフィールド途中のカーソルで末尾文字が残り、保存前の値assertで停止。疑似右矢印では解決せず、最初の長押しはフォーカスのみ。フォーカス後の長押し→標準全選択→置換で成功。製品の値検査を弱めていない。失敗runnerはすべて終了済み、sysdiagnose省略で余分な待機を避けた。
- 結果 /tmp/yumegaoka-release-host-focused.xcresult、ログ同名.log。scripts/prepare-ui-test.mjs --host-eventで実Auth/API経由の専用UI host workflowイベント作成/参加を再現可能に追加し、準備成功。テストの固定過去タイトルをこの専用名へ変更。成功したUIケースの再実行はタイトルだけの差分なので省略。新fixtureは次の試験用に保持。
- T017 IN_PROGRESS→IMPLEMENTED。DONE5/IMPLEMENTED4/IN_PROGRESS21/TODO0/BLOCKED3、完了5/33=15.2%、実装到達9/33=27.3%。完了増分0。一般参加者側の複数端末UI、全通知削除/再試行、定員境界、実機は今回の保証外。次：募集/チャット拡大/他利用者への同期、全タスク完了条件の残り照合。pushなし。

## 実装チェックポイント46：チャットのキーボード修正と募集の通し操作
- T014/T020/T031/R06/R12/R15/R19：StreetChatの拡大中に入力すると「地図へ」が画面外（y=-30）へ出る不具合を実操作で再現。flexShrinkのみ、KeyboardAvoidingViewのheight指定のみでは解消せず。利用可能な高さをonLayoutで測定し、SafeArea余白を除いた上限内へパネルを収めて修正。型チェック/Lint成功。
- 修正後のJS内蔵シミュレータReleaseでtestRecruitmentAndChatExpansion成功39.682秒。拡大→入力→縮小で下書き保持、現在地確認→募集作成→題名編集→終了→Homeから消える→退出。DBのUI recruitment 1793337467 editedはrevision=3、募集/滞在とも終了済み。
- 結果 /tmp/yumegaoka-recruitment-flow.xcresult、ログ同名.log。キーボード画像 /tmp/yumegaoka-chat-measured-images/9E7CFD7A-B86E-4D9C-A069-306F7D75C8FC.pngを目視し、戻る操作と入力が表示領域内にあることを確認。
- expo-blurの部分強度アニメーションでXCTestのidle待ちが終わらないため、当該テストだけライブラリ内蔵のDetox判定引数でアニメーションを止めた。操作試験は強いblurであり、通常intensity45の外観/操作保証とは分ける。製品のblur設定は変更していない。
- シミュレータ本体再ビルドは再現不具合の修正に限定。完了シートを閉じ忘れた試験はrunnerのみ修正し本体再ビルドなし。実機用成果物は旧版のまま、実機転送/実機検証は未実施。pushなし。
- T014 IN_PROGRESS→IMPLEMENTED。DONE5/IMPLEMENTED5/IN_PROGRESS20/TODO0/BLOCKED3。完了5/33=15.2%、実装到達10/33=30.3%、DONE増分0。次：他利用者との同期、通報/運営の画面統合とタスク完了条件の照合。未公開pool24時間期限はチェックポイント41で実装・検証済み。

## 実装チェックポイント47：別利用者の通報・ブロックから運営対応まで
- T022/T023/T024/T031/R15/R17/R18：prepare-ui-test --peer-messageで専用の別利用者を実Auth/API/Storage経由で準備し、実APIでチャットを投稿。製品ソースと本体Releaseは変更せず再利用。
- testPeerReportBlockUnblock成功27.297秒。別利用者の投稿表示→通報受付→ブロックで消える→Settings一覧→解除→Map再表示。DBに未対応通報1件・解除後のブロック0件を確認。リアルタイムの到達時間や2台のiPhone同時操作を保証する試験ではない。
- testOperatorResolvePeerReport成功32.090秒。専用アカウントの一時的な運営資格＋新規TOTP登録/追加認証→通報証拠→元投稿削除→対応完了。DB resolved=true/resolution=handled、元本文null/deleted=true、証拠本文保持。終了後に専用アカウントの運営資格を解除。初回runnerのcount取得コンパイルエラーはQueryへ修正し再実行、製品コードのエラーではない。
- 結果 /tmp/yumegaoka-peer-moderation.xcresult と /tmp/yumegaoka-operator-report-query.xcresult（ログ同名）。node --checkとgit diff --check成功。本体の型/Lint・ネイティブビルドは変更なしで省略。実機転送/pushなし。
- T022/T023をIMPLEMENTEDへ。DONE5/IMPLEMENTED7/IN_PROGRESS18/TODO0/BLOCKED3、完了5/33=15.2%、実装到達12/33=36.4%、DONE増分0。募集/イベント通報、全取得経路のブロック、実機統合は未確認。MVP_TASKSとACCEPTANCEの該当する旧「未実装」表記を現在の証拠へ更新。
- 次：登録/画像選択と全タブ・運営導線の残る受入条件を照合。実NFC/実Push/クラウドは既存の保留。実機検証は接続可能になってから、最新JSをまとめたReleaseで実施する。

## 実装チェックポイント48：最新版ReleaseのiPhone転送・起動
- T031/T032/R03/R19：iPhone接続が回復。9f927fe基点の製品コード（チャット高さ修正を含む）をPersonal TeamのJS内蔵Releaseとしてまとめてビルド成功。codesign --verify --deep --strict成功。
- /tmp/yumegaoka-validation-release/Build/Products/Release-iphoneos/app.app をiPhoneへインストール成功、devicectl起動成功。ユーザーもログイン画面表示を確認。旧70ac9d6成果物から更新した。ログ /tmp/yumegaoka-release-checkpoint47-device.log、/tmp/yumegaoka-checkpoint47-install.log、/tmp/yumegaoka-checkpoint47-launch.log。
- 開発サーバーは不要。ローカルSupabaseへ通信するためMacと同一LANが必要。Macの現在IPと埋込設定172.30.100.165を照合済み。実NFC/Pushは対象外。
- 写真選択/保存、実機ログイン後の全機能操作はまだ未確認。ユーザーへローカル専用アカウントのOTP送信を案内し、コード入力画面への到達を確認中。起動成功だけでT032をDONEにしない。
- ACCEPTANCEの旧「未実装」を既存の実装・検証証拠に合わせて更新。状態件数維持：DONE5/IMPLEMENTED7/IN_PROGRESS18/TODO0/BLOCKED3、5/33=15.2%、実装到達12/33=36.4%。pushなし。

## 実装チェックポイント49：画像の切り抜きと自動圧縮
- T004/T032/R03/R10/R16/R17：ユーザーがiPhoneでログイン成功を確認。写真保存は旧「2MB以内の画像と通信を確認」のエラーで失敗。実機保存は未完。ユーザー外出中の判断・手動確認は帰宅後へ回す。
- avatar.tsの元画像2MB超を変換前に拒否する処理を撤去。正方形の編集を有効化し、512px以内のデコード縮小→JPEG変換→必要なら品質0.85/0.65/0.4で圧縮→出力サイズ検査→Storage送信。本人画像と街poolで共通化。上限超の出力は送信しない。
- 変換・送信・保存確認のエラーを分離。画像/contextをfinallyで解放し、キャッシュ削除失敗で保存成功を失敗表示にしない。今回の実機エラーが容量超過だったかは未確定。
- avatar-conversion.test.mjsの4件成功：大きな元画像の変換到達、容量超出力の再圧縮/非送信、キャンセル/デコード失敗、送信失敗の識別。ネイティブ画像処理はstubで、実JPEG/切り抜き位置/EXIFを検証したものではない。typecheck/Lint成功。
- Expo58公式資料と導入済み型を確認：https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/ 、https://docs.expo.dev/versions/v58.0.0/sdk/imagemanipulator/ 。標準編集の実写真結果は帰宅後に確認する。
- インストール済みReleaseは9f927fe基点で今回の画像修正を含まない。次のまとめたReleaseへ収録。サーバー変更なし、既存Storage/DB試験は再実行せず。pushなし。
- DONE5/IMPLEMENTED7/IN_PROGRESS18/TODO0/BLOCKED3、完了5/33=15.2%、実装到達12/33=36.4%を維持。次：残る画面統合とUI/コピー整理、帰宅後は最新版で画像保存を再確認。

## 実装チェックポイント50：招待の発行・停止・同時受領
- T003/T029/R03/R16：停止した招待の共有ボタンが残る問題を修正。発行結果をIDとコードで保持し、停止成功時に消去。一覧再取得で使用済み/停止済みになった場合も消去。停止応答不明時は一覧を再取得する。
- invitation-concurrency.test.mjs成功。別DB接続の2要求が同じ招待行ロックを実際に待ったことを確認後に解放し、受領成功1人・拒否1人・新規会員1人を確認。発行5件成功、6件目拒否。独立fixtureは清掃済み。
- testInviteIssueRevoke成功13.451秒：Release画面で発行→コード共有導線→停止→共有導線消去/停止状態。実DB最新fixtureは7日期限・未使用・停止済み。初回試験は非同期一覧の停止件数比較が不適切で失敗し、状態表示＋DB照合へ修正。本体再ビルドの反復なし。
- 画像修正と今回の招待修正をまとめたシミュレータRelease生成成功。/tmp/yumegaoka-image-invite-build.log。UI結果 /tmp/yumegaoka-invite-release-status.xcresult と同名.log。typecheck/Lint、git diff --check成功。実機再転送・画像の再確認は帰宅後。pushなし。
- T003をIMPLEMENTEDへ。DONE5/IMPLEMENTED8/IN_PROGRESS17/TODO0/BLOCKED3。完了5/33=15.2%、実装到達13/33=39.4%。現行pool登録を含む初回一巡を未検証のままDONEにはしない。次：残る画面統合とUI整理、帰宅後の実機写真確認。

## 実装チェックポイント51：イベントの標準日時選択
- T015/T017/R13/R19：EventDateFieldを作成・主催編集へ共通接続。開始/終了行→iPhone標準スピナー→決定、キャンセルは元入力維持。書式説明と生の日時テキスト入力を除去。値は端末時刻表示、確定時ISOへ変換。未確定送信/送信中と開催中の編集制限は維持。
- Expo58対応datetimepicker9.2.1をexpo installで追加。動的configへの自動追記だけ失敗したため、既存app.jsonのpluginsへ明示追加してprebuild/Pods成功。型/Lint初回はcallback内のDate.now判定を検出し、useCallback内で選択値を生成する形へ修正後成功。ReleaseのJSにも修正後のコードを確認。
- シミュレータReleaseビルド成功 /tmp/yumegaoka-datetime-release.log。実機転送はせず、帰宅後のまとめた版へ含める。
- testEventCreateJoinCancel成功49.818秒。標準日時選択のキャンセルで未設定維持、分の変更、開始/終了決定→Map地点→作成→参加/取消/中止。初回runnerは選択肢00〜59に対して読み上げ値のminutes付き文字列を渡して失敗、選択肢へ修正。本体再ビルドなし。結果 /tmp/yumegaoka-event-datetime-wheel.xcresult。
- testHostEditRosterNotifications成功463.872秒。終了日時変更→保存→変更通知→中止→中止通知/既読復元。35.28秒から452.18秒の空白はMacの15:05:02〜15:12:00の418秒スリープと一致。性能測定値として使わない。結果 /tmp/yumegaoka-host-datetime.xcresult。実機での日時選択は未確認。
- 依存追加時のnpm auditでhigh3件を確認。根は既存Expo CLI経由のzod3.25.76、GHSA-mrhx-c7xc-m3w5。datetimepicker自体の指摘ではない。CLIはzod ^3.25.76を要求し、提示されたExpo51への自動downgradeやZod4強制置換は行わない。不要なこの作業のMetro PID67248を所属確認後に停止。ReleaseはMetro不要、アプリソース/生成JSにZodError等は見つからないが、依存の警告解消・公開前の再評価はT033へ残す。根拠：https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 。ローカルSupabaseは維持。
- T015をIMPLEMENTEDへ。DONE5/IMPLEMENTED9/IN_PROGRESS16/TODO0/BLOCKED3、完了5/33=15.2%、実装到達14/33=42.4%。次：残る入力不備/通信失敗の画面接続、UI整理。帰宅後の画像保存/実機操作確認は保留。pushなし。

### チェックポイント52：イベント入力の事前検査
T015/T017、R13/R19。作成・編集で日時順序・24時間上限・定員1〜100の整数を共通検査し、作成要求を固定する前に入力へ戻す。event-input.test.mjs 2件、typecheck/Lint成功。サーバー時計と状態による検査は維持。入力エラー後の実画面再送は未確認。ネイティブビルド・実機転送は今回省略。

### チェックポイント53：運営の日時選択
T024/T025、R16/R18/R19。membersからMemberRowを分離し、投稿制限の終了をEventDateFieldで選択するよう接続。API・サーバー検査は変更なし。typecheck/Lintと差分検査成功。運営画面での制限操作を伴う実機検証は未実施。

### チェックポイント54：運営招待の全件取得
T024/T025、R03/R16/R18。useOperatorDashboardへ分離、複合カーソルと続き取得を接続。migration032ローカル適用済み。operator-access.test.mjsで同時刻105件のページ越境を重複/欠落なし確認、既存MFA/資格失効拒否も成功。operator-dashboard-state.test.mjsの3件で離脱後一覧/MFAキー非復活、二重操作抑止、無効化応答紛失後の再取得を確認。typecheck/Lint成功。実画面ページングと実機は未確認。
