# MVP全体の実装監査（2026-10-30）

今回の範囲は文書・コード・呼出し関係・既存検証証拠の監査と計画作成。新機能実装、コード変更、DB変更、ビルド、実機転送、契約、公開は行っていない。全体の進捗基準は[MVP_TASKS](MVP_TASKS.md)。監査は侵入試験や全動作の再実行ではない。

> この文書は本体実装再開前の監査スナップショット。以降の実装・検証結果と現在の状態は [MVP_TASKS](MVP_TASKS.md) と [TECH_VALIDATION](TECH_VALIDATION.md) を参照する。以下の未実装記載を現在の状態へそのまま適用しない。

## 結論

**中核の認証・滞在・気配処理は再利用できる。一方、MVP全体の利用者画面と運営機能の多くは未実装。** 現在のルートは`_layout.tsx`のStackと`index.tsx`のみで、3タブ構成ではない。実装された地図とアカウント用Modalを、仕様上のHome/Map/Settings一式の完成とは扱えない。

33タスク中5件DONE（15.2%）、1件IMPLEMENTED、4件IN_PROGRESS、20件TODO、3件BLOCKED。実装到達率は6/33（18.2%）。既存の狭い責務ごとの完了判定であり、工数割合ではない。今回の実装完了の増分は0件。

## 確認した呼出し関係

```text
index.tsx.login
  → PresenceNative.verifyOTP → APIClient → Supabase Auth → Keychain
  → signed → resume / snapshot（membershipはDBで別検査）

scan / enterFixture
  → native.checkin → PresenceEngine（位置権限・時計）
  → VisitLifecycle（開始試行を保存）
  → street_api.prepare_checkin / commit_checkin
  → membersロック → visits / arrival_logs

Core Location callback
  → PresenceEngine.observe → 最新範囲・時計・精度・区画・頻度検査
  → VisitLifecycle.nextSequence（保存）→ observe_visit
  → presenceの同一visit行を置換 + visits期限延長

DB changed合図 → private Realtime → index.refresh
  → get_presence_snapshot → liveCells → MapLibre Marker
  （前面10秒再取得、1秒表示更新も存在）

トグルOFF → native.stop → 測位停止・OFF永続化
  → cancel_checkin / end_visit → presence削除・募集終了境界
  → 再接続時resumeで終了を優先
```

この経路には募集の作成、イベント、チャット送信、招待コード消費、運営登録を呼ぶ箇所がない。業務APIも滞在/公開集約のdispatcherに限定される。UIから将来の関数名が見えないだけでなく、対応するテーブル・RPC・ネイティブ公開窓口も照合した。

## コード・検証証拠の索引

| ID | 実際のコードと呼出し/確認範囲 | 判定の限界 |
| --- | --- | --- |
| E01 | [package.json](../package.json)、[app設定](../apps/mobile/app.config.ts)、[app.json](../apps/mobile/app.json)、[依存](../apps/mobile/package.json)、[setup-local](../scripts/setup-local.mjs)、4本の[migration](../supabase/migrations)、lockfile。既存の`/tmp/yumegaoka-otp-native.log`と`/tmp/yumegaoka-hardening-final-device.log`にBUILD SUCCEEDED | ローカル構成の根拠。本番クラウド/配布ではない |
| E02 | [index.login](../apps/mobile/src/app/index.tsx)、[APIClient](../apps/mobile/modules/presence-native/ios/APIClient.swift)のsendOTP/verifyOTP/token/logout、[module](../apps/mobile/modules/presence-native/ios/PresenceNativeModule.swift)、[OTP試験](../scripts/otp-smoke.mjs)、[UI試験](../tests/ios-ui/Smoke.swift) | 前回のOTP画面成功と再起動を採用。今回再実行なし。Keychainの安全性全体や本番メールを証明しない |
| E03 | [local-invite](../scripts/local-invite.mjs)はAuth userへmembersを追加/再有効化するローカルCLI。[core SQL](../supabase/migrations/202610290001_core.sql)のmembersはaccount_id/active/epochだけ | 招待コード・発行者関係・プロフィール・運営資格がない。CLIは製品招待/運営画面の代替完成品ではない |
| E04 | [全ルート](../apps/mobile/src/app)：_layoutとindexのみ。indexのsigned分岐・settings Modal・入街sheet・Map/Marker、[既存UI証拠](evidence/first-slice-presence.png)と[退出後](evidence/first-slice-after-exit.png) | Home/タブ、現在地/追加ボタン、チャット、ピン、プロフィール編集はない。地図背景はdemotiles固定、街素材は色付き星の仮素材 |
| E05 | [core SQL](../supabase/migrations/202610290001_core.sql)のprepare/commit/cancel/observe/end/visit_view、[HTTP境界](../supabase/migrations/202610290003_api_boundary.sql)。[DB試験](../tests/database.test.mjs)の17 subtestと[HTTP試験](../scripts/http-smoke.mjs)を実コードと照合 | DB試験はclaimsを設定したSQL試験で、署名検証は別のHTTP試験。過去の成功記録を採用し、今回は未実行。全設計ケース網羅ではない |
| E06 | [VisitLifecycle](../apps/mobile/modules/presence-native/ios/VisitLifecycle.swift)のcheckin/resume/stop/flushStop/observation、[PresenceEngine](../apps/mobile/modules/presence-native/ios/PresenceEngine.swift)、[ObservationCore](../apps/mobile/modules/presence-native/ios/ObservationCore.swift)。[状態試験](../tests/lifecycle/main.swift)、[HTTP障害試験](../tests/lifecycle-http/main.swift)、[計算試験](../tests/native/main.swift) | 12 assertionは製品coordinator＋偽通信、HTTP試験も通信断は注入。19 assertionは計算。実機OSや実回線断の成立とは別 |
| E07 | core SQLのget_presence_snapshot、[native.ts](../apps/mobile/src/lib/native.ts)の時計同期、[presence.ts](../apps/mobile/src/lib/presence.ts)のsplitCount/liveCells、[表示試験](../tests/presence.test.mjs) | 計算とAPIの再利用可。Map描画は前回画像確認。7人実画面/2端末同期/Figma完成度の証拠は未取得 |
| E08 | core SQLのarrival_logsとrecruitments、index全操作、全migrationを照合。events/registrations/messages/blocks/reports/notification_outboxは不在 | 入街ログは生成/清掃のみ。募集はid/visit_id/expires_at/ended_atのみ。どちらも利用者向け読取/投稿UIがなく、イベント等は新規実装 |
| E09 | [membership_stopped](../supabase/migrations/202610290004_membership.sql)はmember.activeを停止した際の連動。HTTP境界の4KiB、prepare10回/分、private Realtimeのread policyあり | 運営API/roles/audit、投稿制限、要件の全上限やアカウント3接続制限はない。private接続だけで既存接続失効完了ではない |
| E10 | index.scan/writeTestTagと[架空seed](../supabase/seed.sql)。Ndef Textにv/tag_idを読書き。tagsはid/street/revision/active、areasはpolygon/version | 固定の開発タグ書込で、運営の下書き/照合/設置/公開ではない。placements/provisioning/凸包公開RPCなし。ADPまで実NFC未確認 |
| E11 | [cleanup](../supabase/migrations/202610290002_cleanup.sql)：毎分cron、期限切れpresence、attempt、終了visit、arrivalを削除 | 募集清掃は親visit終了後24hが条件。将来20分終了の募集を長時間の滞在に属させると、募集自身の終了後24h要件を満たさない。募集実装時の修正必須。他の保存対象は未実装 |
| E12 | [TECH_VALIDATION](TECH_VALIDATION.md)、[UI試験手順](../tests/ios-ui/README.md)、[隔離試作](../experiments/presence-ios/README.md)。既存`/tmp/yumegaoka-ui-exit.log`の限定1件成功を確認 | 一連のUIは分割確認。現行Smoke.swift全体の単一実行成功とは言わない。試作歩行は本体実証ではない。/tmp証拠は永続保証なし |

成功件数は過去の結果であり、試験ソースが存在するだけで成功へ昇格させていない。過去ログのうちこのコードとの対応が不明なものは証拠に採用していない。秘密を含み得るOTPログは文書へコピーしない。

## 全画面・機能の未完成一覧

| 仕様の画面/機能 | 現状 | 再利用/修正/新規 | 対応タスク |
| --- | --- | --- | --- |
| 招待案内・コード受領・発行 | なし。メール入力だけ | 新規、Auth再利用 | T003/T025 |
| OTP | あり。再送戻り口・資格拒否あり | 再利用。本番/例外は後続 | T002/T005/T033 |
| 初回プロフィール・Settings | メールと接続先/ログアウトのModalだけ | 画面/画像処理/保存を新規 | T004/T005/T006 |
| Home・2つのピン一覧 | なし | 新規 | T013 |
| Map | 気配とチェックイン人数/トグルのみ | 残す。Figma構成・読める地図・ボタンを追加 | T007 |
| NFC説明/処理/成功 | 説明/処理中/取消あり、成功演出はない | 状態管理再利用、見た目/状態を補う | T012/T028 |
| 気配・背景共有 | コード/ローカル通信あり | 再利用、実機残確認 | T008〜T011/T032 |
| 募集作成/詳細/編集/終了 | なし | 終了連動の表だけ再利用 | T014 |
| オフ会作成・場所選択 | なし | 新規、Mapを共用 | T015 |
| オフ会詳細・参加取消 | なし | 新規 | T016 |
| 主催者編集/中止/名簿 | なし | 新規 | T017 |
| アプリ内通知・Push | なし | adapterを分離して新規 | T018/T019 |
| Mapチャット・拡大・履歴 | なし | 購読/認証の土台のみ共用 | T020 |
| 名前付き入街ログ | 非公開DB生成のみ | 取得/本人画像/チャット接続を追加 | T021 |
| 削除・ブロック管理 | なし | 新規 | T022 |
| 通報・運営対応・停止/解除 | 停止triggerのみ | guardと終了処理再利用、画面/API新規 | T023/T024 |
| 運営招待監督 | なし | 新規 | T025 |
| ステッカー登録/書込照合/設置 | 固定タグの開発ボタンのみ | 正規ワークフロー新規、NFC呼出し再利用 | T026/T028 |
| 範囲プレビュー・公開・移設/交換/撤去 | 固定seedと版検査のみ | 運営操作新規、版/境界計算再利用 | T027 |
| 全上限・保存/削除・本番運用 | 滞在用の一部のみ | 拡張が必要 | T029/T030/T033 |

画像9点はUI参照。画像にある未定義の第3一覧タブや人物画像を勝手に要件へ追加しない。ヘッダーの画像列の意味はQ05、詳細のない運営画面配置等はQ06/Q09で判断する。

## 監査で見つかった差分・リスク

1. **画面全体と中核処理の進捗が混同されていた。** UIルートは1つ。Map上の1人表示成功はHome/イベント/チャットの完成証拠にならない。タスクの完了条件を責務ごとに切り分けた。
2. **招待登録は運営CLIであり製品フローではない。** membersは認可に使われているが、友人招待/単回消費/枠監督はない。T003/T025。メールOTPだけで街へアクセスできない点は維持できている。
3. **募集表をそのまま完成品として拡張すると保存期限に穴ができる。** E11の清掃条件を募集自身の終了・20分期限・親失効の最も早い公開終了へ合わせる必要がある。T014/T030の完了条件に入れた。現段階で利用者の募集本文/座標を保存するAPIはないので、実利用データの漏えい発生と断定しない。
4. **運営認可と上限が未実装。** 停止triggerやprivate schemaは再利用できるが、任意のUIを追加するだけでは運営操作を公開できない。T029/T024はAPI接続前の前提。共通認可・同時処理は画面先行方針でも後回しにしない。
5. **本体の背景処理は実機確認待ち。** 距離フィルターなし・静止3分・BackgroundTask・NWPathMonitorは存在する。しかし歩行試作結果を流用してDONEにしない。T010/T032。全UI着手を止める理由にはしない。
6. **本番地図がない。** デモスタイルでは池袋の道路表示が未完成。座標付きMarkerの成功と区別。T007で既存Figmaの構造を維持し、タイル/素材の選定を扱う。
7. **過去に記録された依存警告は未解決。** IMPLEMENTATION_PROGRESS記載の間接依存警告は今回再スキャンしていない。深刻な露出が確認されたらT033より前へ引き上げる。今回、脆弱性なしと保証していない。
8. **試験の粒度を明確化する必要がある。** DB試験17 subtest、表示3件、Swift19/12 assertionと実HTTP試験は別層。UIの地図文字検索は失敗、描画を画像確認し後半のみ限定試験成功。全体UI単一実行成功へ読み替えない。

## docsの矛盾・未決定の切り分け

| 発見箇所 | 問題 | 今回の扱い |
| --- | --- | --- |
| MVP_REQUIREMENTS 1章、PROJECT_CONTEXT末尾、IPHONE_STACK冒頭 | 本体未着手/試作のみという古い工程 | 現在の監査完了・次回全体実装へ更新。公開許可は追加しない |
| MVP_PROPOSALS P08、NFC_OPERATIONS、TECH_STACK_PROPOSAL | Expo/NFCライブラリ未選定とK01採用/lockfileが混在 | 構成採用済みと実タグ未確認を分離 |
| DECISIONSの現在表、SCREEN_FLOW_REVIEW、DATA_MODEL_AND_STATES | 8人以上分割、入街ログ保持、イベント登録削除、除名、通知経路が未決定のまま | 後続のV/C/E/D合意への参照へ置換。新しい製品判断はしない |
| PRESENCE_AND_EVENTS、ARCHITECTURE_PROPOSAL | 実装は旧試作のみ、順序/更新元未選定という記述 | 製品実装と未確認を分離、FIRST_SLICE_CONTRACTへ統一 |
| OPEN_QUESTIONS Q02/Q03/Q04/Q06 | バージョン・観測/滞在API・ライブラリ等の実装済み詳細が判断待ち扱い | 実装済みを列から除外。未確認はTECH_VALIDATION、製品判断はQへ |
| ACCEPTANCE | R11/R15/R17/R19の全面未実装表現と部分コードが混在 | 部分実装を記載し、要件全体の合格にはしない |
| IMPLEMENTATION_PROGRESSの優先順 | 中核を更に固めてから全機能という旧順序 | MVP_TASKSを今後の基準に変更 |
| history/旧レビュー | QR・前面のみ・入口だけの気配・両OS等の旧案 | 履歴は改変せず現行要件に昇格しない |

未決定のまま残すもの：初期タブ/ヘッダー画像列/具体素材、地図提供元、アカウント復旧・退会、過去プロフィール反映、運営の強い認証・画面配置、停止時のイベント波及、定員・地点範囲・開催中日時編集、入街以外の有限受付期限、未対応通報/下書き/通知宛先の保存・再試行、クラウド/メール/Push/配布/バックアップ条件。具体的な判断時点と担当タスクはMVP_TASKSに記載する。これらがあるため全実装不能とは扱わない。

## 検証の扱い

今回実施：コード/全migration/公開module/ルート/試験の静的照合、既存画面資料・確認画像、既存の限定UI成功ログとビルド結果の確認、文書のリンク・タスク集計・依存参照・コード非変更の確認。

省略：型/Lint/単体/DB結合/UIの再実行、ネイティブビルド、実機転送、依存の再スキャン。製品コードを変更しておらず、今回の目的が実装監査・計画であるため。過去試験結果と今回実行を区別する。

未確認：未実装全機能、実機ロック中の本体通信・物理回線断・複数画面の同期、実NFC/Push、全体負荷、本番配信/復元・保存サービス。新しいコード脆弱性の有無を実行検証で確定した監査ではない。

## 監査対象の文書一覧

監査開始時の現行26 Markdown、履歴14 Markdown、参考2 Markdown、UI9画像、実装証拠3画像を対象にした。現行は本文・状態・要件を照合、履歴は本文検索・見出しと後続決定を照合して廃案/経緯として分類した。履歴の「最新」を現行へ戻さない。実装の判定には現行仕様とコードを使用する。

### 現行

- [ACCEPTANCE.md](ACCEPTANCE.md)
- [ARCHITECTURE_PROPOSAL.md](ARCHITECTURE_PROPOSAL.md)
- [CHAT_MODERATION_DESIGN.md](CHAT_MODERATION_DESIGN.md)
- [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md)
- [DATA_MODEL_REVIEW.md](DATA_MODEL_REVIEW.md)
- [DECISIONS.md](DECISIONS.md)
- [DOC_AUDIT.md](DOC_AUDIT.md)
- [DOC_MAINTENANCE.md](DOC_MAINTENANCE.md)
- [FIRST_SLICE_CONTRACT.md](FIRST_SLICE_CONTRACT.md)
- [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md)
- [IPHONE_STACK.md](IPHONE_STACK.md)
- [MVP_PROPOSALS.md](MVP_PROPOSALS.md)
- [MVP_REQUIREMENTS.md](MVP_REQUIREMENTS.md)
- [MVP_REVIEW.md](MVP_REVIEW.md)
- [NFC_OPERATIONS.md](NFC_OPERATIONS.md)
- [OBSERVATION_RULES.md](OBSERVATION_RULES.md)
- [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
- [PINS_AND_EVENTS_DESIGN.md](PINS_AND_EVENTS_DESIGN.md)
- [PRESENCE_AND_EVENTS.md](PRESENCE_AND_EVENTS.md)
- [PRESENCE_DISPLAY.md](PRESENCE_DISPLAY.md)
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
- [README.md](README.md)
- [SCREEN_FLOW_REVIEW.md](SCREEN_FLOW_REVIEW.md)
- [TECH_STACK_PROPOSAL.md](TECH_STACK_PROPOSAL.md)
- [TECH_VALIDATION.md](TECH_VALIDATION.md)
- [VISIT_LIFECYCLE.md](VISIT_LIFECYCLE.md)

### 履歴

- [history/DECISIONS_BEFORE_2026-10-29_AUDIT.md](history/DECISIONS_BEFORE_2026-10-29_AUDIT.md)
- [history/MVP_PROPOSALS_BEFORE_2026-10-29_AUDIT.md](history/MVP_PROPOSALS_BEFORE_2026-10-29_AUDIT.md)
- [history/MVP_PROPOSALS_v0.1.md](history/MVP_PROPOSALS_v0.1.md)
- [history/MVP_REQUIREMENTS_BEFORE_2026-10-29_AUDIT.md](history/MVP_REQUIREMENTS_BEFORE_2026-10-29_AUDIT.md)
- [history/MVP_REQUIREMENTS_BEFORE_CONSOLIDATION.md](history/MVP_REQUIREMENTS_BEFORE_CONSOLIDATION.md)
- [history/MVP_REQUIREMENTS_v0.1.md](history/MVP_REQUIREMENTS_v0.1.md)
- [history/MVP_REVIEW_BEFORE_2026-10-29_AUDIT.md](history/MVP_REVIEW_BEFORE_2026-10-29_AUDIT.md)
- [history/OPEN_QUESTIONS_BEFORE_2026-10-29_AUDIT.md](history/OPEN_QUESTIONS_BEFORE_2026-10-29_AUDIT.md)
- [history/OPEN_QUESTIONS_BEFORE_V0.1.md](history/OPEN_QUESTIONS_BEFORE_V0.1.md)
- [history/PRESENCE_AND_EVENTS_BEFORE_2026-10-29_AUDIT.md](history/PRESENCE_AND_EVENTS_BEFORE_2026-10-29_AUDIT.md)
- [history/PROJECT_CONTEXT_BEFORE_2026-10-29_AUDIT.md](history/PROJECT_CONTEXT_BEFORE_2026-10-29_AUDIT.md)
- [history/README.md](history/README.md)
- [history/SCREEN_FLOW_REVIEW_BEFORE_2026-10-29_AUDIT.md](history/SCREEN_FLOW_REVIEW_BEFORE_2026-10-29_AUDIT.md)
- [history/TECH_VALIDATION_BEFORE_2026-10-29_AUDIT.md](history/TECH_VALIDATION_BEFORE_2026-10-29_AUDIT.md)

### 参考

- [reference/PROJECT_DEFINITION_v0.1.md](reference/PROJECT_DEFINITION_v0.1.md)
- [reference/README.md](reference/README.md)

### UI・実装画面

- [reference/ui/iphone-17-76.png](reference/ui/iphone-17-76.png)
- [reference/ui/iphone-17-77.png](reference/ui/iphone-17-77.png)
- [reference/ui/iphone-17-78.png](reference/ui/iphone-17-78.png)
- [reference/ui/iphone-17-79.png](reference/ui/iphone-17-79.png)
- [reference/ui/iphone-17-81.png](reference/ui/iphone-17-81.png)
- [reference/ui/iphone-17-82.png](reference/ui/iphone-17-82.png)
- [reference/ui/iphone-17-83.png](reference/ui/iphone-17-83.png)
- [reference/ui/iphone-17-84.png](reference/ui/iphone-17-84.png)
- [reference/ui/map-toggle-correction.png](reference/ui/map-toggle-correction.png)
- [evidence/first-slice-after-exit.png](evidence/first-slice-after-exit.png)
- [evidence/first-slice-login.png](evidence/first-slice-login.png)
- [evidence/first-slice-presence.png](evidence/first-slice-presence.png)
