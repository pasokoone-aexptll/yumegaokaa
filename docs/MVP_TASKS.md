# MVP全体の実装タスクと進捗

更新：2026-10-30。初回の全体監査を基準にする。仕様は[MVP_REQUIREMENTS](MVP_REQUIREMENTS.md)、画面は[SCREEN_FLOW_REVIEW](SCREEN_FLOW_REVIEW.md)とFigma、監査根拠は[MVP_IMPLEMENTATION_AUDIT](MVP_IMPLEMENTATION_AUDIT.md)。過去の最初の一本の進捗をMVP全体の完成率として扱わない。

## 完成定義と今回の境界

最優先の節目は、既存仕様の全画面・全機能を一度操作できる状態。Home/Map/Settings、登録・募集・イベント・チャット・運営の全導線を揃え、実ローカルDB/APIと接続する。投稿なしで街の気配が見え、OFFで共有を止められることを維持する。3D・DM・フレンド・決済・待機列・承認制・当日受付・Android移植は今回の分母に加えない。

- **画面が一巡する節目**：T006と各機能の画面部分。開発専用モックを明示して先行できるが、機能タスク全体はDONEにならない。
- **ローカルで全機能が一巡する節目**：T031。外部の実NFCとPushだけを分離adapterで代用できる。Auth/DB/API/権限/保存は実ローカル処理。運営画面のfake書込を実タグ成功とは扱わない。
- **MVP全体の完成**：全33タスクDONE。実機・実NFC・実Push・公開準備も含む。代用でT031がDONEになってもT019/T028/T033をDONEにしない。公開・購入は別途承認。
- 文化の成立はソフトウェアのタスク完了率で証明しない。R01はT031/T032で体験を確認し、架空人数や投稿の強制で補わない。

**2026-10-30の追加依頼で全MVPの自律実装を再開。外部依存は分離し、全画面・実DB接続・統合確認まで進める。**

## 現在の進捗

**全体：5 / 33 タスク完了（15.2%）**

| 状態 | 件数 | 定義 |
| --- | ---: | --- |
| DONE | 5 | 下記の限定された完了条件を満たし、既存の必要な検証証拠あり |
| IMPLEMENTED | 2 | コードあり、完了条件の確認が不足 |
| IN_PROGRESS | 21 | 一部コードと検証あり。残る実装・接続を継続中 |
| TODO | 2 | 当該機能の実装未着手。先行タスク未完だけではBLOCKEDにしない |
| BLOCKED | 3 | 実NFC/実Push/公開環境という外部依存で完了まで進めない |

**実装到達率：(DONE + IMPLEMENTED) / 全タスク = 7 / 33（21.2%）**。IN_PROGRESSの割合は推測加算しない。残りは28タスク。件数は工数・日数の割合ではない。基盤、UI、イベント、公開準備で粒度が異なり「残り84.8%の時間」と解釈しない。納期はまだ推定しない。

現在のフェーズ：**MVP全体の本体実装・統合中。Home/Map/Settings、募集・イベント・チャット・通報・運営を実ローカルDBへ接続し、残るアカウント・画像・ステッカー・配信処理を順次つなぐ段階。**

## タスク一覧

P0=再利用する土台/次の着手、P1=全画面と主要機能、P2=統合・保存・実機、P3=外部準備後。セキュリティ・整合性の前提は画面先行でもAPI接続前に実装する。依存は原則「DONEにするまでに必要」であり、UIのモック先行着手を妨げない。タスクID T001〜は、従来の試験ケースT01〜T16と別名前空間。

| ID | 機能・目的 | 状態 | 優先 | 依存タスク |
| --- | --- | --- | --- | --- |
| T001 | ローカル開発基盤 | DONE | P0 | なし |
| T002 | 基本OTPログイン・再ログイン | DONE | P0 | T001 |
| T003 | 招待発行・受領・初回登録 | IN_PROGRESS | P1 | T002/T029 |
| T004 | 名前・本人アイコン設定 | IN_PROGRESS | P1 | T002/T006 |
| T005 | アカウント例外・復旧・退会 | IN_PROGRESS | P2 | T002/T004/T030 |
| T006 | 3タブ・画面遷移の骨格 | IN_PROGRESS | P0 | T001 |
| T007 | Map画面・背景地図・現在地 | IN_PROGRESS | P1 | T006/T011 |
| T008 | 入街・更新・終了DB/API | DONE | P0 | T001 |
| T009 | 滞在の永続状態・退出優先 | DONE | P0 | T008 |
| T010 | 背景観測・静止更新の接続 | IMPLEMENTED | P2 | T008/T009 |
| T011 | 公開集約・気配の分割/失効計算 | DONE | P0 | T008 |
| T012 | 入街・退出シートと権限案内 | IN_PROGRESS | P1 | T006/T009 |
| T013 | Homeの参加予定・募集一覧 | IN_PROGRESS | P1 | T006/T014/T016 |
| T014 | 募集ピン一式 | IN_PROGRESS | P1 | T006/T008/T029 |
| T015 | イベント作成・地点選択 | IN_PROGRESS | P1 | T006/T029 |
| T016 | イベント詳細・参加/取消 | IN_PROGRESS | P1 | T015 |
| T017 | 主催者編集・中止・参加者一覧 | IN_PROGRESS | P1 | T016 |
| T018 | アプリ内重要通知・配信待ち管理 | IN_PROGRESS | P1 | T016/T017/T029 |
| T019 | 実プッシュ配信 | BLOCKED | P3 | T018 |
| T020 | チャット送受信・履歴・拡大UI | IN_PROGRESS | P1 | T004/T006/T029 |
| T021 | 名前付き入街ログのチャット接続 | IN_PROGRESS | P1 | T004/T008/T020 |
| T022 | 投稿削除・ブロック | IN_PROGRESS | P1 | T014/T020 |
| T023 | 通報受付・証拠管理 | IN_PROGRESS | P1 | T014/T015/T020/T029 |
| T024 | 運営認証・通報対応・制限/解除 | IN_PROGRESS | P1 | T023/T029 |
| T025 | 運営の招待監督 | IN_PROGRESS | P2 | T003/T024 |
| T026 | ステッカー準備・登録ワークフロー | IN_PROGRESS | P1 | T006/T024/T029 |
| T027 | 街範囲公開・移設/交換/撤去 | IMPLEMENTED | P1 | T026/T008 |
| T028 | 実NFC読取・書込・照合の接続 | BLOCKED | P3 | T012/T026/T027 |
| T029 | 共通コマンド・上限・認可境界 | IN_PROGRESS | P1 | T001 |
| T030 | 全データの期限清掃・ログ保護 | IN_PROGRESS | P2 | T003/T004/T014/T018/T020/T023/T026 |
| T031 | 全画面・主要フローのローカル統合 | TODO | P2 | T003/T004/T005/T007/T012/T013/T014/T015/T016/T017/T018/T020/T021/T022/T023/T024/T025/T026/T027/T029/T030 |
| T032 | 本体iPhone・複数閲覧・性能確認 | TODO | P2 | T010/T031 |
| T033 | クラウド・配布・公開準備 | BLOCKED | P3 | T019/T028/T030/T032 |

## タスク別の完了条件と根拠

証拠E番号は監査書のコード/テスト一覧へ対応する。未実装のタスクは「根拠なし」とする代わりに、不在を確認した範囲と再利用点を示す。検証方法は将来の完了判定であり、今回実行した意味ではない。

### T001 ローカル開発基盤

- **状態・優先・要件**：DONE / P0 / R02/R22。依存：なし。
- **実装対象**：Expo設定・lockfile・ローカルSupabase。
- **完了条件**：固定依存で起動し、ローカルAuth/DBへ接続できる。公開環境は含めない。
- **検証方法**：既存ビルド・HTTP記録、設定照合。
- **監査根拠・再利用判断**：E01。既存を再利用。

### T002 基本OTPログイン・再ログイン

- **状態・優先・要件**：DONE / P0 / R03。依存：T001。
- **実装対象**：ログイン画面・APIClient・Keychain。
- **完了条件**：ローカルメールのOTPで既存会員がログインし、再起動で認証を維持。未会員の街取得を拒否。招待発行・復旧例外・本番メールは別タスク。
- **検証方法**：既存OTP/HTTP、UI分割確認、未会員403。
- **監査根拠・再利用判断**：E02。入力・再送導線は存在。認証基盤を作り直さない。

### T003 招待発行・受領・初回登録

- **状態・優先・要件**：IN_PROGRESS / P1 / R03/R16。依存：T002/T029。
- **実装対象**：招待リンク画面・招待テーブル・消費API。
- **完了条件**：参加者が7日・単回コードを発行し、認証後に一度だけ消費して会員化。7日5件上限、期限切れ・再利用・同時消費を拒否。
- **検証方法**：ローカル2利用者で発行→受領→登録、DB同時消費。
- **実装・検証根拠**：招待RPC/画面、tests/invitations.test.mjs、testInvitationOnboarding（実OTP→招待受領→プロフィール→Mapと再起動、54.691秒成功）。発行応答消失時の共通受付接続と同時消費の確認が残る。

### T004 名前・本人アイコン設定

- **状態・優先・要件**：IN_PROGRESS / P1 / R03/R10/R16。依存：T002/T006。
- **実装対象**：初回プロフィール・Settings・profiles・Storage処理。
- **完了条件**：名前と本人画像を保存・再表示。2MB制限、縮小・再エンコード・メタデータ除去、所有者以外の更新拒否。過去投稿表示はQ09決定に従う。
- **検証方法**：画像処理の入力/出力確認、別アカウント更新拒否、設定往復。
- **実装・検証根拠**：profiles/非公開Storage/useProfile、avatar-smoke.mjs、初回名前設定のtestInvitationOnboarding成功。写真選択の実操作・出力寸法/メタデータ実測は残る。

### T005 アカウント例外・復旧・退会

- **状態・優先・要件**：IN_PROGRESS / P2 / R03/R17。依存：T002/T004/T030。
- **実装対象**：Settings・認証/資格の管理API。
- **完了条件**：Q01/Q08で採用するメール変更・紛失・旧端末失効・退会を明示し、採用分の導線と削除を接続。未決定を独断で実装しない。
- **検証方法**：採用フローの再認証・他端末・削除後アクセス確認。
- **監査根拠・再利用判断**：E02/E03。通常ログアウトは再利用。例外方式は未決定。

### T006 3タブ・画面遷移の骨格

- **状態・優先・要件**：IN_PROGRESS / P0 / R19。依存：T001。
- **実装対象**：Expo Router Home/Map/Settings・共通シート・開発用adapter。
- **完了条件**：既存Figmaに沿う3タブと全機能への導線、戻る・シート往復が操作可能。ここだけは明示したモック可。機能別完了とは区別。
- **検証方法**：画面一覧との照合、シミュレータで全導線を一巡。
- **監査根拠・再利用判断**：E04。現在はStack+indexの単一画面。

### T007 Map画面・背景地図・現在地

- **状態・優先・要件**：IN_PROGRESS / P1 / R01/R10/R19。依存：T006/T011。
- **実装対象**：既存Map画面・Camera・単発測位窓口・街素材。
- **完了条件**：実際の街が読める地図、合意済みヘッダー・気配・ピン・現在地/追加ボタン。現在地移動だけで位置公開しない。Figmaと照合。タイル/素材はQ05/Q10で選ぶ。
- **検証方法**：表示画像、単発現在地で送信しない確認、未取得/0/通信断。
- **監査根拠・再利用判断**：E04/E07。Map/人数/気配は再利用。デモ背景・星素材・ボタン欠落は修正。

### T008 入街・更新・終了DB/API

- **状態・優先・要件**：DONE / P0 / R04/R05/R06/R07/R21。依存：T001。
- **実装対象**：core SQL・street_api・認可。
- **完了条件**：既存の最初の一本のDB契約：認可、開始/取消/reuse、writer交代、最新1件、期限、再送拒否、終了をローカルDBで確認。運営公開・募集作成は別。
- **検証方法**：既存DB17 subtestとHTTP、関連SQL静的照合。
- **監査根拠・再利用判断**：E05。実NFC接触・全MVP APIの完了は意味しない。

### T009 滞在の永続状態・退出優先

- **状態・優先・要件**：DONE / P0 / R04/R06/R07。依存：T008。
- **実装対象**：VisitLifecycle/VisitJournal。
- **完了条件**：製品状態管理で応答紛失後の同一滞在回復、採番永続化、通信断OFF、再生成時OFF優先、遅延応答拒否を確認。OS固有はT032。
- **検証方法**：既存Swift12 assertion＋実HTTP障害注入＋UI退出再起動。
- **監査根拠・再利用判断**：E06。端末状態管理を再利用。

### T010 背景観測・静止更新の接続

- **状態・優先・要件**：IMPLEMENTED / P2 / R05/R09/R21。依存：T008/T009。
- **実装対象**：PresenceEngine・ObservationCore。
- **完了条件**：時計/精度/100m/20m/街外30〜120秒、初回/移動30秒/静止3分を本体で動かす。ロック中の移動と静止で通信を記録、欠測は延命せず停止可能。
- **検証方法**：計算既存19 assertion＋T032の実機観測。時計・境界変更は対象試験。
- **監査根拠・再利用判断**：E06。本体コードあり、試作歩行成功を本体証拠にしない。

### T011 公開集約・気配の分割/失効計算

- **状態・優先・要件**：DONE / P0 / R07/R08/R10/R21。依存：T008。
- **実装対象**：snapshot RPC・presence.ts。
- **完了条件**：個人IDなしの区画人数/期限、6/7/8/11/12の分割、期限ごとのフェード・減算、1人更新で他人を延命しない。画面完成はT007。
- **検証方法**：既存DB/表示3件/HTTPの確認範囲を照合。
- **監査根拠・再利用判断**：E07。純計算と集約の完了。多端末実画面はT031/T032。

### T012 入街・退出シートと権限案内

- **状態・優先・要件**：IN_PROGRESS / P1 / R04/R06/R19。依存：T006/T009。
- **実装対象**：indexの入街シート・トグル・NFC入力adapter。
- **完了条件**：背景共有説明→読取待ち/登録中/成功/取消、権限拒否・別端末・通信不明・退出待ちを表示。Figmaの状態遷移を維持。NFC入力だけ代用可。
- **検証方法**：シミュレータで成功/取消/拒否/退出を操作、成功演出がDB確定後。
- **監査根拠・再利用判断**：E04/E06。説明・登録中・取消あり、Figmaの成功状態/演出等が未完成。

### T013 Homeの参加予定・募集一覧

- **状態・優先・要件**：IN_PROGRESS / P1 / R12/R13/R19。依存：T006/T014/T016。
- **実装対象**：Home・一覧取得・詳細への遷移。
- **完了条件**：参加予定/募集中一覧、詳細/Mapへ移動。終了/中止/取消を除外し、過去参加履歴を作らない。
- **検証方法**：ローカルDBの作成/参加/終了が一覧へ反映、空/失敗表示。
- **監査根拠・再利用判断**：E04。画面/APIなし。UIは先にモックで進め、DONEは実API接続後。

### T014 募集ピン一式

- **状態・優先・要件**：IN_PROGRESS / P1 / R06/R12/R16。依存：T006/T008/T029。
- **実装対象**：作成/詳細/編集/終了シート・Map・募集API/DB。
- **完了条件**：街内有効滞在で単発現在地を確認し同時1件。題名編集、20分/手動/退出終了、位置固定、再作成上限、旧要求で復活しない。
- **検証方法**：UI作成→編集→終了、二重作成/退出競合/期限/越権DB試験。
- **実装根拠・残作業**：007の作成/編集/終了API、usePinCreation/useRecruitmentDetail、Map/Homeへ接続。未確認送信復元・入力中の再取得/終了状態のhook検証あり。実機作成→編集→終了と退出競合の統合確認が残る。

### T015 イベント作成・地点選択

- **状態・優先・要件**：IN_PROGRESS / P1 / R13/R16/R19。依存：T006/T029。
- **実装対象**：作成シート・地点選択Map・events/API。
- **完了条件**：未入街でも題名/日時/地点/説明/定員を入力して作成。Map往復で下書き保持。90日/24時間/同時3件等を検査。定員等Q07を先に決定。
- **検証方法**：フォーム往復、入力境界、再送/所有権、作成ピン表示。
- **監査根拠・再利用判断**：E08。画面・テーブル・APIなし。

### T016 イベント詳細・参加/取消

- **状態・優先・要件**：IN_PROGRESS / P1 / R13/R14/R19。依存：T015。
- **実装対象**：詳細シート・registrations・参加API。
- **完了条件**：詳細から参加/取消しHomeへ反映。開催中の空席可、終了/中止不可。最後の席で超過せず古い参加で取消を復活させない。一般利用者には他人の名簿を返さない。
- **検証方法**：2利用者の最後の1席、逆順/応答紛失、名簿越権、UI反映。
- **実装根拠・残作業**：events/[id].tsx/useEventDetail.tsとevent_register APIを接続。event-flow.test.mjsのDB一巡、event-detail-state.test.mjsの状態逆順確認済み。街チェックインとは独立。最後の席/中止参加の並列競合はevent-concurrency.test.mjsで確認。実機UI反映は未確認。

### T017 主催者編集・中止・参加者一覧

- **状態・優先・要件**：IN_PROGRESS / P1 / R13/R14。依存：T016。
- **実装対象**：主催者画面・編集/中止/名簿API。
- **完了条件**：本人が編集/中止/名簿確認。定員を参加数未満にしない。終了/中止から再開不可。個別除名は作らず、一般利用者の直呼び拒否。
- **検証方法**：主催者/一般/運営で権限確認、編集競合、中止と参加競合。
- **実装根拠・残作業**：useEventEditor/useEventDetailとevent_edit/cancel/rosterを接続。event-flow.test.mjsで名簿越権・中止再送確認。中止と参加の並列競合はevent-concurrency.test.mjsで確認。実機での編集/名簿/中止は未確認。

### T018 アプリ内重要通知・配信待ち管理

- **状態・優先・要件**：IN_PROGRESS / P1 / R13/R14/R17。依存：T016/T017/T029。
- **実装対象**：通知一覧・outbox・配信adapter。
- **完了条件**：日時/場所変更と中止をアプリ内通知。Push拒否でも確認可能。変更とoutboxを原子的確定し、取消/削除後に宛先復活なし。外部Pushだけfake可。
- **検証方法**：DB変更→通知画面、重複/古い版/取消後再試行、24h削除。
- **監査根拠・再利用判断**：E08。通知UI/テーブル/送信コードなし。Q08の宛先・再試行を確定。

### T019 実プッシュ配信

- **状態・優先・要件**：BLOCKED / P3 / R13。依存：T018。
- **実装対象**：APNs資格・トークン登録・配信provider。
- **完了条件**：同意したiPhoneへ重要変更を配信、拒否/無効token/再送を処理、本文に名簿/正確地点を含めない。
- **検証方法**：ADPと配信環境準備後、実端末で受信/拒否/無効化。
- **監査根拠・再利用判断**：E08。実配信未実装。ADP/配信方式待ち。ローカル代用はT018で先行。

### T020 チャット送受信・履歴・拡大UI

- **状態・優先・要件**：IN_PROGRESS / P1 / R15/R16/R19。依存：T004/T006/T029。
- **実装対象**：Mapチャット・messages/API・購読/差分取得。
- **完了条件**：未入街でも本人名/画像で送受信、30日50件ページ。スクロール拡大/背景blur/入力保持、送信失敗再試行。50件超の切断差分も回復。
- **検証方法**：2クライアント送受信、履歴/再送/切断差分、キーボード/戻る操作。
- **監査根拠・再利用判断**：E04/E08。現在の底部説明カードはチャットではない。

### T021 名前付き入街ログのチャット接続

- **状態・優先・要件**：IN_PROGRESS / P1 / R04/R15/R17。依存：T004/T008/T020。
- **実装対象**：arrival_logs取得・プロフィール結合・チャット行。
- **完了条件**：新規滞在だけ1ログ、本人名/画像で30日表示、更新/reuseは追加しない。ブロック対象。非公開visitへの追跡APIは作らない。
- **検証方法**：既存生成試験＋新規取得/描画/30日期限確認。
- **監査根拠・再利用判断**：E05/E08。生成/清掃は存在、読取APIと画面はない。

### T022 投稿削除・ブロック

- **状態・優先・要件**：IN_PROGRESS / P1 / R15/R18。依存：T014/T020。
- **実装対象**：メニュー・ブロック一覧・削除/フィルターAPI。
- **完了条件**：本人/運営削除で本文消去・削除跡。ブロックでチャット/入街ログ/募集をサーバー取得から除外、解除可能。気配/人数/イベントは減らさない。
- **検証方法**：古い取得応答による復活、別経路取得、解除、越権拒否。
- **監査根拠・再利用判断**：E08。blocks・messages削除処理なし。

### T023 通報受付・証拠管理

- **状態・優先・要件**：IN_PROGRESS / P1 / R15/R17/R18。依存：T014/T015/T020/T029。
- **実装対象**：通報シート・reports・限定証拠保存。
- **完了条件**：投稿/募集/イベントから理由付き通報。通報者非公開、重複制限、削除済み対象も適切受付、証拠は運営のみ。
- **検証方法**：通報→受付→運営参照、一般利用者証拠取得拒否、削除競合。
- **監査根拠・再利用判断**：E08。未実装。Q08保持上限は公開前に解決。

### T024 運営認証・通報対応・制限/解除

- **状態・優先・要件**：IN_PROGRESS / P1 / R16/R18。依存：T023/T029。
- **実装対象**：運営画面・admin権限・制限API・監査。
- **完了条件**：運営だけ対応/削除/投稿制限/利用停止/解除。理由/90日監査。投稿制限で滞在を消さず、利用停止では終了、解除で復活なし。Q09認証/Q07波及に従う。
- **検証方法**：一般ユーザーAPI直呼び、停止と更新、既存接続と取得、操作監査。
- **監査根拠・再利用判断**：E09。member停止triggerのみ再利用可能。運営資格/画面/APIなし。

### T025 運営の招待監督

- **状態・優先・要件**：IN_PROGRESS / P2 / R03/R16/R18。依存：T003/T024。
- **実装対象**：招待関係・発行/使用一覧・追加/無効化UI/API。
- **完了条件**：発行者/使用状況を運営が確認し無効化・枠追加/停止。有効利用者の招待関係を監督できる。
- **検証方法**：運営/参加者の権限、失効と消費競合、一覧反映。
- **監査根拠・再利用判断**：E03/E09。開発CLIを製品運営機能と数えない。

### T026 ステッカー準備・登録ワークフロー

- **状態・優先・要件**：IN_PROGRESS / P1 / R11/R18。依存：T006/T024/T029。
- **実装対象**：運営登録画面・tags/placements/provisioning・NFC adapter。
- **完了条件**：下書き→書込→再読取照合→設置確認→公開待ち。失敗/通信断から同操作を再開、未照合を有効化しない。物理読書のみfake可。
- **検証方法**：fakeタグで成功/容量不足/照合不一致/通信断、一般権限拒否。
- **監査根拠・再利用判断**：E10。固定開発タグ書込は本フローではない。実タグはT028。

### T027 街範囲公開・移設/交換/撤去

- **状態・優先・要件**：IMPLEMENTED / P1 / R11/R18。依存：T026/T008。
- **実装対象**：運営Mapプレビュー・凸包/版公開API。
- **完了条件**：3点以上凸包プレビューと一括公開。設置/範囲版を原子的更新、移設中停止/交換旧ID廃止/撤去。地点不足は旧範囲保持。変更だけで全員退出しない。
- **検証方法**：凸包退化/同時編集/応答紛失、旧commit拒否、次観測で新版適用。
- **監査根拠・再利用判断**：E10。areas/tag revisionと観測検査は再利用。凸包・設置管理・公開APIなし。

### T028 実NFC読取・書込・照合の接続

- **状態・優先・要件**：BLOCKED / P3 / R04/R11。依存：T012/T026/T027。
- **実装対象**：実機NFC adapter・署名・実ステッカー。
- **完了条件**：ADP署名iPhoneで実読取入街、書込/再読取/設置/公開。取消/失敗/容量不足で誤確定しない。開発代用が本番へ露出しない。
- **検証方法**：実タグで利用者/運営フローを一度ずつ、失敗条件確認。
- **監査根拠・再利用判断**：E10。Ndef read/write呼出しは存在。ADPと機種/保護方針待ち。

### T029 共通コマンド・上限・認可境界

- **状態・優先・要件**：IN_PROGRESS / P1 / R03/R16/R18。依存：T001。
- **実装対象**：各APIの共通guard・頻度/接続枠・受付記録。
- **完了条件**：要件8章の文字/投稿/取得/招待/ピン/接続上限をサーバーで強制。新規作成のD02期限を決定し、重複記録削除後の再送で再生成しない。
- **検証方法**：上限境界と並行要求、資格停止、他人ID/権限偽装、再送。
- **監査根拠・再利用判断**：E05/E09。4KiB/prepare10回/分/会員guardはあるが全機能用の制限は未実装。

### T030 全データの期限清掃・ログ保護

- **状態・優先・要件**：IN_PROGRESS / P2 / R17。依存：T003/T004/T014/T018/T020/T023/T026。
- **実装対象**：cleanup・Storage・通知/証拠/端末キャッシュ清掃。
- **完了条件**：要件9章の全対象を期限後非公開・期限内物理削除。募集が長い有効滞在に属しても終了後24hで消す。通報/運営/セキュリティログを分離。バックアップ運用はT033。
- **検証方法**：対象ごとの期限境界・親子削除・再試行/復元時の抑止。Q08を先に決定。
- **監査根拠・再利用判断**：E11。滞在/気配/試行/入街ログの清掃あり。他対象なし。

### T031 全画面・主要フローのローカル統合

- **状態・優先・要件**：TODO / P2 / R01/R03〜R19/R21。依存：T003/T004/T005/T007/T012/T013/T014/T015/T016/T017/T018/T020/T021/T022/T023/T024/T025/T026/T027/T029/T030。
- **実装対象**：利用者/主催者/運営の全導線。
- **完了条件**：ローカル実DBで招待→登録→閲覧→入街→気配→募集/チャット→イベント参加/変更通知→退出、運営登録/対応を一巡。実NFC/Pushのみ明示adapter代用可。未接続UIを完成扱いしない。
- **検証方法**：役割別通し操作、主要失敗/権限/期限、Figma比較。既存成功テストは関連変更時のみ。
- **監査根拠・再利用判断**：E04〜E11。現在の最初の一本の分割確認を再利用、全機能統合は未着手。

### T032 本体iPhone・複数閲覧・性能確認

- **状態・優先・要件**：TODO / P2 / R01/R09/R20/R21。依存：T010/T031。
- **実装対象**：実機・閲覧端末・限定負荷計測。
- **完了条件**：本体でロック歩行/静止/権限/通信断OFF/再起動/10分欠測を記録し他画面と照合。Q11で性能条件を確定し測定。投稿なしで気配を感じる体験確認。NFCはT028で別確認。
- **検証方法**：変更をまとめた実機1巡＋対象負荷試験。電池0%を保証扱いしない。
- **監査根拠・再利用判断**：E06/E12。既存は隔離試作のみ歩行、製品UIはシミュレータ。

### T033 クラウド・配布・公開準備

- **状態・優先・要件**：BLOCKED / P3 / R02/R17/R20/R22。依存：T019/T028/T030/T032。
- **実装対象**：Supabase/SMTP/タイル/配布設定・復元手順。
- **完了条件**：承認済み地域/予算/配信/7日バックアップ方針で環境を用意、移行/期限再適用を確認。開発導線・固定タグ・秘密/過剰ログを除外し、依存警告を評価して配布可能にする。公開自体は別承認。
- **検証方法**：本番相当設定/復元/署名配布の確認、対象依存評価。
- **監査根拠・再利用判断**：E01/E12。クラウド/本番メール未設定。ADP/契約/配布の判断待ち。

## 実行順序と次の着手

1. **全画面の骨格**：T006を最初に着手。既存認証・Map・状態管理は呼出し境界を保って移す。Home(T013)、Settings(T004/T005)、作成/詳細シート(T014〜T017)、チャット(T020)、運営(T024〜T027)の画面部分をモックで一巡可能にする。初期タブ等の未決定は判断前に固定しない。
2. **既存Mapと入街UIを接続**：T007/T012。気配計算T011・DB T008・端末状態T009は再利用する。背景細部だけに作業を集中しない。
3. **登録と共通API境界**：T029の認可/受付/上限を先に整え、T003/T004を接続。重大な越権・二重作成リスクのため、DB接続時にこの順を守る。画面の先行実装は妨げない。
4. **交流機能を一巡**：T014→T020/T021→T022/T023、T015→T016/T017→T013/T018。各機能のUI・API・DBを小さく接続し、全部のAPI完成まで画面を放置しない。
5. **運営と保存を接続**：T024/T025→T026/T027、T005/T030。運営の登録はfake NFCで先に一巡する。保存清掃・認可は各APIと同時に追加し、この段階は全対象の漏れ確認。
6. **全体統合**：T031、T010の未確認条件とT032。共通コードに変更がない限り既存中核の試験を繰り返さない。
7. **外部接続・配布**：準備できた順にT019/T028/T033。ADP待ちで1〜6を停止しない。

**次の3件：T006（3タブ/全導線）→T007（Mapの画面差分）→T012（入街シートの状態表示）。** この3件の後は主要機能へ移り、中核だけを磨き続けない。モック先行ではタスクの状態をIN_PROGRESSにし、API未接続を明示する。

## 外部依存・判断待ち

| 論点 | 影響 | ローカルで先行する方法 | 判断を求める時点 |
| --- | --- | --- | --- |
| ADP・実NFC・タグ機種/保護 | T028 | 既存開発入力と運営用fake adapter。書式v1は試験用、保護は未承認 | 実タグ接続前。加入はユーザーが約1か月後に予定 |
| 実Push資格・配信方式 | T019 | T018のoutbox/アプリ内通知とfake送信 | APNs等の設定前 |
| Supabase地域/プラン、SMTP、公開URL、予算、バックアップ | T033 | ローカルSupabase/Mailpit。契約不要 | LAN外試験/配布前に必要操作・費用条件を提示 |
| 地図タイル/スタイル・街素材・ヘッダー列・起動タブ | T006/T007 | Figma構造を維持したadapter/仮素材、開発用表示 | 画面を確定する次の着手時。無料契約を推定しない |
| イベント定員、地点範囲、開催中日時編集 | T015/T017 | フォーム/モデル境界まで先行 | DB制約/挙動を確定する前（Q07） |
| 作成要求D02・通知/証拠/下書き保持 | T029/T018/T023/T026/T030 | 既存入街2分を他機能へ流用せず受付層を分離 | 各APIの保存期限確定前（Q08含む） |
| メール変更/紛失/退会、過去プロフィール、運営強認証/停止のイベント波及 | T004/T005/T024 | 既存ログイン/認可を再利用し承認済み操作を先行 | 該当機能接続前（Q01/Q09） |

現時点でクラウド操作は依頼しない。次回実装の直前に、必要な画面判断だけをまとめて確認する。監査だけで未決定仕様を採用しない。

## 検証と進捗更新のルール

- 各タスクの対象Rと完了条件に直接効く検証を選ぶ。UIのみなら対象操作＋型/Lint、並行DBなら対象結合試験、ネイティブ変更なら対象Swift確認から始める。
- 試験済み領域は、関連変更・失敗・新しい具体的懸念がなければ再実行しない。iPhoneビルド/転送は必要な変更をまとめる。
- DONEへの移行では、実行日・コード/試験・画面・モックの範囲を証拠欄へ残す。重大な不整合が見つかればDONEから戻して理由を記録する。
- 分母の変更は追加/削除/分割/統合の理由と変更前後の件数・率を本節へ記録する。完了率を上げるための分割や未完成機能の削除をしない。
- 毎回、全体件数と5状態、実装到達率、今回完了/進展/次のタスク、障害、判断待ち、実施/省略/未確認の検証を報告する。

## 今回の変更記録

2026-10-30：従来はMVP全体の分母なし。初回基準として33件を作成（5 DONE / 1 IMPLEMENTED / 4 IN_PROGRESS / 20 TODO / 3 BLOCKED）。機能追加・削除による分母変更ではなく、既存全仕様の初回棚卸し。従来のI1〜I4は中核部分の履歴として保持し、この表へ進捗基準を移す。

**今回新たに完了した実装タスク：なし（増分0件）。** 既存コードと過去の検証証拠に基づきT001/T002/T008/T009/T011を初回DONE判定。T010を実装済み未確認、T007/T012/T021/T030を部分実装と判定。3件の外部待ちを分離した。今回の成果物は監査書・計画・文書の矛盾修正であり、完成数へ水増ししない。

## Implementation checkpoint — 2026-10-30

User authorized autonomous implementation after audit. Current: DONE 5 / IMPLEMENTED 1 / IN_PROGRESS 6 / TODO 18 / BLOCKED 3. Completion 5/33 (15.2%), implementation 6/33 (18.2%). No new DONE tasks.

T004/T006 now IN_PROGRESS. Existing Map moved into Expo Router tabs; Home/Map/Settings and profile/invitation/notification/block/admin/pin creation/location routes added. Unconnected screens explicitly indicate preparation, not successful data retrieval. Profile name get/save uses the existing authenticated RPC boundary. Migration 202610300001 applied to local DB. Image processing and complete navigation verification remain.

Validation: TypeScript and Expo Lint passed. tests/profile.test.mjs passed against local DB (save/read, cross-account isolation, inactive member rejection, existing time RPC compatibility). Native build/device transfer omitted: no native dependency changes. No physical-device verification this checkpoint.

Resume: connect invitation/chat/pins APIs and screens; complete router/session integration. Product choices (past-post profile changes, event capacity/location/editing, initial Map) pending async user response. Do not treat silence as approval. Keep following existing task order without requesting permission after each task.

### Checkpoint 2 — integration work continues

Current: DONE 5 / IMPLEMENTED 1 / IN_PROGRESS 10 / TODO 14 / BLOCKED 3 (33 total). T003/T015/T020/T022 started; no new DONE. Invitation issue/accept/list/revoke RPC and screen added; local migration 202610300002 applied. tests/invitations.test.mjs passed (real local DB issuance→single-use enrollment, replay rejection, banned account rejection). Issuance response-loss handling/receipts and complete first-registration UI remain.

Event location selection now opens MapLibre and returns a coordinate while retaining in-memory form draft. No event is published yet. Map recenter button and an isolated native currentLocation method added; the method does not call presence API or create a visit. This native change is not built/device-verified yet; batch native changes before building.

Chat read/delete/block SQL supabase/drafts/202610300003_chat_read.sql is a DRAFT outside automatic migrations, not applied: current-profile presentation awaits pending user choice. Blocks UI connected to forthcoming RPC. Chat send and command receipts not yet implemented. Latest TypeScript passed. Next: await product answers while continuing approved UI/session/entry work; then apply chat migration and connect posting/receipt/pins flows. Do not label draft endpoints or unbuilt native APIs operational on device.

Checkpoint 3: Entry sheet now has a DB-confirmed success state; Page routes have a back action. Map recenter uses isolated one-shot Core Location, not the presence manager. Native change remains unbuilt. Migration 202610300004 fixes recruitment cleanup against its own expiry/end, not only the parent visit end; applied locally, targeted retention verification pending. Chat draft kept OUTSIDE migrations while profile-display decision is pending. No further DONE changes.

### Checkpoint 4 — approved decisions and connected feature flows

M01/M02 approved by user: current profile on past messages; capacity default20/range1..100; event coordinates inside street, while running only end time editable within24h; initial Map. Common server receipt10min, minimal result until acceptance deadline+24h, existing entry2min unchanged. Chat SQL moved from drafts into migrations and applied.

Current: DONE5 / IMPLEMENTED1 / IN_PROGRESS16 / TODO8 / BLOCKED3. Completion5/33(15.2%), implementation6/33(18.2%). T013/T014/T016/T017/T018/T029 started; no unverified whole-feature task marked DONE.

Implemented connections: Map chat→profile-backed history/send/delete/block; persistent SecureStore request journal→10min receipt→idempotent command. Event create→Map/Home→detail→join/cancel→host roster/end-time edit/cancel→in-app notifications/outbox. Recruitment create/get/list/edit/end API and UI, one-shot coordinate confirmation, Map/Home markers. New migrations005..008 applied locally. Feature cleanup now includes messages/receipts/events/notifications. Push delivery is not implemented.

Verification: simulator native build succeeded once after one-shot location addition. Navigation-only UI initially failed because the test assumed a native TabBar; fixed accessibility selector, rerun passed43.8s. Verified Home/Map/Settings, creation→location→draft retained, settings routes. No physical iPhone verification this checkpoint. Profile/invite/retention DB flows passed. Chat integrated DB flow passed (profile→send→other reader→delete→replay→block→expiry). Event integrated DB flow passed (create→join→Home→cancel/replay→important-change notification→roster authorization→cancel); initial PostGIS search_path error was corrected by explicit projection strings. Recruitment integration and newer whole UI flow remain to verify. Latest typecheck rerun after missing recruitment state declarations; inspect result before claiming pass. Native was not rebuilt for JS/SQL changes.

Remaining specifics: complete finite invitation issuance retries; profile image processing; chat live delivery/paging reconciliation/reporting; expired recruitment draft recovery; complete host edit form; server notification worker; operator moderation/sticker flows; session/cache integration and all-device flows. Existing partial implementations are not complete features yet. Git initial commit555969d on codex/mvp-integration, local only; further feature changes not committed yet at this checkpoint.

### Checkpoint 5 — recruitment integration and Git

Recruitment real-DB integration passed: checkin→create→other viewer list→title edit (expiry unchanged)→exit→old request retry does not restore pin. tests/recruitment-flow.test.mjs is the evidence. Event/chat flows above passed; UI end-to-end for these new flows still pending. Navigation-only simulator test was successful, not all-feature/device success. Current totals unchanged: DONE5 / IMPLEMENTED1 / IN_PROGRESS16 / TODO8 / BLOCKED3.

New commands.ts persists pending requests in SecureStore chunks, checks server completion/expiry, avoids new issuance for uncertain/deleted receipts. Recruitment UI still needs explicit discard/recovery for an uncommitted stale location (do not resend stale coordinates as fresh). Invite issuance still requires receipt/retry integration. Background real device, profile images, moderation, sticker operations, complete event edit UI and real-time chat recovery remain.

Git is now initialized with baseline commit555969d on codex/mvp-integration. Secrets, local environment, generated native folders, dependencies and logs excluded; no remote/push. Continue feature-sized commits. Native currentLocation compiled in simulator build /tmp/yumegaoka-mvp-navigation-build.log; no new phone transfer yet.

## 実装チェックポイント6：MFA・運営・通報・送信取消

- T023/T024/T025をTODO→IN_PROGRESS。分母33、DONE5・IMPLEMENTED1・IN_PROGRESS19・TODO5・BLOCKED3。完了増分0、完成率15.2%、実装到達率18.2%。
- M03〜M05を要件・未決一覧・運営/通報設計本文へ反映。メール例外・退会の実装はT005に残る。
- 009_operators：一般認証と運営資格、JWT AAL2、現存セッションのAAL2・検証済みTOTPを確認。招待監督一覧・無効化と90日監査。画面admin.tsxとSwift MFA APIを追加。
- 010_reports：投稿/募集/イベントから通報。証拠はDBの対象から取得しクライアント持込本文を信用しない。未解決重複統合、一般利用者の証拠閲覧拒否、運営削除・解決、180日/30日清掃。report.tsx/moderation.tsxに接続。
- 011_command_cancel：送信と取消を同じ受付行ロックで直列化。確定済みなら結果を返し、未確定なら取消後の遅延要求を拒否。募集の古い現在地を取り直す導線を追加。
- 検証：operator-access.test.mjs、report-flow.test.mjs、取消を追加したchat-flow.test.mjsが成功。型検査成功。Lintはエラー0・StreetChatのcleanup ref警告1。
- 未確認：TOTPの実Auth通信と新版ネイティブビルド（設定は追加したが稼働Auth再起動前）、新しい運営/通報画面の実操作、全画面統合、iPhone転送。DB試験はJWT claimsを試験内設定し、実トークン発行の証明にはしない。
- 運営残作業：投稿制限・利用停止/解除、招待枠追加/停止・ページング、ステッカー登録/範囲公開。通報は募集/イベント経路と再送/期限境界を統合時に確認する。
- 再開：上記残機能を実装し、ネイティブ変更をまとめた時点でMFA実Auth→運営操作を一巡する。成功済み中核検証の無関係な再実行はしない。


## 全機能接続後の仕上げ（2026-10-30 ユーザー追加指示）
- T006/T007/T031の完了レビューに、全画面の文言/UI点検を含める。不要なセカンダリラベル、スローガン、説明文を削り、配置・操作・状態表示で意味を伝える。プライバシー公開・破壊操作・必要なエラー復旧は判断に必要な情報を残す。
- TSXは通常の改行・整形を行い、肥大化した画面から状態管理hooksと表示部品を分離する。無目的な細分化や表示仕様の変更はしない。
- 文言の全面点検は全機能接続後。整形・変更箇所の責務整理は実装中も行う。
- 既存タスクの品質条件として扱い、分母33は変更しない。


## 実装チェックポイント7：認証実接続・運営制限・可読性
- M06/M07：利用停止時の主催イベント自動中止を採用。投稿制限は運営指定の終了日時まで、利用停止は解除まで。
- T024/T025：参加者一覧、招待枠追加/発行停止、利用停止/解除、投稿制限/解除をDBとmembers画面へ接続。理由を監査記録へ保存。自己利用停止は誤操作防止で拒否。
- T023：保持中の削除済み投稿、終了済み募集/中止イベントもサーバーに残る最小データで受付する。消去済み本文を復元しない。
- 実Auth確認：scripts/mfa-smoke.mjsで実メールOTP→TOTP登録/検証→運営API成功→資格失効403。試験専用ユーザーは削除。秘密は出力なし。
- ネイティブ：MFAブリッジを含むシミュレータビルド成功（/tmp/yumegaoka-mfa-build.log）。iPhone転送・操作は未実施。
- member-operations.test.mjsで投稿制限中の滞在維持、制限解除後送信、利用停止時のイベント中止通知・滞在終了、解除しても復活なし、招待枠/停止を確認。変更したreport-flowも成功。
- TSX/TSを既存Prettierで整形。チャット状態管理をhooks/useStreetChat.tsへ分離。型検査・Lint成功（警告0）。表示内容の全面見直しは全機能接続後に残す。
- ローカルマイグレーション履歴を整合。今後は適用と履歴保存を同一トランザクションにする。ローカルAuthをデータ保持で再起動しTOTP設定反映。
- 完了件数は5/33のまま。画面の実操作と全体統合は未確認であり形式的にDONEへ進めない。次はステッカー登録/公開、画像設定、アカウント例外の接続。


## 実装チェックポイント8：ステッカー準備と凸包公開
- T026/T027をTODO→IN_PROGRESS。DONE5/IMPLEMENTED1/IN_PROGRESS21/TODO3/BLOCKED3、分母33、完成率15.2%・実装到達率18.2%は変更なし。
- 014/015：ステッカー下書き→書込→照合→設置確認を永続化。設置確認だけではタグを有効化しない。3点以上の凸包プレビュー、公開時に街版・タグ版・下書き版・プレビュー時の有効タグ集合を再検査し、範囲と設置を原子的に公開する。
- 移設開始でタグを停止して再読取から再開。タグ停止だけでは街範囲を変更しない。退化した凸包は公開せず旧範囲を保持。公開しても既存滞在を終了させない。
- 画面：stickers/index、[id]、area。共通LocationPicker、地図上の範囲プレビュー。開発ビルドの物理NFCだけfake、認可・DBは実処理。JSONタグ書式は既存のv/tag_idに一致。
- sticker-flow.test.mjs成功：3枚準備→未照合遷移拒否→1点で公開不可→凸包公開→同受付再送→停止後の古いプレビュー拒否→2点時の旧範囲保持。SQLの変数別名衝突を修正。型検査成功。Lint重複import警告を修正、再実行は次の変更確認時。
- 未完：交換時の旧タグ廃止の原子性、登録下書きの編集/取消/再開UI、公開受付の期限清掃、全画面実操作、実NFC。物理write/read実装は未検証でT028はBLOCKEDを維持。
- 次：上記のステッカー残処理、本人アイコン/アカウント例外、イベント編集と通知の残処理を接続し、まとめてUI統合へ進む。


## 実装チェックポイント9：本人アイコン
- T004/T020：Expo58対応ImagePicker/ImageManipulator/FileSystemを追加。2MB以内の画像を最大512pxで読み込み、JPEGへ再エンコードして非公開Storageへ保存。プロフィール画面をuseProfileへ分離、チャットは現在の本人画像を参照する。
- RLSで会員閲覧・所有者更新、bucket側でも2MB/JPEG制限。scripts/avatar-smoke.mjsで実Storage保存→プロフィール参照→別会員読取、他人上書き/公開URL/2MB超過/停止会員の拒否を確認。fixtureユーザー・画像は削除。
- 未確認：新ライブラリのネイティブビルドと写真選択実操作、出力画像のメタデータ/寸法の実測、退会時の画像清掃。型検査成功。T004はIN_PROGRESSを維持。
- 依存監査：npm auditはZod<4.6.6の大量入力時メモリ消費（GHSA-mrhx-c7xc-m3w5）をhighとしてExpo CLI経由で報告。実体は開発CLI/ESLintのzod3.25.76であり、アプリの入力APIには使用していない。修正提案のExpo51への逆移行やZod4への無検証差替えは行わない。deepmerge4.3.1も開発設定経由のlow。公開準備T033で対応版を確認する。
- NFC開発代用のガードを共通development.tsへ移し、ステッカー側もdebug＋明示設定＋ローカルAPIに限定。
- 進捗5/33を維持。次の再開点はアカウント例外/イベント編集等の残処理。ネイティブ変更をまとめた後、画面操作を統合確認する。


## 実装チェックポイント10：アカウント例外とイベント編集
- T005をTODO→IN_PROGRESS。DONE5/IMPLEMENTED1/IN_PROGRESS22/TODO2/BLOCKED3、分母33、完成率15.2%・実装到達率18.2%は変更なし。
- R03/R17/R18：メール変更画面と新旧メールのOTP確認、退会の再認証・資格停止・投稿匿名化・プロフィール削除・Auth/画像の清掃ジョブを接続。メール紛失の自動復旧は追加していない。
- ローカルAuthのenable_confirmations=falseでは新旧両方の確認が成立しないことを試験で検出しtrueへ修正。起動直後はメールテンプレートの初回読込前に既定テンプレートで送られる事象があり、読込後に再確認。account-smoke.mjsで両メール確認→変更→古い認証による退会拒否→OTP再認証→匿名化→Auth清掃成功。
- R13/R14/R16：イベント編集をuseEventEditorへ分離し、開催前の項目編集・開催中の終了時刻編集を接続。中止再送の冪等性と主催者以外の名簿閲覧にMFA運営認可を適用。event-flow.test.mjs成功。
- アカウント・画像ネイティブ変更をまとめたシミュレータ向けビルド成功（/tmp/yumegaoka-account-profile-build.log）。型検査・Lint成功。iPhone転送・新画面の実操作は未確認。
- useEmailChange/useWithdrawalへ通信・状態管理を分離。退会確認の通信再試行では確認済みOTPを再消費しない。成否不明時に「未完了」と断定しない。TSXと追加スクリプトを整形。全面的な文言・レイアウト点検は全機能接続後に行う。
- 残り：退会応答消失後の再起動復旧、匿名投稿の通報/ブロック表示、全画面の認証失効連動、定期清掃の継続実行、UI統合。T005はDONEにしない。


## 実装チェックポイント11：Mapの責務分割と匿名投稿
- Mapの862行のTSXを321行へ整理。認証・入退場・購読/更新をuseStreetMap、地図上の気配/ピンをStreetMapMarkers、スタイルをstreetMapStylesへ分離。機能や同意内容を削除する変更ではない。
- 019：退会済み投稿のauthor_idがnullでも通報可能にし、証拠だけを取得する。チャットは退会済み表示、本人判定false、存在しないアカウントのブロック操作は表示しない。report-flow成功。
- 型検査・Lint成功。JS変更なので本体を再ビルドせず、直前の成功ビルドを使用。
- UI遷移試験の初回は旧説明文を待って失敗。現在の共通LocationPickerは説明文ではなく地点確定ボタンを表示するため、試験の確認対象をボタンへ修正。修正後のtestMVPNavigationは43.624秒・失敗0で成功。Home→イベント作成→地点選択→入力保持→Settingsの各画面→Mapを確認。新アカウント画面の入力や全機能統合を確認したものではない。
- 分母・完了件数に変更なし。コピー全面見直しは全機能接続後。未確認のUI操作、匿名化後の保持期限、認証失効時の全画面連動は引き続き統合対象。


## 実装チェックポイント12：ステッカー登録の再開導線
- T026：送信前に永続化済みのsticker_create受付と本文を画面再表示時に復元。通信がなくても保存本文を先に表示する。未確定中は別内容への変更を止め、同じ受付の再試行か取消結果の確認へ誘導する。
- 取消と作成が競合して既に登録済みなら、その登録詳細へ遷移。取消が確認できるまで端末の受付を破棄しない既存共通処理を再利用。
- 状態管理をuseStickerRegistrationへ分離。型検査・Lint成功。JSのみなのでネイティブビルド省略。再起動/応答紛失の画面実操作は未確認でDONEにしない。
- 次：登録後の下書き編集/取消、旧タグ廃止と新タグ公開の同時確定、ステッカー運営の一巡確認。進捗は5/33、分母・状態件数に変更なし。


## 実装チェックポイント13：登録後の下書き編集・取消
- T026/R04/R11/R17/R18：020 migrationとステッカー詳細画面を接続。管理名/地点の編集、登録取消を追加。公開済み/期限切れ/古いrevisionでは編集不可。設置済み地点を変更したらverifiedへ戻して現地設置確認を再要求する。
- 取消で未公開新規タグは廃止、既存の移設タグは停止を維持。下書きを削除し、遅延したstepによる再開を拒否。取消再送は成功扱いだが既存公開設定は変更しない。
- sticker-flow成功：編集後の古い範囲公開を拒否→再設置確認→新プレビューで公開、取消再送、新規ID廃止、取消後step拒否。型検査・Lint成功。
- 未確認：編集/取消の画面実操作、移設取消の個別試験、交換の旧新タグ原子公開。T026/T027はIN_PROGRESS維持。次は交換実装と運営画面の一巡確認。進捗5/33のまま。


## 実装チェックポイント14：旧新ステッカーの交換
- T027/R04/R11/R17/R18：021で交換対象を下書きに保持。運営画面に交換準備を追加し、既存の書込→照合→設置→範囲公開へ接続。新タグ準備だけでは旧タグを停止しない。緊急停止は既存操作を使用。
- 凸包から交換対象の旧地点を除き、新地点を使用。公開時に旧タグ版を再検査し、旧タグ廃止・新タグ有効化・設置/範囲版更新を同じトランザクションで行う。廃止IDへの移設準備を拒否。同じタグへの並行移設/交換下書きを抑止。
- 公開期限は街ロック取得後の時計で判定するよう修正。
- sticker-flow成功：準備中の旧タグ有効維持、交換後の旧タグ廃止/新タグ有効化、有効設置3件維持、公開再送で版を増やさない。初回に変数phaseと列名の衝突で失敗し、列修飾後に成功。適用履歴も修正版へ整合。
- 型検査・Lint成功。本体再ビルドは不要。運営画面の一巡、交換途中の通信断実操作、実タグは未確認。T026/T027はIN_PROGRESS、5/33と状態件数は変更なし。
- 次の再開点：運営画面の登録→編集→照合代用→設置→範囲公開→移設/交換をシミュレータで通す。残る全画面の認証連動・チャット/通知の接続へ進む。


## 実装チェックポイント15：運営画面の登録一巡
- T024/T026：testOperatorStickerPreparationで実TOTP登録/追加認証→ステッカー登録→NFC代用書込→照合→設置確認→管理名編集→取消をシミュレータで操作し成功。DB/API/認証はモックではない。
- 初回はTOTP拒否。時計差はほぼなし。試験のキー取得をTextのlabelへ統一し、コードを一文字ずつ入力・値照合する修正後に成功。認証条件は弱めていない。
- /tmp/yumegaoka-operator-ui-retry.log、Test-Smoke-2026.10.30_11-01-51-+0900.xcresult。コードや設定キーを含み得る詳細成果物は共有しない。試験後に専用アカウントの運営資格/TOTPを失効。
- 再実行用prepare-ui-test --operator/--revoke-operatorを追加。試験に専用アカウント確認ガードを追記（ガード追加後の再実行は省略）。既存ルールに従い実アカウントを変更しない。
- 型検査/Lint成功。本体の再ビルドなし。範囲公開/移設/交換の画面一巡、通信断/再起動の運営画面は未確認。T026/T027はIN_PROGRESS維持。次はその確認と残る全画面連携へ進む。
- タスク表と個別T005節の状態表記の不一致をIN_PROGRESSへ修正。進捗の分母・件数は変更なし（5/33）。


## 実装チェックポイント16：範囲公開・交換UIと定期清掃
- T027をIN_PROGRESS→IMPLEMENTED。公開/移設/交換/停止・撤去候補のAPI/画面が揃い、3地点登録→凸包プレビュー→公開→交換用登録→再公開→旧タグ廃止表示までシミュレータで成功（101.305秒、/tmp/yumegaoka-area-ui-retry.log）。T026依存と同時編集/応答紛失/旧commitの統合確認は不足しDONEにしない。
- 最初の試験ビルドは共通化したhelperの戻り値で失敗。helperを修正して成功。本体コードの再ビルドは行っていない。試験用運営資格/TOTPは終了後失効。
- DONE5/IMPLEMENTED2/IN_PROGRESS21/TODO2/BLOCKED3。完成率15.2%、実装到達率7/33=21.2%。分母変更なし。
- T030：npm run db:maintenanceでローカル期限清掃/退会清掃workerを継続起動。起動後の清掃0件成功を確認。通信15秒上限を設定。構文確認済み。現在のexec sessionは8482、再開時は生存確認してから扱い、二重起動しない。Mac/プロセス停止後は起動し直す手順をREADMEへ記載。
- 次：全画面の認証失効/再ログイン連動、チャットと通知の接続、主要機能をまたぐ一巡。NFC/実Push/クラウドは外部依存のまま。


## 実装チェックポイント17：認証切替と画面状態
- T005/T006/T031：native認証操作から共有sessionStateへ結果を通知し、identity変更時にStackを再生成。ピン下書きを消去し、未ログイン時はMapのログインへ戻す。同アカウントOTP再認証はepochを変えず退会処理を維持。
- 初回のProxy方式はネイティブonChangeで「native state unsupported on Proxy」の描画エラーを起こしたため廃止。各bridgeメソッドを直接呼ぶ明示的wrapperへ修正。
- session-state.test成功：同identity再認証維持、ログアウトでメール/下書き破棄、別identityで再生成、購読解除。型検査/Lint成功。
- 修正後のtestLoginEntryRestartExit成功（59.996秒、/tmp/yumegaoka-session-ui-retry.log）。実OTP→開発入街→更新→再起動→退出→再起動を一本で確認。本体再ビルドなし。
- 未確認：遠隔での資格/認証失効時に全画面のキャッシュを消す連動、別アカウントとの往復実操作、退会応答消失からの再開。メール変更もidentity変更として画面を再生成する。全認証例外を完了とはしない。
- 次は遠隔失効と未登録会員の導線、チャット/通知の更新接続を進める。完了件数5/33、実装到達7/33を維持。


## 実装チェックポイント18：利用資格の画面連動
- T003/T005/T024/T031：022 account_accessは認証済み本人の未登録/有効/停止/退会状態だけを返す。セッション失効を拒否。他人ID入力は使用しない。DB試験成功。
- 前面で10秒間隔と復帰時に利用状態を確認。未登録は招待入力、停止/退会は専用画面へ誘導し、画面状態を破棄して観測停止。招待受付後は即再確認する。ネットワーク失敗を利用停止と誤認しない。
- UI試験で再マウント時のconfigureがauthGenerationを更新して進行中照会を失効させる不具合を検出。接続先が同じconfigureはPromiseを共有し、一度だけ実行。失敗時は再試行可。login_requiredが一時的な再認証競合の場合はローカルsessionを再確認し、無条件logoutしない。
- account-access、native-configuration、session-state試験成功。testSuspendedAccountGate成功（26.007秒、/tmp/yumegaoka-access-gate-ui-retry.log）。専用fixtureの停止状態でOTPログイン→停止画面、入街/投稿欄なしを確認。終了後に利用資格を復元。
- 型検査成功。Lintのeffect内初期更新指摘に対応し、初回照会を取消可能なタイマーへ移動してLint成功。タイマー変更後のUI再実行は省略。ネイティブ変更なし・本体再ビルドなし。
- 未確認：利用中に遠隔停止した画面の切替、解除後復帰の実操作、未登録→招待→プロフィールの一巡、実機。進捗5/33・実装到達7/33維持。次は招待とプロフィールの一巡、チャット/通知の更新接続。


## 実装チェックポイント19：招待後のプロフィール導線
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


## 街pool要件の訂正（2026-10-30）
T003/T004/T007/T030：登録時にpool画像の必須提供、街への保存、日ごとのランダムシャッフル、登録UIの用途説明を追加反映。運営素材限定の旧仕様は置換。Q05の割当/保持等を手元の実装の区切り後に相談する。コード未反映。既存の初回登録UI試験は名前設定までの証拠であり、pool画像必須の完成証拠ではない。33タスクの分母・状態・完了件数は変更なし。


## 実装チェックポイント22：通知画面の更新・既読接続
- T018/R13/R14：通知取得と既読操作をuseNotificationsへ分離。画面focus/前面復帰/10秒補完/既存street変更合図で再取得。未読の視覚表示、中止通知の確認済み表示、確認処理中の重複タップ抑止を接続。初回取得中に「通知なし」を出さない。
- 既読成功で古い一覧応答を世代番号で無効化し、未読への巻き戻りを防ぐ。notifications-state.test.mjs成功。型検査・Lint・diff check成功。
- 未確認：イベント変更から別端末通知画面までの統合、実機での既読操作。Push配信/外部設定はこの変更に含まない。JSのみで本体再ビルド省略。T018はIN_PROGRESS、全体5/33、実装到達7/33維持。
- 街poolは本人チャット画像との関係・本人の当日割当表示・取り下げ/日替わり境界を質問中。回答待ちを承認として扱わず、他の接続を継続する。


## 街poolの確認回答受領
T003/T004/T007/T030：チャット画像との別設定、本人と地図で同じ当日割当、日本時間0時切替、提供者の差し替え/削除/退会時取り下げを承認。Q05の該当判断待ちは解消。pool専用保存・認可、日次割当、本人確認UI、集約APIの画像連携、失効/取り下げ接続が未実装。旧素材限定方式で進めない。


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
