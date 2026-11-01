# MVP全体の実装タスクと進捗

更新：2026-10-30。初回の全体監査を基準にする。仕様は[MVP_REQUIREMENTS](MVP_REQUIREMENTS.md)、画面は[SCREEN_FLOW_REVIEW](SCREEN_FLOW_REVIEW.md)とFigma、監査根拠は[MVP_IMPLEMENTATION_AUDIT](MVP_IMPLEMENTATION_AUDIT.md)。過去の最初の一本の進捗をMVP全体の完成率として扱わない。

## 完成定義と今回の境界

最優先の節目は、既存仕様の全画面・全機能を一度操作できる状態。Home/Map/Settings、登録・募集・イベント・チャット・運営の全導線を揃え、実ローカルDB/APIと接続する。投稿なしで街の気配が見え、OFFで共有を止められることを維持する。3D・DM・フレンド・決済・待機列・承認制・当日受付・Android移植は今回の分母に加えない。

- **画面が一巡する節目**：T006と各機能の画面部分。開発専用モックを明示して先行できるが、機能タスク全体はDONEにならない。
- **ローカルで全機能が一巡する節目**：T031。外部の実NFCとPushだけを分離adapterで代用できる。Auth/DB/API/権限/保存は実ローカル処理。運営画面のfake書込を実タグ成功とは扱わない。
- **MVP全体の完成**：全33タスクDONE。実機・実NFC・実Push・公開準備も含む。代用でT031がDONEになってもT019/T028/T033をDONEにしない。公開・購入は別途承認。
- 文化の成立はソフトウェアのタスク完了率で証明しない。R01はT031/T032で体験を確認し、架空人数や投稿の強制で補わない。

**2026-10-30の追加依頼で全MVPの自律実装を再開。外部依存は分離し、全画面・実DB接続・統合確認まで進める。**

## 残作業を減らす管理（2026-10-31）

cp102時点のタスク別完了条件をベースラインとして固定する。条件を緩めず、追加必須作業は既存条件との関係・必要性・残工数影響を記録する。具体チェックリストと項目数・推測工数は[MVP_REMAINING](MVP_REMAINING.md)を正本とし、本ファイルの33タスク状態と併用する。改善はBUG_BACKLOG。外部T019/T028/T033を分離する。

## ロジックとUIの分離（2026-10-31）

[LOGIC_PROGRESS](LOGIC_PROGRESS.md)を新設。下の従来33タスク進捗は維持し、ロジック段階と最終デザイン段階を混同しない。既存DONEは当時の条件達成履歴であり、新しいFigma最終完成を意味しない。

## 現在の進捗

**全体：27 / 33 タスク完了（81.8%）**

| 状態 | 件数 | 定義 |
| --- | ---: | --- |
| DONE | 27 | 下記の限定された完了条件を満たし、既存の必要な検証証拠あり |
| IMPLEMENTED | 1 | コードあり、完了条件の確認が不足 |
| IN_PROGRESS | 2 | 一部コードと検証あり。残る実装・接続を継続中 |
| TODO | 0 | 当該機能の実装未着手。先行タスク未完だけではBLOCKEDにしない |
| BLOCKED | 3 | 実NFC/実Push/公開環境という外部依存で完了まで進めない |

**実装到達率：(DONE + IMPLEMENTED) / 全タスク = 28 / 33（84.8%）**。IN_PROGRESSの割合は推測加算しない。残りは6タスク。件数は工数・日数の割合ではない。基盤、UI、イベント、公開準備で粒度が異なり「残り84.8%の時間」と解釈しない。納期はまだ推定しない。

現在のフェーズ：**ロジック完成の収束段階。APNs直接送信のローカル実装まで接続済み。残る実機・ADP・クラウドの検証と、後工程の最終UIを分離して管理する。**

## 達成段階（2026-10-30 方針修正）

従来の作業ステータスは維持し、以下を独立した達成記録として併記する。○だけを分子に数え、部分的な成功は根拠欄に記載する。IMPLEMENTEDはタスクの必要コード、INTEGRATEDはその実装を実画面・DB/APIで通した基本動作（バックエンド単独タスクは公開API/呼出元接続）、DEVICE_VERIFIEDは該当範囲のiPhone確認、DONEは既定完了条件の達成。バックエンドのDONEに一律の実機確認を追加しない。「対象外」は実機確認率へ加算しない。部分的に接続済みでも必要コードが未完のタスクは統合達成へ加算しない。

- コード実装率：29/33（87.9%）
- 基本動作の統合確認率：27/33（81.8%）
- iPhone実機確認率：11/33（33.3%）
- 完了条件達成率：27/33（81.8%）
- BLOCKED：3/33。実機確認率の分母は依頼どおり全33件。対象外を含むため残り32件すべてに実機試験が必要という意味ではない。

現在はユーザーの希望で実機確認を保留している。iPhoneはcp68版、cp69/70で写真・イベント・チャット・通報・入退街の実操作結果を照合済み。以降の画面変更は未転送。実機の範囲内気配・背景観測・募集・運営は未確認。

| タスク | IMPLEMENTED | INTEGRATED | DEVICE_VERIFIED | 未完了理由・根拠 |
| --- | --- | --- | --- | --- |
| T001 | ○ | ○ | ○ | 完了。ローカル基盤のみ。実機インストール・Auth接続の既存証拠 |
| T002 | ○ | ○ | ○ | cp69：ユーザーがiPhoneログイン→終了/再起動後の認証維持を確認。最初の再ログイン原因は未特定 |
| T003 | ○ | ○ | — | 完了：cp50/60初回登録一巡・同時消費/上限、cp96の7日期限と期限切れ拒否。実機全体はT032 |
| T004 | ○ | ○ | ○ | cp70：本人画像の実機新規保存とDB更新を照合。既存の画像変換・所有権検証と合わせDONE |
| T005 | ○ | ○ | — | cp131：採用導線・実Auth2セッション・再認証/退会削除確認 |
| T006 | ○ | ○ | — | cp118：NAVIGATION_ACCEPTANCEで全導線を対応付け。未確認の入れ子導線をシミュレータ確認 |
| T007 | — | — | — | 実装不足・ユーザー判断待ちQ10：街背景とヘッダーの仕上げ |
| T008 | ○ | ○ | 対象外 | 完了：DB/API責務。実機の連動はT032で確認 |
| T009 | ○ | ○ | ○ | cp70：実機でOFF→人数減少→再起動後OFF維持、DB manual終了と照合 |
| T010 | ○ | — | — | 実機検証待ち：本体ロック中の移動/静止→実DB |
| T011 | ○ | ○ | 対象外 | 完了：集約RPCと表示計算。画面・多端末はT007/T032 |
| T012 | ○ | ○ | — | cp77：新シートでログイン/入街/再起動/退出を確認。権限拒否等の全状態と実NFCは未確認 |
| T013 | ○ | ○ | — | 完了：cp44/46/51/57/69/81/93で一覧・詳細/Map・取消/終了・失敗復旧。iPhone募集はT032 |
| T014 | ○ | ○ | — | 完了：cp46実UIとcp93実DB境界・2接続競合。iPhone募集はT032 |
| T015 | ○ | ○ | ○ | cp69：実機で作成/日時/地点を確認しDB照合。cp109 Mapピン外観確認でDONE |
| T016 | ○ | ○ | ○ | 完了。cp69実機参加/取消→Home、既存並列/逆順試験とcp75終了後拒否を照合 |
| T017 | ○ | ○ | ○ | 完了。cp69主催実機、cp74運営名簿、cp75定員/古い編集/越権/終了後拒否を照合 |
| T018 | ○ | ○ | ○ | cp69：実機の変更通知→詳細と中止通知表示。疑似配信cp67・cp110実競合でDONE。外部配送はT019 |
| T019 | ○ | — | — | cp133：直接APNs/登録/Swift実装。ローカルDBと疑似APNs成功。実配信/端末待ち |
| T020 | ○ | ○ | ○ | テスト不足・実機検証待ち：cp111実2クライアントと既存履歴/画面証拠でDONE |
| T021 | ○ | ○ | — | 完了：cp66の実DB生成/取得/期限/block、cp81の本人画像/名前描画。チャット一般の切断回復はT020、実機全体はT032 |
| T022 | ○ | ○ | ○ | cp104完了：募集一覧/直接取得除外・解除、人数維持、既存入街ログ/遅延応答/UI証拠を照合 |
| T023 | ○ | ○ | ○ | 実機検証待ち・テスト不足：通報→運営対応cp47、cp112残2対象の画面操作でDONE |
| T024 | ○ | ○ | — | cp130：Q07取消し/非復活を確認。MFA/通報/制限/停止/解除はcp47/126/127 |
| T025 | ○ | ○ | — | cp88/89：一覧→無効化、招待枠変更/復元・発行停止/再開をMFA付き実UI/APIで確認。cp105受領者/次ページ確認でDONE。実機はT032 |
| T026 | ○ | ○ | — | テスト不足：cp113 fake登録再開UI・実DB不一致拒否・hook復旧でDONE |
| T027 | ○ | ○ | — | cp114：公開/交換UI証拠＋退化/競合拒否/新版観測成功 |
| T028 | — | — | — | 外部サービス待ち：ADP/実NFC。後段は開発導線で継続 |
| T029 | ○ | ○ | 対象外 | cp104完了。LIMIT_ACCEPTANCEの要件8章/認可/再送証拠対応 |
| T030 | ○ | ○ | 対象外 | cp131：Q08承認と退会関係削除。cp119〜125の期限/コピー/キャッシュを再利用 |
| T031 | ○ | ○ | — | cp128：LOCAL_FLOW_ACCEPTANCEの役割別実UI/DBと新構成の画面受信を照合 |
| T032 | — | — | — | 実機検証待ち：iPhoneはcp68版。まとめ転送と主要操作/背景/複数閲覧 |
| T033 | — | — | — | 外部サービス待ち・ユーザー判断待ち：クラウド/配布/本番運用 |

## 収束時の限定残作業（2026-10-31）

33件の分母と既定完了条件は維持。外部依存3件を除く30件が目標。下表は追加要件ではなく、既存条件への不足証拠を限定する。ユーザーが必要な実機操作は一括案内し、未実施をDONEにしない。改善は[BUG_BACKLOG](BUG_BACKLOG.md)へ。

| タスク | DONEを妨げる条件・最小作業 | 再利用する証拠／完了証拠 |
| --- | --- | --- |
| T003 | T029の招待認可最終照合 | cp50/60の発行・単回消費・poolまでの登録、既存同時消費試験。登録一巡を再作成しない |
| T005 | 完了（cp131） | account-smoke/cp42/118、採用分のAuth/API実行結果 |
| T006 | 画面一覧と既存一巡の対応付け、必須Figma不足のみ | cp43〜47/74/77/81/88/89/92のUI結果。未経路だけ操作 |
| T007 | Q10、ピン外観、現在地の非送信・0/失敗表示 | cp81/92画像、native単発測位経路、合意後のヘッダー画像 |
| T010 | 本体ロック歩行/静止通信 | 計算試験を再利用し、本体実機観測だけ追加 |
| T012 | 取消/権限拒否/別端末/通信不明/退出待ち表示 | cp65/77成功、T009の状態試験。残る表示と確定順を対象確認 |
| T013 | 空/失敗・詳細/Map・期限除外の最終対応付け | cp44/46/51/57/69/81、home-expiry、現行Home描画。過去履歴なし |
| T014 | 期限・権限・同時作成/退出競合・上限の不足証拠 | cp46実UI、recruitment-flow/detail-state、残る実DB境界/競合 |
| T015 | 入力境界と作成ピン表示 | cp69/81/82、event-inputとサーバー境界、T007ピン画像 |
| T018 | 多ワーカー確定と取消中の再試行 | cp45/67/69を再利用、追加は2worker競合。実PushはT019 |
| T020 | 2クライアントの差分回復を接続 | cp44/46/70/86、readChatWindowの実DB結果と購読復帰導線 |
| T021 | T020との表示接続を最終照合 | cp66/81で生成・本人名画像・30日・block済み。新たな到達秒数要件を追加しない |
| T022 | 募集/入街ログを含む取得除外の経路対応付け | cp44/47/70、arrival-chat-flow、遅延応答の状態試験 |
| T023 | 募集/イベント通報画面→実API | 投稿通報cp47/70を再利用し、残る2入口だけ確認 |
| T024 | 完了（cp130） | cp47/70/74/126/127/130のMFA・停止/解除・非復活・監査 |
| T025 | 使用済み招待の受領者・ページング表示 | cp88/89操作と032 API試験、残る一覧だけ確認 |
| T026 | fakeタグ失敗/再読取不一致/通信断から再開 | 通常UIとcp83を再利用、未照合非公開を実API照合 |
| T027 | 版競合/退化/次観測への反映 | 3点公開/交換UIとsticker-flow、未確認競合だけ追加 |
| T029 | 承認済みゲートウェイで接続強制、承認済み上限一覧照合 | 既存共通command/認可試験を再利用、未実装接続境界を実装 |
| T030 | 完了（cp131） | RETENTION_ACCEPTANCE、cp119〜125/131 |
| T031 | 完了（cp128） | LOCAL_FLOW_ACCEPTANCEに既存役割別一巡と接続補完確認を対応付け |
| T032 | ユーザー実機とQ11性能条件 | cp69/70実機操作を再利用。範囲内気配/背景/通信断/募集/運営をまとめる |
| T019/T028/T033 | ADP/APNs/実NFC/クラウド・配布 | 外部準備後。代用の成功でDONEにしない |

## タスク一覧

P0=再利用する土台/次の着手、P1=全画面と主要機能、P2=統合・保存・実機、P3=外部準備後。セキュリティ・整合性の前提は画面先行でもAPI接続前に実装する。依存は原則「DONEにするまでに必要」であり、UIのモック先行着手を妨げない。タスクID T001〜は、従来の試験ケースT01〜T16と別名前空間。

| ID | 機能・目的 | 状態 | 優先 | 依存タスク |
| --- | --- | --- | --- | --- |
| T001 | ローカル開発基盤 | DONE | P0 | なし |
| T002 | 基本OTPログイン・再ログイン | DONE | P0 | T001 |
| T003 | 招待発行・受領・初回登録 | DONE | P1 | T002/T029 |
| T004 | 名前・本人アイコン設定 | DONE | P1 | T002/T006 |
| T005 | アカウント例外・復旧・退会 | DONE | P2 | T002/T004/T030 |
| T006 | 3タブ・画面遷移の骨格 | DONE | P0 | T001 |
| T007 | Map画面・背景地図・現在地 | IN_PROGRESS | P1 | T006/T011 |
| T008 | 入街・更新・終了DB/API | DONE | P0 | T001 |
| T009 | 滞在の永続状態・退出優先 | DONE | P0 | T008 |
| T010 | 背景観測・静止更新の接続 | IMPLEMENTED | P2 | T008/T009 |
| T011 | 公開集約・気配の分割/失効計算 | DONE | P0 | T008 |
| T012 | 入街・退出シートと権限案内 | DONE | P1 | T006/T009 |
| T013 | Homeの参加予定・募集一覧 | DONE | P1 | T006/T014/T016 |
| T014 | 募集ピン一式 | DONE | P1 | T006/T008/T029 |
| T015 | イベント作成・地点選択 | DONE | P1 | T006/T029 |
| T016 | イベント詳細・参加/取消 | DONE | P1 | T015 |
| T017 | 主催者編集・中止・参加者一覧 | DONE | P1 | T016 |
| T018 | アプリ内重要通知・配信待ち管理 | DONE | P1 | T016/T017/T029 |
| T019 | 実プッシュ配信 | BLOCKED | P3 | T018 |
| T020 | チャット送受信・履歴・拡大UI | DONE | P1 | T004/T006/T029 |
| T021 | 名前付き入街ログのチャット接続 | DONE | P1 | T004/T008/T020 |
| T022 | 投稿削除・ブロック | DONE | P1 | T014/T020 |
| T023 | 通報受付・証拠管理 | DONE | P1 | T014/T015/T020/T029 |
| T024 | 運営認証・通報対応・制限/解除 | DONE | P1 | T023/T029 |
| T025 | 運営の招待監督 | DONE | P2 | T003/T024 |
| T026 | ステッカー準備・登録ワークフロー | DONE | P1 | T006/T024/T029 |
| T027 | 街範囲公開・移設/交換/撤去 | DONE | P1 | T026/T008 |
| T028 | 実NFC読取・書込・照合の接続 | BLOCKED | P3 | T012/T026/T027 |
| T029 | 共通コマンド・上限・認可境界 | DONE | P1 | T001 |
| T030 | 全データの期限清掃・ログ保護 | DONE | P2 | T003/T004/T014/T018/T020/T023/T026 |
| T031 | 全画面・主要フローのローカル統合 | DONE | P2 | T003/T004/T005/T007/T012/T013/T014/T015/T016/T017/T018/T020/T021/T022/T023/T024/T025/T026/T027/T029/T030 |
| T032 | 本体iPhone・複数閲覧・性能確認 | IN_PROGRESS | P2 | T010/T031 |
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

- **状態・優先・要件**：DONE / P1 / R03/R16。依存：T002/T029。
- **実装対象**：招待リンク画面・招待テーブル・消費API。
- **完了条件**：参加者が7日・単回コードを発行し、認証後に一度だけ消費して会員化。7日5件上限、期限切れ・再利用・同時消費を拒否。
- **検証方法**：ローカル2利用者で発行→受領→登録、DB同時消費。
- **実装・検証根拠**：招待RPC/画面と共通受付を接続。invitations.test.mjsに再送・取消後の同一結果確認あり。旧testInvitationOnboardingの名前設定までの証拠と、新しい街pool登録必須フローは区別する。チェックポイント50で実DBの同時受領・5件上限、Release画面の発行→停止と共有表示消去を確認。チェックポイント60で現行の街pool写真保存を含む初回登録一巡と段階別再起動復帰がReleaseで成功。cp96で7日有効期間と期限切れ受領拒否・未会員の維持を実DB確認。既存の単回/再送/停止資格拒否、cp50実2接続消費と5件上限、cp60登録一巡を合わせDONE。T029の招待API認可は接続確認済み。未実装Realtime枠と実機通信断復帰はT029/T032に維持し、このタスクの既定条件には重複計上しない。

### T004 名前・本人アイコン設定

- **状態・優先・要件**：DONE / P1 / R03/R10/R16。依存：T002/T006。
- **実装対象**：初回プロフィール・Settings・profiles・Storage処理。
- **完了条件**：名前と本人画像を保存・再表示。2MB制限、縮小・再エンコード・メタデータ除去、所有者以外の更新拒否。過去投稿表示はQ09決定に従う。
- **検証方法**：画像処理の入力/出力確認、別アカウント更新拒否、設定往復。
- **実装・検証根拠**：profiles/非公開Storage/useProfile、avatar-smoke.mjs、初回名前設定のtestInvitationOnboarding成功。チェックポイント56/58で共通画像処理を使う街poolの標準写真選択→切り抜き→保存をReleaseで操作し、実Storageの512×512JPEG・39513bytes・EXIF等の領域なしを確認。チェックポイント59で本人画像の選択/保存/再起動後の再表示とpool非変更も確認。cp69/70でユーザーが実機の街画像/本人画像選択・切り抜き・保存・再起動後再表示を確認。本人画像更新13:33:13Z・98978bytesを実DB照合。変換/容量/メタデータ/所有権の既存検証を再利用しDONE。T006全体の未完了をこの接続済み画面の追加完了条件にしない。

### T005 アカウント例外・復旧・退会

- **状態・優先・要件**：DONE / P2 / R03/R17。依存：T002/T004/T030。
- **実装対象**：Settings・認証/資格の管理API。
- **完了条件**：Q01/Q08で採用するメール変更・紛失・旧端末失効・退会を明示し、採用分の導線と削除を接続。未決定を独断で実装しない。
- **検証方法**：採用フローの再認証・他端末・削除後アクセス確認。
- **実装・検証根拠**：初期監査E02/E03から進展。承認済みの新旧メール確認・再認証退会をaccount/withdraw画面とNative/Auth/DBへ接続。account-smokeの既存証拠とチェックポイント42の状態試験を参照。cp131で実Authの2セッション維持・退会後双方拒否・採用削除を確認。仮UI導線/状態試験と接続を照合し固定条件を完了。実機全操作は今回未確認なので実機達成へ加算しない。

- **cp131完了根拠**：最新の承認と実DB/実Auth確認は末尾cp130/131。過去の未確認記述はその時点の監査経緯。必要なローカル条件は解消、実機達成は別列のまま。

### T006 3タブ・画面遷移の骨格

- **状態・優先・要件**：DONE / P0 / R19。依存：T001。
- **実装対象**：Expo Router Home/Map/Settings・共通シート・開発用adapter。
- **完了条件**：既存Figmaに沿う3タブと全機能への導線、戻る・シート往復が操作可能。ここだけは明示したモック可。機能別完了とは区別。
- **検証方法**：画面一覧との照合、シミュレータで全導線を一巡。
- **実装・検証根拠**：初期監査E04から3タブ/各機能ルートへ拡張済み。チェックポイント43でJS内蔵Releaseの実OTP・再起動・Home/作成/地点選択・設定7画面往復に成功。cp118でイベント/運営等の後続証拠と現行呼出元を[NAVIGATION_ACCEPTANCE](NAVIGATION_ACCEPTANCE.md)へ対応付け。未確認のアカウント入れ子/接続画面もシミュレータで成功。機能別の未決条件は各タスクに残す。

### T007 Map画面・背景地図・現在地

- **状態・優先・要件**：IN_PROGRESS / P1 / R01/R10/R19。依存：T006/T011。
- **実装対象**：既存Map画面・Camera・単発測位窓口・街素材。
- **完了条件**：実際の街が読める地図、合意済みヘッダー・気配・ピン・現在地/追加ボタン。現在地移動だけで位置公開しない。Figmaと照合。タイル/素材はQ10で選ぶ。
- **検証方法**：表示画像、単発現在地で送信しない確認、未取得/0/通信断。
- **実装根拠・残作業**：MapLibreはmapStyle.tsのOpenFreeMap positronを読み、現在地/ピン追加ボタン・pool画像の気配・イベント/募集ピンを接続済み。画像がない枠のみ代替図形。初回監査のボタン欠落は解消。本番地図運用Q10、承認済みヘッダー画像列の描画確認とFigma外観照合が残る。

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

- **状態・優先・要件**：DONE / P1 / R04/R06/R19。依存：T006/T009。
- **実装対象**：indexの入街シート・トグル・NFC入力adapter。
- **完了条件**：背景共有説明→読取待ち/登録中/成功/取消、権限拒否・別端末・通信不明・退出待ちを表示。Figmaの状態遷移を維持。NFC入力だけ代用可。
- **検証方法**：シミュレータで成功/取消/拒否/退出を操作、成功演出がDB確定後。
- **監査根拠・再利用判断**：E04/E06。説明・読取待ち・登録中・成功・取消あり。チェックポイント65で実NFC経路もDB確定後に成功画面へ接続。cp77のFigma演出、cp96の取消/権限拒否、cp115の別端末、cp117の通信断退出と復旧を合わせて完了。実NFCはT028。

- cp77：円形待機/登録中/成功、スクロールとsafe areaを実装。シミュレータでOTP→開発入街→気配更新→再起動→退出→再起動OFF維持に成功。成功シートの画像も確認。当時未確認だった処理前取消/拒否/通信不明はcp96/115/117で補完。

### T013 Homeの参加予定・募集一覧

- **状態・優先・要件**：DONE / P1 / R12/R13/R19。依存：T006/T014/T016。
- **実装対象**：Home・一覧取得・詳細への遷移。
- **完了条件**：参加予定/募集中一覧、詳細/Mapへ移動。終了/中止/取消を除外し、過去参加履歴を作らない。
- **検証方法**：ローカルDBの作成/参加/終了が一覧へ反映、空/失敗表示。
- **実装・検証根拠**：home.tsx/useHomePinsからevent_list（mine_only）/recruitment_listへ実接続。詳細経由のMap導線あり。チェックポイント44/46/51でイベント参加取消・募集終了とHome反映、57で同期時計による期限除外を確認。cp93で初回取得失敗→loading終了/エラー→再取得成功、通信断後の期限除外を画面用hookで確認。現行Homeはerror時に空表示を重ねず、再読み込みボタンを接続。cp81の詳細/Map往復と合わせ既定完了条件を満たす。画面の全体外観はT006/T007、未確認のiPhone募集一覧はT032へ残す。T014/T016の実データ接続を確認済みで、T006全体の残る外観を重複条件にしない。

### T014 募集ピン一式

- **状態・優先・要件**：DONE / P1 / R06/R12/R16。依存：T006/T008/T029。
- **実装対象**：作成/詳細/編集/終了シート・Map・募集API/DB。
- **完了条件**：街内有効滞在で単発現在地を確認し同時1件。題名編集、20分/手動/退出終了、位置固定、再作成上限、旧要求で復活しない。
- **検証方法**：UI作成→編集→終了、二重作成/退出競合/期限/越権DB試験。
- **実装根拠・残作業**：007の作成/編集/終了API、usePinCreation/useRecruitmentDetail、Map/Homeへ接続。未確認送信復元・入力中の再取得/終了状態のhook検証あり。チェックポイント46でシミュレータReleaseの現在地確認→作成→編集→終了→Homeから消える→退出とDB終了を確認。cp93の実DB試験で精度/鮮度/街外/題名拒否・越権・同時1件・20分・編集時の地点/期限固定・期限後不可・手動終了/退出後の再送非復活・1分3件を確認。独立2接続で二重作成の一方だけ成功、退出と作成の競合後に公開0件、再送非復活を確認。既存の詳細hook試験とcp46の実画面往復を再利用しDONE。T029の未実装Realtime接続枠はこの作成APIの完了条件に重複計上せず、T029に維持。iPhoneでの募集操作はT032で未確認を維持。

### T015 イベント作成・地点選択

- **状態・優先・要件**：DONE / P1 / R13/R16/R19。依存：T006/T029。
- **実装対象**：作成シート・地点選択Map・events/API。
- **完了条件**：未入街でも題名/日時/地点/説明/定員を入力して作成。Map往復で下書き保持。90日/24時間/同時3件等を検査。定員等Q07を先に決定。
- **検証方法**：フォーム往復、入力境界、再送/所有権、作成ピン表示。
- **実装・検証根拠**：作成シート/地点選択Map/events/APIを接続。チェックポイント43/44で下書き保持と実DB作成、51で標準日時選択/キャンセル→地点選択→作成を確認。cp98で作成の題名/説明/定員/地点/過去・91日先/24時間/同時3件を実DB確認済み。Map上の作成ピンの表示を含む完了照合は残る。


cp109：cp69実機作成/地点/日時・cp98入力境界に加え、Release107/109で実DBイベントの題名/残時間/雲と斜め非常口/軸/接地点を描画確認。仮文字をSVGへ置換、白背景による軸埋没を修正。/tmp/yumegaoka-pin109.png。既定条件を満たしDONE。

### T016 イベント詳細・参加/取消

- **状態・優先・要件**：DONE / P1 / R13/R14/R19。依存：T015。
- **実装対象**：詳細シート・registrations・参加API。
- **完了条件**：詳細から参加/取消しHomeへ反映。開催中の空席可、終了/中止不可。最後の席で超過せず古い参加で取消を復活させない。一般利用者には他人の名簿を返さない。
- **検証方法**：2利用者の最後の1席、逆順/応答紛失、名簿越権、UI反映。
- **完了根拠**：event-flowの参加/取消・古い参加再送拒否・一般名簿拒否、event-concurrencyの実2接続の最後の席/開催中参加/中止競合、event-detail-stateの逆順・応答紛失を確認済み。cp69でiPhone参加→Home、通知詳細→取消→Home消失と実DBを照合。cp75で終了後の参加拒否も確認。依存T015の実作成/APIは既に接続・実機確認済みであり、T015に残る作成ピン外観・入力境界をこの詳細/参加タスクの未完了条件に重複計上しない。

### T017 主催者編集・中止・参加者一覧

- **状態・優先・要件**：DONE / P1 / R13/R14。依存：T016。
- **実装対象**：主催者画面・編集/中止/名簿API。
- **完了条件**：本人が編集/中止/名簿確認。定員を参加数未満にしない。終了/中止から再開不可。個別除名は作らず、一般利用者の直呼び拒否。
- **検証方法**：主催者/一般/運営で権限確認、編集競合、中止と参加競合。
- **完了根拠**：cp69でiPhoneの主催名簿/終了日時変更/中止とDB版3、cp74で非主催運営の実MFA→名簿（編集/中止ボタンなし）を確認。event-flowで一般名簿拒否・中止再送、event-concurrencyで中止/参加競合を確認。cp75で2参加者に対する定員1への変更拒否、古い編集revision拒否、非主催編集拒否、中止/終了後の編集拒否を実RPCで確認。除名UI/APIは追加していない。実機に未転送の運営名簿追加はシミュレータ/実APIで確認し、この権限・一覧操作に一律の再実機を追加しない。

### T018 アプリ内重要通知・配信待ち管理

- **状態・優先・要件**：DONE / P1 / R13/R14/R17。依存：T016/T017/T029。
- **実装対象**：通知一覧・outbox・配信adapter。
- **完了条件**：日時/場所変更と中止をアプリ内通知。Push拒否でも確認可能。変更とoutboxを原子的確定し、取消/削除後に宛先復活なし。外部Pushだけfake可。
- **検証方法**：DB変更→通知画面、重複/古い版/取消後再試行、24h削除。
- **実装・検証根拠**：通知一覧/outboxとmarkReadを接続済み。チェックポイント45で変更通知から詳細、中止通知の既読化と再起動後保持を実DBで確認。チェックポイント67で033のservice専用配信受付とmaintenance-workerの疑似アダプターを接続。参加取消/古い変更/中止24h/終了/利用停止/登録削除/lease回収/再試行を実DBで確認し、HTTPワーカーの疑似配信4件も確認。疑似配信はsimulated_atへ分離。cp69で実機の変更/中止通知と詳細遷移を確認。cp110の実2接続で同一通知のclaimロック排他/確定1回、recheck後の参加取消→simulate/retry非復活を確認。cp67の期限/再試行とcp69実機通知→詳細を合わせ、fake配信を許容する既定条件でDONE。外部送信開始後の配送取消保証はここでは証明せずT019の実provider検証。実PushはT019で保留。

### T019 実プッシュ配信

- **状態・優先・要件**：BLOCKED / P3 / R13。依存：T018。
- **実装対象**：APNs資格・トークン登録・配信provider。
- **完了条件**：同意したiPhoneへ重要変更を配信、拒否/無効token/再送を処理、本文に名簿/正確地点を含めない。
- **検証方法**：ADPと配信環境準備後、実端末で受信/拒否/無効化。
- **監査根拠・再利用判断**：E08からcp133で更新。APNs直接方式承認。038の端末登録/端末別受付、HTTP2送信、iOS許可/登録/通知遷移を実装。ローカルDBと疑似APNsで検証。実APNs・iPhone受信はADP待ち。詳細は[PUSH_DELIVERY](PUSH_DELIVERY.md)。

### T020 チャット送受信・履歴・拡大UI

- **状態・優先・要件**：DONE / P1 / R15/R16/R19。依存：T004/T006/T029。
- **実装対象**：Mapチャット・messages/API・購読/差分取得。
- **完了条件**：未入街でも本人名/画像で送受信、30日50件ページ。スクロール拡大/背景blur/入力保持、送信失敗再試行。50件超の切断差分も回復。
- **検証方法**：2クライアント送受信、履歴/再送/切断差分、キーボード/戻る操作。
- **実装・検証根拠**：StreetChat/useStreetChatと実DB/APIを接続。チェックポイント44で未入街の送信→再起動後表示→本人削除に成功。cp46で拡大/キーボード/下書きを確認。cp70で実機の送信→再起動表示→本人削除を確認しDB本文nullと照合。cp86で実DB/APIと画面用readChatWindowを結合し、125件の取得空白から156件を4ページで重複なく復元、削除の反映、別利用者の実送信を確認。cp111実Authの2クライアントでDB変更通知→双方のchat_list、片方切断中の投稿→再接続取得を確認。useStreetMap gateway.ready/changed→streetChanges→useStreetChat.load→readChatWindow→描画の現行経路を照合。cp86の125件空白、cp44/46/70の画面・実機証拠と合わせ既定条件を達成しDONE。2台実機の同時操作はT032で未確認を維持。

### T021 名前付き入街ログのチャット接続

- **状態・優先・要件**：DONE / P1 / R04/R15/R17。依存：T004/T008/T020。
- **実装対象**：arrival_logs取得・プロフィール結合・チャット行。
- **完了条件**：新規滞在だけ1ログ、本人名/画像で30日表示、更新/reuseは追加しない。ブロック対象。非公開visitへの追跡APIは作らない。
- **検証方法**：既存生成試験＋新規取得/描画/30日期限確認。
- **実装・検証根拠**：chat_read APIがarrival_logsと投稿を結合し、useStreetChat→StreetChatで本人名/画像と入街文言を表示。チェックポイント66のarrival-chat-flow.test.mjsで実入街→同じ受付の再送→滞在再利用→気配更新後も1行、現在名反映、ブロック/解除、30日期限、非公開visit IDを返さないことを確認。cp81の実DB接続Map画像で本人画像・名前・入街文言を確認し、基本統合は達成。cp94で現行useStreetChatの型からStreetChatのAvatar/名前/arrival分岐まで再照合。既定条件の取得・描画は接続済みなのでDONE。T020の一般的な複数閲覧/切断復旧を重複条件にせずT020に維持し、到達秒数や一律実機確認を新たな完了条件に加えない。実機全体確認はT032で未確認を維持。

### T022 投稿削除・ブロック

- **状態・優先・要件**：DONE / P1 / R15/R18。依存：T014/T020。
- **実装対象**：メニュー・ブロック一覧・削除/フィルターAPI。
- **完了条件**：本人/運営削除で本文消去・削除跡。ブロックでチャット/入街ログ/募集をサーバー取得から除外、解除可能。気配/人数/イベントは減らさない。
- **検証方法**：古い取得応答による復活、別経路取得、解除、越権拒否。
- **実装根拠・残作業**：サーバーの削除/ブロック取得フィルター、チャットメニュー、blocks設定、localBlocksによる募集/チャットの遅延応答除外を接続。チェックポイント44/47で本人削除、別利用者投稿のブロック/解除、運営削除をRelease UIと実DBで確認。cp70で実機の削除・ブロック・解除も確認。cp104でMap/Home/募集詳細のrecruitment_list/get→localBlocks、チャット/入街ログの取得後除外を照合。recruitment-flowでブロック時一覧空/直接取得not_found/人数維持/解除後再取得を実DB確認。cp66入街ログ除外と既存遅延応答試験、実機cp70を合わせDONE。イベント・気配に除外フィルターを掛けないコードも照合。

### T023 通報受付・証拠管理

- **状態・優先・要件**：DONE / P1 / R15/R17/R18。依存：T014/T015/T020/T029。
- **実装対象**：通報シート・reports・限定証拠保存。
- **完了条件**：投稿/募集/イベントから理由付き通報。通報者非公開、重複制限、削除済み対象も適切受付、証拠は運営のみ。
- **検証方法**：通報→受付→運営参照、一般利用者証拠取得拒否、削除競合。
- **実装・検証根拠**：report画面と010/019の通報API・証拠管理を接続。チェックポイント47で別利用者の投稿を通報→MFA運営で確認/削除/対応完了、証拠保持を実DBで確認。保持期限は承認・実装済み。cp70で実機の投稿通報→別シミュレータ運営の削除/対応完了を確認。cp112で実DBの募集/イベントをHome→詳細→通報→送信し受付画面を確認。DBでtarget_kind/target_id/reporter/reasonが一致。既存投稿通報/運営限定証拠/削除後保持の証拠と合わせDONE。

### T024 運営認証・通報対応・制限/解除

- **状態・優先・要件**：DONE / P1 / R16/R18。依存：T023/T029。
- **実装対象**：運営画面・admin権限・制限API・監査。
- **完了条件**：運営だけ対応/削除/投稿制限/利用停止/解除。理由/90日監査。投稿制限で滞在を消さず、利用停止では終了、解除で復活なし。Q09認証/Q07波及に従う。
- **検証方法**：一般ユーザーAPI直呼び、停止と更新、既存接続と取得、操作監査。
- **監査根拠・再利用判断**：初期監査E09の未実装から進展。運営MFA・通報/削除/制限API、運営画面を実装済み。useModerationの状態管理試験はチェックポイント40参照。MFA/通報対応はシミュレータ確認済み。cp126/127で制限/解除を含む画面・滞在状態・監査を確認。Q09解決済み、Q07も承認とcp130の実DB確認で解消しDONE。

- **cp131完了根拠**：最新の承認と実DB/実Auth確認は末尾cp130/131。過去の未確認記述はその時点の監査経緯。必要なローカル条件は解消、実機達成は別列のまま。

### T025 運営の招待監督

- **状態・優先・要件**：DONE / P2 / R03/R16/R18。依存：T003/T024。
- **実装対象**：招待関係・発行/使用一覧・追加/無効化UI/API。
- **完了条件**：発行者/使用状況を運営が確認し無効化・枠追加/停止。有効利用者の招待関係を監督できる。
- **検証方法**：運営/参加者の権限、失効と消費競合、一覧反映。
- **監査根拠・再利用判断**：useOperatorDashboard、admin、MemberRowで招待一覧・無効化・招待枠保存/停止を実APIへ接続。032のページング試験済み。cp88/89でMFA付き実UIの招待枠変更/復元・発行停止/再開、一覧の発行者確認・専用招待無効化を確認。DBで対象一致も照合。cp105で実DBの使用済招待101件を準備し、MFA運営画面の発行者→受領者表示・続きを表示→101件目をXCTestで確認。専用fixture削除、運営資格復元済み。既存枠変更/無効化と032ページング認可証拠を合わせDONE。iPhone運営一巡はT032。

### T026 ステッカー準備・登録ワークフロー

- **状態・優先・要件**：DONE / P1 / R11/R18。依存：T006/T024/T029。
- **実装対象**：運営登録画面・tags/placements/provisioning・NFC adapter。
- **完了条件**：下書き→書込→再読取照合→設置確認→公開待ち。失敗/通信断から同操作を再開、未照合を有効化しない。物理読書のみfake可。
- **検証方法**：fakeタグで成功/容量不足/照合不一致/通信断、一般権限拒否。
- **監査根拠・再利用判断**：useStickerRegistrationとstickers/[id]が下書き/書込/照合/設置/再取得/編集/取消を実APIへ接続。testOperatorStickerPreparationで通常のfake NFC一巡を確認済み。cp113で実DB不一致拒否/同一操作再送、hook容量不足/通信応答紛失復旧、既存Releaseの照合待ち→一覧へ戻る→再開→設置/取消を確認。物理読書fakeを許容する既定条件でDONE。エラー注入はhook層、実UIは再開導線の確認という証拠範囲を区別。実タグはT028。

### T027 街範囲公開・移設/交換/撤去

- **状態・優先・要件**：DONE / P1 / R11/R18。依存：T026/T008。
- **実装対象**：運営Mapプレビュー・凸包/版公開API。
- **完了条件**：3点以上凸包プレビューと一括公開。設置/範囲版を原子的更新、移設中停止/交換旧ID廃止/撤去。地点不足は旧範囲保持。変更だけで全員退出しない。
- **検証方法**：凸包退化/同時編集/応答紛失、旧commit拒否、次観測で新版適用。
- **実装・検証根拠**：運営Mapプレビュー・範囲公開・交換APIを実装済み。チェックポイントの運営UI試験で3点の準備/公開と旧ID廃止を確認。cp114で退化・競合公開拒否と新版観測を確認。PresenceEngineの最新範囲取得と判定を照合。実NFCはT028、実機背景観測はT010/T032。

### T028 実NFC読取・書込・照合の接続

- **状態・優先・要件**：BLOCKED / P3 / R04/R11。依存：T012/T026/T027。
- **実装対象**：実機NFC adapter・署名・実ステッカー。
- **完了条件**：ADP署名iPhoneで実読取入街、書込/再読取/設置/公開。取消/失敗/容量不足で誤確定しない。開発代用が本番へ露出しない。
- **検証方法**：実タグで利用者/運営フローを一度ずつ、失敗条件確認。
- **監査根拠・再利用判断**：E10。Ndef read/write呼出しは存在。ADPと機種/保護方針待ち。

### T029 共通コマンド・上限・認可境界

- **状態・優先・要件**：DONE / P1 / R03/R16/R18。依存：T001。
- **実装対象**：各APIの共通guard・頻度/接続枠・受付記録。
- **完了条件**：要件8章の文字/投稿/取得/招待/ピン/接続上限をサーバーで強制。新規作成のD02期限を決定し、重複記録削除後の再送で再生成しない。
- **検証方法**：上限境界と並行要求、資格停止、他人ID/権限偽装、再送。
- **実装・検証根拠**：005/011/014/027の共通コマンドと各機能APIに上限・認可を実装。10分受付/受付後24時間の最小結果保持と取消を接続。cp104で[LIMIT_ACCEPTANCE](LIMIT_ACCEPTANCE.md)へ全上限・認可・並行要求を対応付けた。受付削除後再送の追加実DB確認も成功しDONE。画面一巡T031・実機T032・クラウドT033は別条件として維持。

### T030 全データの期限清掃・ログ保護

- **状態・優先・要件**：DONE / P2 / R17。依存：T003/T004/T014/T018/T020/T023/T026。
- **実装対象**：cleanup・Storage・通知/証拠/端末キャッシュ清掃。
- **完了条件**：要件9章の全対象を期限後非公開・期限内物理削除。募集が長い有効滞在に属しても終了後24hで消す。通報/運営/セキュリティログを分離。バックアップ運用はT033。
- **検証方法**：対象ごとの期限境界・親子削除・再試行/復元時の抑止。Q08を先に決定。
- **実装・検証根拠**：008/019/026/031とmaintenance-workerで機能データ・証拠・画像の期限清掃を接続。チェックポイント41で未公開pool24時間期限とStorage実削除を確認。68でイベント関連24hの連鎖削除、チャット30日、通報180/30日、運営90日、未完了下書き7日をworker入口から確認。cp119〜125で全期限表/worker/端末コピー・HTTPキャッシュを確認。Q08はcp131で採用削除を確認しDONE。本番常時稼働/バックアップはT033。

- **cp131完了根拠**：最新の承認と実DB/実Auth確認は末尾cp130/131。過去の未確認記述はその時点の監査経緯。必要なローカル条件は解消、実機達成は別列のまま。

### T031 全画面・主要フローのローカル統合

- **状態・優先・要件**：DONE / P2 / R01/R03〜R19/R21。依存：T003/T004/T005/T007/T012/T013/T014/T015/T016/T017/T018/T020/T021/T022/T023/T024/T025/T026/T027/T029/T030。
- **実装対象**：利用者/主催者/運営の全導線。
- **完了条件**：ローカル実DBで招待→登録→閲覧→入街→気配→募集/チャット→イベント参加/変更通知→退出、運営登録/対応を一巡。実NFC/Pushのみ明示adapter代用可。未接続UIを完成扱いしない。
- **検証方法**：役割別通し操作、主要失敗/権限/期限、Figma比較。既存成功テストは関連変更時のみ。
- **監査根拠・再利用判断**：E04〜E11。最初の一本の分割確認を再利用。イベント/募集/チャット/制限/ブロックの画面間接続を実施し、全機能通し確認に着手。未接続/未確認は各タスクとTECH_VALIDATIONに残す。

### T032 本体iPhone・複数閲覧・性能確認

- **状態・優先・要件**：IN_PROGRESS / P2 / R01/R09/R20/R21。依存：T010/T031。
- **実装対象**：実機・閲覧端末・限定負荷計測。
- **完了条件**：本体でロック歩行/静止/権限/通信断OFF/再起動/10分欠測を記録し他画面と照合。Q11で性能条件を確定し測定。投稿なしで気配を感じる体験確認。NFCはT028で別確認。
- **検証方法**：変更をまとめた実機1巡＋対象負荷試験。電池0%を保証扱いしない。
- **監査根拠・再利用判断**：E06/E12。隔離試作の歩行記録あり。製品はPersonal Team Debugのインストール/起動実績あり、最新UIの実機一巡は未確認。ユーザー指定のJS内蔵Release構成とまとめた実機ビルドに着手。

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
| 実Push資格・配信設定 | T019 | APNs直接方式確定、ローカルワーカー/登録と疑似APNs検証 | ADP/APNs鍵・署名・実端末前 |
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

## 実装チェックポイント52：イベント入力の修正導線
- T015/T017/R13/R19：作成・編集の送信前に共通eventInputErrorで終了>開始、開催24時間以内、定員整数1〜100を検査。作成の送信内容固定より前に検査し、不正入力は編集可能なまま返す。未来日時や開催状態などサーバー時計が必要な条件は従来どおりサーバーが判断する。
- tests/event-input.test.mjsの2件成功（日時/24時間境界、定員境界）。typecheck/Lint成功。呼出順をコードで確認。入力エラーから再送する実画面試験は未実施。純JSの変更のためネイティブ再ビルド・実機転送はまとめた次回へ回す。
- 画像の切り抜き・2MB以内への変換はチェックポイント49で実装済み。iPhoneへ未反映であること、元の保存エラーの原因は未確定であることを維持。帰宅後の写真保存確認が必要。
- DONE5/IMPLEMENTED9/IN_PROGRESS16/TODO0/BLOCKED3、完了15.2%、実装到達42.4%を維持。次：残る画面接続と実機での画像保存確認。pushなし。

## 実装チェックポイント53：運営の制限終了日時と画面分割
- T024/T025/R16/R18/R19：参加者管理の終了日時テキスト欄を、検証済みEventDateFieldの標準日時選択へ接続。確定したISO日時を従来のoperator_chat_restrictへ送信し、未来日時のサーバー検査・理由・MFA要件は変更しない。
- MemberRowをcomponentsへ分離し、members画面は一覧取得・ページング・描画に限定。操作内容、確認ダイアログ、退会済み操作禁止は維持。
- typecheck/Lint、git diff --check成功。既存日時選択のRelease証拠はチェックポイント51。今回の運営画面で選択→制限の実操作は未確認。ネイティブ変更がないためビルド・実機転送は次回へまとめる。
- DONE5/IMPLEMENTED9/IN_PROGRESS16/TODO0/BLOCKED3を維持。次：運営の招待一覧の続き取得（現状UIは最初の100件）、古い応答の画面復帰対策、帰宅後の画像保存確認。pushなし。

## 実装チェックポイント54：運営招待一覧のページング・遅延応答
- T024/T025/R03/R16/R18：admin画面からuseOperatorDashboardへ認証・取得・操作を分離。100件以降の「続きを表示」を接続。重複IDを追加しない。画面離脱/新しい取得で古い一覧応答を破棄し、遅いMFA登録応答も設定キーを復活させない。二重操作はrefで抑止。
- migration032をローカル適用。operator_invitesはcreated_atとidの降順複合カーソルを使用。同時刻の招待が100件境界に並んでも取りこぼさない。既存の運営MFA認可・委譲チェーン・無効化監査は維持。
- 無効化応答不明でも一覧再取得。取得失敗時は運営一覧/集計を閉じる。typecheck/Lint、状態試験3件成功。operator-access実DB試験成功：同時刻105件を重複なし全件取得、運営資格/MFA失効拒否。fixtureはrollback済み。
- ネイティブ変更なし。画面での複数ページ操作は次回のまとめたReleaseで確認する。ビルド/実機転送/pushなし。DONE5/IMPLEMENTED9/IN_PROGRESS16/TODO0/BLOCKED3維持。次：運営画面の統合操作、ユーザー帰宅後の画像保存確認。

## 実装チェックポイント55：運営変更をまとめたRelease統合
- T024/T025/T031/R16/R18/R19：チェックポイント52〜54の変更をまとめてJS内蔵シミュレータReleaseを生成・インストール。ビルド成功 /tmp/yumegaoka-operator54-release.log。Metro不要。
- testOperatorMemberDateSelection成功37.594秒。専用アカウントで実TOTP登録→追加認証→ステッカー画面→運営へ戻る→参加者管理→制限終了日時のキャンセル（未設定維持）→選択確定→運営一覧復帰→再取得を確認。終了日時のAPI送信や招待100件超の画面スクロールはこの試験に含まない。結果 /tmp/yumegaoka-operator-member54.xcresult、同名.log。
- 試験後に専用ローカルアカウントの一時運営資格・TOTPを解除。実機転送/写真保存の手動確認は未実施。完了件数は維持、DONE5/IMPLEMENTED9/IN_PROGRESS16/TODO0/BLOCKED3。
- 次：画像処理のネイティブ側の確認、残る主要画面フロー。iPhoneは旧版のままであり、最新版インストールと写真保存は帰宅後。pushなし。

## 実装チェックポイント56：実写真選択・切り抜き・保存とメタデータ除去
- T004/T031/R03/R10/R17/R19：既存Releaseを再利用し、シミュレータ写真ライブラリへ同梱icon.pngを追加。testStreetIconPhotoSelectionで標準写真選択→切り抜きChoose→保存を確認（15.500秒）。実DBの新しい公開画像とStorageを照合し、JPEG512×512、39713bytesを確認。結果 /tmp/yumegaoka-photo-save56.xcresult。
- 初期のUI構造調査は保存確認ではない。写真UIの読み込み前座標タップは進まず、PXGGridLayout-Infoの出現待ちへ修正。途中の長い実行時間はMac停止を含むため性能根拠に使わない。以後は試験コマンド内だけcaffeinateを使用。
- 保存した実画像にEXIF領域が残ることを発見。再エンコードだけで除去済みと扱わず、送信直前にJPEGのAPP1（EXIF/XMP）・APP13・コメントを除くstripJpegMetadataを接続。ICCと圧縮画像データは保持し、再圧縮しない。実出力への適用で39513bytes、EXIF署名なし、512×512JPEGの読取成功。
- 画像変換4件＋メタデータ除去2件、typecheck/Lint成功。変換試験はstub、メタデータ試験はバイナリ処理。除去追加後のRelease再ビルド・実機転送はまだ実施していない。上記UI保存成功は除去追加前の版。iPhone実写真・大きな写真・切り抜き位置変更の確認は残す。
- DONE5/IMPLEMENTED9/IN_PROGRESS16/TODO0/BLOCKED3維持。次：更新した画像処理をまとめたReleaseへ収録、残る画面統合。pushなし。

## 実装チェックポイント57：Homeの表示期限を接続
- T013/R12/R13/R19：Homeの参加予定・募集にサーバー同期時刻＋端末の単調時計による期限判定を接続。取得時と表示中の1秒tickで終了/期限切れを除外し、ネットワーク再取得失敗でも残り続けない。端末の壁時計変更で期限を判断しない。中止・退出などサーバーでしか分からない変更は従来の再取得で反映する。
- home-expiry.test.mjs成功：一覧受領→通信失敗→募集期限→イベント終了→古い項目を含む応答でも非復活、画面離脱時timer解除。hookと通信stubであり、実機の通信遮断試験ではない。typecheck/Lint、git diff --check成功。
- ネイティブ変更なし。EXIF除去と合わせた次回Releaseへ含める。今回ビルド/実機転送なし。DONE5/IMPLEMENTED9/IN_PROGRESS16/TODO0/BLOCKED3維持。次：残る画面統合とまとめたRelease確認。pushなし。

## 実装チェックポイント58：送信前メタデータ除去のRelease確認
- T004/T031/R03/R10/R17/R19：EXIF除去とHome期限表示をまとめたReleaseビルド成功 /tmp/yumegaoka-image58-build.log。Homeの期限はチェックポイント57のhook試験が根拠であり、今回UIでの通信断/期限超過は試していない。
- 既存写真保存runnerをtest-without-buildingで再利用。標準写真選択→切り抜きChoose→保存が16.621秒で成功 /tmp/yumegaoka-photo-save58.xcresult。同時刻に作成された専用アカウントの公開画像を実Storageから読み、512×512JPEG・39513bytes・APP1/APP13/COMなしを確認。前回の画像を再利用した結果ではない。
- T004をIMPLEMENTEDへ。縮小/圧縮/明示的メタデータ除去/Storage保存のコードと一部ネイティブ実行証拠が揃った。大画像、任意領域へ切り抜き移動、本人画像設定往復、実機写真は未確認のためDONEではない。
- DONE5/IMPLEMENTED10/IN_PROGRESS15/TODO0/BLOCKED3。完了5/33=15.2%、実装到達15/33=45.5%。実機のインストール済み版は更新していない。次：本人画像設定と登録の残るフロー、ユーザー帰宅後の実機写真保存。pushなし。

## 実装チェックポイント59：本人プロフィール画像の保存・復元
- T004/T031/R03/R10/R17/R19：既存Releaseを再利用。testProfilePhotoPersistence成功25.215秒。Settings→プロフィール→写真選択→切り抜き確定→保存表示→再起動→プロフィールで名前維持を確認。再起動後の画像もスクリーンショットで目視確認 /tmp/yumegaoka-profile59.png。
- 本人画像の実Storageは512×512JPEG・39513bytes、更新時刻は今回の操作と一致。街poolのcreated_atはチェックポイント58のままで、本人画像変更がpoolを上書きしないことを確認。結果 /tmp/yumegaoka-profile59.xcresult。
- 本体ビルドなし。UI runnerだけ追加。実機写真・大画像・任意切り抜き位置は未確認。DONE5/IMPLEMENTED10/IN_PROGRESS15/TODO0/BLOCKED3維持。次：初回pool登録までの一巡と残る統合。pushなし。

## 実装チェックポイント60：招待からpool登録・Mapまでの一巡
- T003/T004/T006/T031/R03/R10/R19：testInvitationOnboardingを現在の標準写真編集に合わせ、画像要素待ち→Chooseを接続。旧開発版向けの無条件中央タップがチャットを開くため、当該試験だけ停止して不要操作を削除。本体変更/再ビルドなし。
- 修正後のRelease統合試験成功67.309秒。新規ローカルOTP→招待受領→名前未設定で再起動復帰→名前設定→pool未登録で再起動復帰→写真選択/切り抜き/公開→Map→再起動後Map→Settings当日画像確認→ログアウト。結果 /tmp/yumegaoka-onboarding60-fixed.xcresult。
- 実DB照合：専用招待が消費され、有効会員・Onboarding visitorプロフィール・有効pool・39513bytesのStorage画像が保存済み。シミュレータは終了時ログアウト状態。iphone-validation@example.testのデータは保持し、実機のログイン状態は変更していない。
- 完了条件の実機通信断/依存T029の最終照合は残す。DONE5/IMPLEMENTED10/IN_PROGRESS15/TODO0/BLOCKED3維持。次：残るアカウント例外/運営・上限の統合確認。pushなし。

## 実装チェックポイント61：退会受付の期限切れ・再試行
- T005/R03/R17：withdraw_confirmのattempt_expiredを一般通信失敗と分離。古い受付ID・入力コード・再認証済み状態を消去し、本人確認コード送信へ戻す。応答紛失では受付を保持し、同一IDで結果を再確認する既存方式を維持。
- withdrawal-state.test.mjs 3件成功：期限切れで新しい本人確認へ、確認応答紛失後に消費済みOTPを使い直さず同じ受付で再試行、退会確認済み後のlogout失敗で退会処理を重複しない。hook/native stubによる状態試験であり実機退会操作ではない。
- typecheck/Lint、差分検査成功。サーバー変更なし、無関係なDB/Storage試験は再実行せず。ネイティブビルド/実機転送は次回へまとめる。DONE5/IMPLEMENTED10/IN_PROGRESS15/TODO0/BLOCKED3維持。次：アカウント例外の実画面接続、残る運営統合。pushなし。

## 実装チェックポイント62：チャット上限と再送の実DB照合
- T020/T029/R15/R16：chat-limits.test.mjsを追加。500文字成功/501文字拒否、10秒5件後の6件目拒否、1分20件後の21件目拒否、履歴10秒5回後の6回目拒否を実public.street_api経由で確認。1分窓の試験は完了したbatchの履歴時刻を15秒前へ移し、実時間待機を省いた。
- 成功済み送信の再送は同じIDを返し、上限到達後も追加課金せずrequest_limits5件/投稿件数20を保持。fixtureはrollback。初回は必須プロフィールを用意しておらずinvalid_inputで失敗し、fixture修正後成功。製品側の不具合と扱わない。
- 対象の並行送信上限はこの逐次試験で保証しない。T029の他機能/接続上限照合も残る。製品コード変更なし、型/Lint/ビルド/実機転送の反復なし。DONE5/IMPLEMENTED10/IN_PROGRESS15/TODO0/BLOCKED3維持。次：共通APIの残る接続上限と並行要求の照合。pushなし。

## 実装チェックポイント63：履歴並行上限と接続上限の不足
- T020/T029/R15/R16：chat-read-concurrency.test.mjs成功。4回使用済みの同一アカウントから2DB接続で履歴取得し、両方が同じ会員行ロックを待つことを確認後解放。1件成功/1件rate_limited、使用履歴5件。fixture清掃済み。送信側の並列試験と同一視しない。
- 要件8章のアカウント3本のRealtime接続上限は未実装と判明。端末のclient/channel1本とSupabaseプロジェクト上限では代替できない。OPEN_QUESTIONS Q12へ方式の不足と代案/影響を記録。ユーザー外出中の判断は保留し、仕様は変更しない。
- 製品コード変更なし。ビルド/型/Lint/実機転送を再実行せず。DONE5/IMPLEMENTED10/IN_PROGRESS15/TODO0/BLOCKED3維持。T029全体は他の作業がありIN_PROGRESSのまま。次：独立して進められる残る画面統合、帰宅後Q12相談。pushなし。

## 実装チェックポイント64：通知画面復帰と既読の競合
- T018/T031/R14/R19：useNotificationsの画面世代と一覧要求番号を分離。離脱前の要求が残っていても画面復帰で新しい一覧を取得し、古い応答/完了が新しい取得を上書きしない。既読操作はrefで二重送信を抑止し、既読成功時に古い一覧を無効化する。
- notifications-state.test.mjs 2件成功：遅い旧要求を残して復帰→新しい応答が優先、二重タップ1回送信→遅い未読一覧で既読非復活。hookの通信stub試験であり実機通信遅延試験ではない。型/Lint、差分検査成功。
- サーバー/APIは変更せず。ビルド/実機転送は退会期限復帰などと次回へまとめる。DONE5/IMPLEMENTED10/IN_PROGRESS15/TODO0/BLOCKED3維持。Q12は帰宅後相談、今回の作業を妨げない。次：残る主要画面統合。pushなし。

## 実装チェックポイント65：実NFC経路の成功画面・Homeの状態訂正
- T012/T028/R04/R19：scan経路がnative.checkin成功後にsheetを閉じていた差を修正。開発経路と同じsuccessへ進む。キャンセル後に成功を出さない判定・DB確定前のcheckingは維持。実NFC実行はADP待ちで未検証。
- T013の古い「画面/APIなし」を撤去。home/useHomePins、event_list/recruitment_list、詳細→Map導線と既存チェックポイント44/46/51/57の根拠を照合しIMPLEMENTEDへ訂正。全実機/空/通信失敗UIは未確認でDONEにはしない。
- 型/Lint、差分検査成功。ビルドは通知/退会の変更と次回まとめる。DONE5/IMPLEMENTED11/IN_PROGRESS14/TODO0/BLOCKED3。完了15.2%、実装到達16/33=48.5%。pushなし。


## 実装チェックポイント66：最新Releaseの通知統合と入街ログの接続確認
- T017/T018/T021/T031/R04/R14/R15/R19：a5b7e81を含む変更をまとめてJS内蔵Releaseへ反映。シミュレータビルド成功。登録済み専用アカウントのOTP/画面復帰試験77.998秒、主催者編集→変更通知→詳細→中止通知→既読→再起動後保持48.660秒で成功。/tmp/yumegaoka-login66.xcresult、/tmp/yumegaoka-notifications66.xcresult。今回のイベントの中止通知read_atも実DBで照合。
- arrival-chat-flow.test.mjs成功。実APIで入街し、受付再送/滞在再利用/気配更新後も閲覧者へ入街ログ1件。現在名反映、ブロック/解除、30日期限、visit ID非公開を確認。全fixture rollback。画像描画/実機/全Realtime到達はこのDB試験の対象外。
- T021の古い「読取APIと画面なし」をコード根拠付きで置換しIMPLEMENTEDへ訂正。分母変更なし。DONE5/IMPLEMENTED12/IN_PROGRESS13/TODO0/BLOCKED3。完了15.2%、実装到達17/33=51.5%。DONE増分0。
- 本体の無関係なDB試験・型/Lintは再実行せず（製品ソースは前回確認後未変更）。今回のビルドは通知/退会/NFC成功画面の変更をまとめたもの。iPhone転送・実NFC・実Pushは未実施。pushなし。
- 再開地点：T021の名前/本人画像を含むMap描画、T018の配信待ち期限/宛先条件、T031の残るアカウント/運営フロー。iPhoneは古い版のため、次の実機節目に切り抜き/圧縮を含むReleaseへ更新する。Q12は帰宅後相談。


## 実装チェックポイント67：通知outboxとローカルワーカーの接続
- T018/T030/R13/R14/R17：033をローカル適用。service専用notification_deliveryを追加し、通常利用者からは実行不可。claim→recheck→simulate/retryをmaintenance-workerへ接続。宛先の資格/登録/最新通知/イベント終了・中止期限を各処理で再確認。旧leaseは成功扱いにせず、1分のlease回収と最大5分までの再試行間隔を内部処理として追加。
- 実配信未実装を隠さず、simulated_atとdelivered_atを分離。ログは件数のみ。通知ID/イベントID/宛先/種別だけをadapterへ渡し、名前・本文・地点・名簿は渡さない。今回のsimulate処理は外部へ送信しない。
- notification-delivery.test.mjs成功。実DB/RPCで再試行/旧lease拒否、参加取消、中止による旧通知破棄、中止24h、最新通知優先、終了、登録削除、利用停止、ワーカー中断後の回収、通常会員拒否を確認。fixture rollback。HTTP経由maintenance-worker --once成功：疑似配信4件、画像/退会清掃0件。実Push成功ではない。
- T018をIMPLEMENTEDへ。DONE5/IMPLEMENTED13/IN_PROGRESS12/TODO0/BLOCKED3、完了15.2%、実装到達18/33=54.5%。分母変更なし。多ワーカー並行・外部配送中の取消競合・実Push・継続稼働保証は未確認。ネイティブ変更なしのためビルド/実機転送は省略。pushなし。
- 再開地点：T030の保存期限全体とワーカー稼働の照合、T031残る利用者/運営フロー。iPhoneへ最新画像修正版を転送する節目は別途まとめる。

チェックポイント67運用追記：旧ローカルworker PID49934の稼働を確認してTERMで停止し、新版を1プロセス起動。/tmp/yumegaoka-maintenance67.logで初回周期（疑似配信0件・清掃0件）の正常完了を確認。Mac停止後の自動復帰や常時稼働の保証ではない。


## 実装チェックポイント68：保存期限の統合とiPhone更新準備
- T030/R17：feature-retention.test.mjs成功。service_roleのmaintenance_jobs(cleanup)から構成された清掃関数を通し、期限前後26行を照合。終了/中止24hのイベント・登録・通知・outbox連鎖削除、チャット30日、未対応通報180日/対応済み30日、運営記録90日、未完了ステッカー7日を確認。未対応100日の通報は保持し、90日の整理対象を削除期限と混同しない。
- 全fixture rollback。清掃の常時稼働/バックアップ/外部Authログ/全データ種別を網羅する試験ではない。T030はIN_PROGRESSのまま。既存の仕様・製品コード変更はなし。
- T032：画像編集/圧縮、日時選択、通知/退会の修正をまとめてiPhone用Releaseの更新を開始。/tmp/yumegaoka-iphone68-build.log。ビルド完了・転送・実機操作は別途結果を記録する。
- DONE5/IMPLEMENTED13/IN_PROGRESS12/TODO0/BLOCKED3。完了15.2%、実装到達54.5%。pushなし。

チェックポイント68実機更新追記：iPhone用Releaseビルド成功、codesign --verify --deep --strict成功、main.jsbundle 3.5MiB同梱。検証用iPhoneへのinstall成功（/tmp/yumegaoka-iphone68-install.log）。画像切り抜き/圧縮・日時選択・通知/退会の修正を収録。devicectl起動は端末ロック（Locked）により拒否。インストール成功と起動成功を混同しない。帰宅後の手動起動・写真保存は未確認。


## 実装チェックポイント69：達成段階の分離と実機一巡開始
- 33件と従来ステータスを維持。実装18/33、統合16/33、実機2/33、DONE5/33をタスクごとの証拠から集計。部分成功は達成済み件数へ混ぜない。12件のIN_PROGRESSを実装/接続/検証/外部/判断の理由へ分類した。数値はユーザー引用時点から進展した現行値。
- ユーザーが最新版iPhoneでOTPログイン→街poolの写真選択/切り抜き/保存→アプリ終了/再起動後のログインと両画像維持を確認。街poolの実DB/Storageは今回作成時刻13:08:24Z、JPEG87994bytes。T002の実機達成を追加。
- 本人画像はDBの更新時刻が12:09:29Zのままで今回の新規保存を証明しない。T004 DONEと早く案内した点を訂正し、IMPLEMENTEDを維持。既存画像再表示と新規保存を区別する。
- 再ログインの原因は未特定。APIClientのlogoutはscope=localで、通常更新でログインを消す仕様ではない。今回の終了/再起動では再現しなかった。自動UI runnerは既存のPersonal Teamアプリ数上限のため、写真/画面操作をユーザーへ依頼しDB照合を自動化。別アプリ削除は行わない。
- 次：実機イベント作成→参加→Home→取消/中止、募集/チャット、入街/気配/退出、運営。細かな追加テストや本体再ビルドは今回行っていない。

cp69イベント追記：ユーザーがiPhoneで「実機確認」の日時/地点選択→作成→参加→Home表示を確認。実DB作成13:13:12Z、開始14:12Z/終了15:12Z、定員20、joined=trueを照合。T015の基本操作をDEVICE_VERIFIEDへ。T013/T016は一覧の取消反映などを継続確認中。T017/T018の主催編集・通知・中止一巡を依頼。

cp69主催操作追記：ユーザーが名簿の本人表示・終了時刻編集・中止後消失を回答。DBで終了15:15Zへ変更、版3、中止13:16:37Zを照合。変更通知が出なかったとの回答あり、T018実機達成は保留。現在の中止通知はDB保存済み・未読。アプリ内一覧と通知バナーの区別を確認中。


## 実装チェックポイント70：Settings導線の修正と自動試験の分離
- T006/T025/T031：Settingsのログイン・接続状態がMapへ戻るだけでモーダルを開かなかった不具合をUIで再現。panel=accountのルートパラメータで既存モーダルへ接続し、閉じる/ログアウトでパラメータを解除。Expo58公式Router仕様を確認。型/Lint成功。
- シミュレータReleaseへ修正を反映し、同じSettings→接続状態→ログアウト試験が成功（/tmp/yumegaoka-simulator-switch70-fixed.xcresult）。初回未修正版ではログアウト要素がなく失敗。iPhoneはcp68のまま、今回の導線修正は次のまとめた転送へ。
- 自動試験をsimulator-validation@example.testへ分離。prepare-ui-test --simulatorを追加し、運営資格/MFA初期化もこのアカウントに限定する運用をREADMEへ記載。iPhone手動確認のアカウントは変更しない。シミュレータ新アカウントのログインは実行中。
- T020/T024/T025/T026はコード未実装と検証不足を混同していたためIMPLEMENTEDへ訂正。チャットはcp44/46、fakeステッカー準備は既存UI一巡によりINTEGRATEDを記録。運営全操作/招待監督は統合未達のまま。追加検証なしでDONEへはしない。
- 実機cp69続報：ユーザーが変更通知→詳細→参加取消→Home消失を確認。対象DB joined=false、通知宛先0件。T016/T018をDEVICE_VERIFIEDへ。実装22/33、統合18/33、実機6/33、DONE5/33。従来ステータスDONE5/IMPLEMENTED17/IN_PROGRESS8/TODO0/BLOCKED3。分母変更なし。

cp70実機続報：ユーザーが本人画像の新規保存、チャット送信→再起動後表示→長押し削除の一巡成功を回答。本人画像13:33:13Z/98978bytes、投稿13:33:42Z/削除13:34:06Z/body=nullをDB照合。T004をDONE、T004/T020をDEVICE_VERIFIEDへ。実装22/33、統合18/33、実機8/33、DONE6/33。従来状態DONE6/IMPLEMENTED16/IN_PROGRESS8/BLOCKED3。次は実機入街→気配の結果待ち。

cp70実機/別運営連携追記：実機で開発入街は成功したが街外（ユーザー申告）で気配更新は0件。街内更新成功とはしない。OFF→人数減少→再起動後OFF維持を確認し、DBは13:38:29Z/manual終了・気配0。T009の実機達成を追加。ユーザーが別利用者投稿の通報/ブロック/解除を確認、通報spam・blocks0をDB照合。別のシミュレータ運営がMFA→通報→削除→対応完了を成功（/tmp/yumegaoka-device-report70.xcresult）、実DB resolved_at13:42:03Z/本文null。T022/T023実機、T024基本統合へ。実装22/33・統合19/33・実機11/33・DONE6/33。

### 次の実行方針（ユーザー就寝後）
ユーザーはiPhone実機確認をいったん後回しにし、全要求を操作できる実装をまとめて進めるよう指示。運営実機は認証アプリ未準備のため保留。追加質問/実機操作要求は出さず、画面・API・状態の不足をまとめて接続する。重大な権限/破損/退出復活は先に修正。既存の実機未確認をDONEには置き換えない。後でユーザーが全体を一巡できるReleaseと未確認一覧を用意する。

## チェックポイント71：運営一覧と登録完了導線（2026-10-31）

- T024/T025/R16/R18/R19：参加者管理をuseMembersへ分離。選んだ参加者の操作だけを展開し、100件以降を読み込んだ後の保存でも既読ページを再取得して保持。取得中の二重ページ追加を抑止し、画面離脱後の遅延応答で非公開一覧を戻さない。招待枠の整数0〜1000・投稿制限の未来日時を送信前にも検査（サーバー認可・検査は維持）。
- T026/T027/R11/R18：設置確認済みのステッカー詳細から街の範囲確認/公開へ接続。公開済みの場合も移設・停止へ進める。既存のプレビュー・公開RPCを再利用。
- T006/T012/R19：MapからStreetLogin/StreetEntrySheetを分離。ログインのスローガン・参加成功の不要な説明を削除し、背景共有とOFFの説明は維持。仕様・DB処理の変更なし。
- 検証：型チェック/Lint成功。members-state.test.mjsの2ケース成功（101件の一覧で保存後も対象維持、離脱後の遅延応答破棄）。全試験/ネイティブビルド/実機転送は変更をまとめるため未実施。画面実操作は未確認で、統合・実機・DONEへ加算しない。
- 進捗：コード22/33、統合19/33、実機11/33、DONE6/33、BLOCKED3/33。分母変更なし。次は残る画面接続・UI仕上げを継続し、変更をまとめた版でローカル一巡を行う。実機確認はユーザー再開後。

## チェックポイント72：画面一巡と運営名簿の接続（2026-10-31）

- T024/T025/T031：cp71をまとめたシミュレータReleaseビルド成功（/tmp/yumegaoka-operator71-build.log）。参加者の行を展開→制限日時選択/取消/確定→運営へ戻る試験が38.149秒で成功（/tmp/yumegaoka-operator71.xcresult）。実際の制限保存・利用停止の画面試験とは区別する。
- T006/T031：同じReleaseで3タブ→作成/地点選択→Settings各画面→Mapの一巡に成功（/tmp/yumegaoka-navigation71.xcresult）。最初は試験の期待文字列と実入力が一字違って失敗。修正後は地点選択前に取得した入力値と戻った後の値を比較し、下書き保持を確認。入力文字欠落の原因は未特定で、本体修正済みとは扱わない。
- T017/R13/R14/R18：運営に参加者一覧のAPI権限があるのに、画面では主催者の操作内にしかボタンがない未接続を修正。主催者または運営資格確認済みに名簿ボタンを表示。非主催者の取得は既存event_rosterのMFA/運営資格検査を必須とし、編集・中止権限は主催者だけを維持。認証不足時は運営の追加認証へ進める。
- 名簿変更の型/Lintとevent-detail-stateの4ケース成功（追加APIをモックが扱わず初回試験が待機終了したため、operator_statusの応答を明示して再実行）。名簿変更はcp71ビルド後のため画面統合未確認、次のまとめビルドへ含める。
- iPhone実機テスト/転送なし。実装22/33、統合19/33、実機11/33、DONE6/33、BLOCKED3/33を維持。新規DONEなし。GitHub pushなし。

## チェックポイント73：通報対象への導線とアイコン表示（2026-10-31）

- T023/T024/T031/R13/R18/R19：運営の通報一覧から、対象イベント/募集の詳細へ接続。既存operator_reportsのtarget_idを利用し、通報証拠と現在の公開状態を分けて確認できる。終了対象は既存詳細APIが拒否。新しい閲覧権限・保持延長は追加していない。種別/理由の内部コードを日本語表示へ変更。
- T004/T007/T020/R10/R19：Avatarで画像取得失敗時も代替表示を残し、認証トークンを再取得して一度だけ再試行。画像パス/版/bucket変更と離脱後の遅延応答を分離。画像失敗で気配の人数/期限を変更しない。実画像エラーの端末確認は未実施。
- T006/T012/R19：Mapの通常時の「未参加」「気配を観測中」はトグル/地図と重複するため常設表示から外し、接続状態画面に残す。通信不明・位置許可・退出待ち等は引き続き表示。開発NFCの説明は実際の入街操作に残す。UI試験のON/OFF確認は文言からトグル状態へ変更（当該試験未再実行）。
- 検証：型チェック・Lint成功、moderation-state.test.mjs3ケース成功。初回Lintのeffect警告/エラーは修正後に解消。全体ビルド・実機転送なし。cp72の運営名簿と今回の変更を次のまとめ版に含める。画面統合は未確認で達成率を加算しない。
- 状態：コード22/33（66.7%）、統合19/33（57.6%）、iPhone11/33（33.3%）、DONE6/33（18.2%）、BLOCKED3/33。分母変更なし。次は運営の通報→対象詳細→名簿と、画像/Map表示をまとめてローカル確認。iPhoneはユーザー再開まで保留。

## チェックポイント74：通報から運営名簿までの統合（2026-10-31）

- T017/T023/T024/T031/R13/R14/R18/R19：cp72/73をまとめたシミュレータReleaseビルド成功（/tmp/yumegaoka-integration74-build.log）。本体の再ビルドは今回1回。iPhoneへの転送・実機操作は行っていない。
- ローカル専用peerのイベントと参加登録・通報を実APIで準備し、別のsimulator専用アカウントでMFA→通報一覧→対象詳細→参加者一覧→通報一覧へ戻る操作に成功（testOperatorReportedEventRoster、/tmp/yumegaoka-roster74.xcresult）。運営に主催者の編集/中止ボタンが出ないことも確認。一般利用者への名簿非公開は既存API検査を維持。
- prepare-ui-testに--reported-eventを追加。iPhone手動アカウントは変更しない。試験後のsimulator運営資格/MFAは専用の--revoke-operatorで除去する。テスト作成イベント/通報はローカル専用データであり、本番操作ではない。
- 新しいAvatarとMap表示は同じビルドへ反映済みだが、画像取得失敗時の実画面確認は未実施。実機の背景観測・街内気配・募集・運営は引き続き未確認。
- 達成率：コード22/33、統合19/33、iPhone11/33、DONE6/33、BLOCKED3/33を維持。T017/T023/T024の既存統合達成の根拠を補強したもので、新しいタスク全体のDONEではない。次は残る実装不足と全体導線の仕上げを優先し、成功した当該フローは関連変更まで再実行しない。

## チェックポイント75：イベント参加・主催管理の完了判定（2026-10-31）

- T016/T017/R13/R14/R18：既存の実機・UI・並列DB・状態逆順の証拠を確認し、不足していた完了条件だけevent-flowへ追加。2人参加後に定員1への変更を拒否、古いrevisionの編集を拒否、一般参加者の編集を拒否、中止後/終了後の編集と終了後参加を拒否。全ケース成功。専用データはtransaction rollbackで廃棄。既存の成功済み並列試験やビルドは再実行していない。
- cp69の実機参加/取消/Home・主催者編集/名簿/中止、cp74の運営名簿接続と合わせ、T016/T017をDONEへ。T015の作成ピン外観等、別タスクの残りを重複した未完了条件にはしない。完了条件そのものは変更なし。
- 進捗：DONE8/33（24.2%）、IMPLEMENTED14、IN_PROGRESS8、TODO0、BLOCKED3。コード22/33（66.7%）、統合19/33（57.6%）、iPhone11/33（33.3%）。分母33を維持。今回新規DONEは2件。iPhone操作/転送/pushなし。
- 次はT006/T007/T012の画面仕上げとT031の残る導線。外部依存やユーザー判断待ちを独断で決めず、実装可能な部分を継続する。

## チェックポイント76：入街シートと画面正本（2026-10-31）
- T007/T012/R04/R06/R10/R19：円形の待機/処理中/成功表示、画面高上限とスクロール・下端safe areaを追加。処理中は不定進捗でDB確定前に成功を示さない。説明画面の取消は閉じるだけとし、処理開始後は既存の退出優先を維持。気配画像38pxに合わせ外枠を42pxへ修正。座標/人数/期限は変更なし。
- SCREEN_FLOW_REVIEWの古い3タブ未実装/初期Map未決定を本文で訂正し、承認済みpool登録を反映。
- 型/Lint成功。画面実操作・Figma外観照合は未確認。DB/ネイティブ変更なし、ビルド/実機転送なし。DONE8、IMPLEMENTED14、IN_PROGRESS8、BLOCKED3。コード22/33、統合19/33、実機11/33を維持。

## チェックポイント77：共通フォームのキーボード対応（2026-10-31）
- T002/T006/T031/R03/R19：PageのScrollViewでiOSのキーボード余白自動調整とドラッグで閉じる操作を有効化。プロフィール/アカウント/招待/運営等の共通入力画面へ適用。ログインもスクロール可能にし、メール/OTP入力後のボタンへ移動できる構造へ変更。Actionは無効状態をアクセシビリティにも公開する。
- RN0.88公式ScrollView仕様を確認（https://reactnative.dev/docs/scrollview#automaticallyadjustkeyboardinsets）。型/Lint成功。DB/認証方式は変更なし。cp76とまとめたシミュレータビルド・操作確認を実行中。現時点では画面確認済みとしない。iPhoneテスト/転送なし。

### cp77統合結果
まとめたReleaseビルド成功（/tmp/yumegaoka-forms77-build.log）。最初のUI試験は無条件の画面中央タップでチャットを拡大し、blurのidle待機に入ったことをスクリーンショットで確認して当該試験だけ停止。不要タップを除去し、本体再ビルドなしで再実行。testLoginEntryRestartExit成功（/tmp/yumegaoka-entry77-fixed.xcresult）：実OTP→開発入街→シミュレーション位置の更新→再起動→退出→再起動OFF維持。成功シートの円形表示と地図へボタンを画像確認。気配マーカーはシートに隠れており、今回の画像をMapマーカー描画完了の証拠にはしない。実歩行ではない。
T012をIMPLEMENTED/INTEGRATEDへ更新。DONE8、IMPLEMENTED15、IN_PROGRESS7、BLOCKED3。コード23/33（69.7%）、統合20/33（60.6%）、iPhone11/33（33.3%）、DONE8/33（24.2%）。実機転送/pushなし。共通フォームの全画面キーボード確認は未完。

## チェックポイント78：地図上チャットの行配置（2026-10-31）
- T007/T020/R15/R19：StreetChatの本人画像を左、名前・時刻・本文を右に配置。Figmaの行構成へ合わせ、縦積みによる地図の圧迫を軽減する。本文は残り幅で折り返す。長押し・削除・入街ログ・履歴取得の処理は変更なし。
- 型チェック・Lint成功。表示変更のみのためDB試験とネイティブビルドは省略。新しい行配置の画面確認は次のまとめたビルドで行う。iPhone操作・転送・pushなし。
- 達成段階は据え置き：コード23/33、統合20/33、実機11/33、DONE8/33、BLOCKED3。今回追加DONEなし。次は残る画面の既存仕様との接続・外観差分を継続する。

## チェックポイント79：招待画面の再試行と状態分離（2026-10-31）
- T003/T006/T031/R03/R19：招待の取得・発行・受領・取消をuseInvitationsへ分離。画面に一覧の読み込み/空状態/再読み込みを接続。期限切れの招待を明示し、共有UIの失敗を表示する。発行中はrefで二重操作を防ぎ、離画面/新しい取得より古い応答を反映しない。取得失敗時は共有コードと一覧を消し、再試行可能とする。
- invitations-state.test.mjs 3件成功（再訪後の逆順応答、二重発行と離画面後のコード非表示、取得失敗から再試行）。型/Lint成功。既存RPC・受付・保持期限は変更なし。DB試験の反復、ネイティブビルド、iPhone操作/転送、pushは省略。新しい画面配置と共有シートは未確認。
- 達成段階は据え置き：実装23/33（69.7%）、統合20/33（60.6%）、実機11/33（33.3%）、DONE8/33（24.2%）、BLOCKED3。追加DONEなし。招待全体の既存実機条件を満たしたとは扱わない。

## チェックポイント80：Home一覧から地図への導線（2026-10-31）
- T006/T007/T031/R13/R19：Figma81を再確認し、Homeの作成操作を見出し横へ、選択タブを下線付きへ変更。大きい文字でもタブが押し出されないよう横スクロール可能とした。PinListItemを共通化し、イベント/募集の詳細操作とは別に「地図を開く」を追加。実DBのピン座標を既存Mapカメラ移動パラメータへ渡す。未採用の第3タブや画像サンプルのユーザー情報は追加していない。
- 型/Lint/diffチェック成功。API/DB/認可/保持期限の変更なし。画面操作の統合確認とFigmaの最終外観照合は未実施。cp78〜80のJS変更は次のまとめたシミュレータビルドで確認する。iPhone操作・転送・pushなし。
- 実装23/33、統合20/33、実機11/33、DONE8/33、BLOCKED3を維持。今回追加DONEなし。

## チェックポイント81：Home・招待・チャット配置の統合確認（2026-10-31）
- cp78〜80をまとめたシミュレータReleaseビルド成功（/tmp/yumegaoka-ui81-build.log）。iPhoneには未転送。
- testInviteIssueRevoke成功（/tmp/yumegaoka-ui81.xcresult）：実DBの招待発行→共有コード表示→停止→共有コード消去。
- イベント初回試験は高速typeTextで題名が「UI event」から「Uevent」になり、作成後の題名一致で失敗。作成自体は成功し、UI階層に欠落題名が記録された。原因は未特定であり製品入力の問題を解消したとは扱わない。試験を1文字ずつ入力し直後に完全一致確認する形に変更。
- 失敗したイベント試験だけ本体再ビルドなしで再実行し成功（/tmp/yumegaoka-ui81-event-retry.xcresult）：入力一致→日時/場所選択→作成→参加→Home→地図を開く→Home→詳細→参加取消→中止。Homeの見出し横作成・下線タブ・ピン行と、Mapで対象イベントの表示・横並びチャット行を画像確認。実際の気配の表示証拠ではない（チェックイン0人）。
- T003/T006/T007/T020/T031、R03/R13/R15/R19。実装23/33、統合20/33、実機11/33、DONE8/33、BLOCKED3を維持。個別導線の証拠追加であり全画面/Figma完全一致ではない。次は入力欠落の原因調査と未完了導線。pushなし。

## チェックポイント82：ピン題名の入力更新（2026-10-31）
- T015/T031/R13/R19：cp81の高速入力欠落を調査。RN0.88同梱TextInput.jsではonChangeText呼出し後にlastNativeText/eventCountを更新する。pinDraftはuseSyncExternalStoreでそのコールバック中に同期再描画し得る構造だったため、画面の購読を通常のuseState/useEffectへ変更。共有下書きストア、地図選択からの復帰、送信済み内容の固定、logout時clearは維持。
- 原因候補に対する修正であり、OS/入力メソッドまで含む根本原因の断定ではない。UI試験を1文字ずつから元の高速typeTextへ戻し、入力直後の完全一致を維持。Releaseビルド（/tmp/yumegaoka-input82-build.log）、testEventCreateJoinCancel（/tmp/yumegaoka-input82.xcresult）成功。高速入力一致→地図選択後の題名一致→作成/参加→Home/Map→取消/中止まで通過。実機/日本語変換での入力は未確認。
- 型/Lint/diffチェック成功。既存成功済みの招待試験やDB全体は再実行せず、変更した入力フローだけ再確認。iPhone転送/pushなし。
- 実装23/33、統合20/33、実機11/33、DONE8/33、BLOCKED3を維持。全画面の完了条件を満たしたとはしない。次は未完了の画面・運営導線を継続。

## チェックポイント83：ステッカー登録の失敗・再開（2026-10-31）
- T026/T031/R11/R18/R19：ステッカー詳細の取得/書込後登録/照合/設置/編集/取消をuseStickerDetailへ分離。操作中の二重呼出しを防ぎ、離画面後のNFC結果で登録を進めず、遅れた取消応答で別画面から遷移しない。再取得失敗時は古い操作対象を消す。サーバーのrevision/運営MFA認可は変更なし。
- ステッカー一覧へ再取得・読み込みを接続。読み込み完了前の「登録なし」表示を止め、保留操作の復元中は入力/作成を無効化。
- sticker-detail-state.test.mjs 4件成功：NFC失敗後の再試行、読取中の離画面、二重操作と応答紛失後の再取得、取消応答後の不要遷移防止。hookの模擬RPCでの検証であり、実NFC/実通信断/画面再開完了の証明ではない。型/Lint成功。最後の読み込み中ガードは同じboolean条件の追加で、追加ビルドは省略。
- 実装23/33、統合20/33、実機11/33、DONE8/33、BLOCKED3を維持。UI再実行は次のまとめたシミュレータ確認へ。iPhone操作/転送/pushなし。

## チェックポイント84：選択画像キャッシュの片付け（2026-10-31）
- T004/T030/R03/R17：本人/街pool画像の送信終了時、変換済みJPEGだけでなくアプリ所有ImagePickerコピーも削除。成功・変換失敗・アップロード失敗のfinallyから実行。URL正規化後にアプリcache/ImagePicker/配下だけを許可し、写真ライブラリ原本・Documents・類似名ディレクトリ・親パス参照を対象外とする。削除失敗で保存成功をエラーにしない。
- Expo58 ImagePicker/FileSystem公式仕様と同梱MediaHandler.swiftのcachesDirectory/ImagePicker出力を確認（https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/ 、https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/）。新規の保持期限や全キャッシュ削除は導入しない。
- avatar-cache.test.mjs 3件成功（成功、変換/送信失敗、原本/対象外パス保護）。型/Lint成功。実機ファイル削除、強制終了時の残存ファイル、OS画像キャッシュ等は未確認。T030全対象完了ではない。ネイティブビルド・iPhone操作・pushなし。
- 実装23/33、統合20/33、実機11/33、DONE8/33、BLOCKED3を維持。

## チェックポイント85：入街ログの統合証拠を反映（2026-10-31）
- T021/R04/R15/R17：現行chat_readのarrival_logs union、プロフィール結合、30日/ブロック条件、useStreetChatの画像/種別フィールド、StreetChatのAvatar/入街文言を照合。cp66の実DB試験は新規入街・再送・reuse・気配更新でも1ログ、現在名反映、ブロック/解除、期限、visit ID非公開を対象にする。該当サーバー処理は変更されていないため反復しない。
- cp81の成功時画像 /tmp/yumegaoka-ui81-event-images/EAE6E47A-FA41-4436-B713-9A7081AF5BB6.png に本人画像・名前・「街に参加しました」が描画されている。APIだけだったcp66以降の描画証拠を対応付け、T021のINTEGRATEDを○へ更新。画像のないアカウントは既存の文字フォールバック。リアルタイム到達秒数や実機確認の証明にはしない。
- コード23/33（69.7%）、統合21/33（63.6%）、実機11/33（33.3%）、DONE8/33（24.2%）、BLOCKED3。33タスク分母と完了条件は変更なし。T021の作業状態はIMPLEMENTEDを維持（依存T020未完）。今回コード変更/テスト/ビルド/実機/pushなし。次はT020の残る複数閲覧・切断差分の確認を進める。

## チェックポイント86：チャット取得空白の実DB結合（2026-10-31）
- T020/T031/R15/R19：chat-reconnect-integration.test.mjsを追加。画面が使うreadChatWindowをそのまま実chat_listへ接続。閲覧者が30件を取得した後、取得しない間の125件をfixture投入、別利用者が実command APIで新規送信し、過去投稿を実chat_deleteで削除。再取得が50/50/50/6件の4ページで156件、全ID一意、元の最古境界維持、本人名、新着送信、旧投稿の本文nullを確認。送信者側の取得でも同じ新着IDを確認。
- 試験成功。単一DB接続のtransaction内で二つの認証主体を切り替える試験であり、実ネットワーク切断・二端末UI同時購読の証拠ではない。125件は時間経過のfixtureであり投稿上限を回避する製品処理ではない。全データrollback。既存のmockページ試験だけだった結合部分を補った。
- 製品コード変更なし。無関係な型/Lint/ビルドは省略。iPhone操作/pushなし。実装23/33、統合21/33、実機11/33、DONE8/33、BLOCKED3を維持。T020は複数画面の切断復帰が残る。

## チェックポイント87：同じピンを地図で再表示（2026-10-31）
- T007/T013/T014/T015/T031/R12/R13/R19：従来はlongitude/latitudeだけをカメラ移動の依存にしていたため、地図を動かした後に同じピンへ戻る要求では値が変わらず移動しなかった。Home/イベント詳細/募集詳細をopenMapAtへ共通化し、毎回異なるmapRequestを付けて移動を発火。認証/起動準備が終わる前に座標が来た場合も、ready/signedの変化時に移動する。座標を保存/送信する新APIは追加していない。
- 型/Lint成功、差分確認済み。最後のready/signed依存追加は画面準備条件の補完。ネイティブ変更なし。繰り返し表示の実画面確認は次のまとめたシミュレータ試験へ。cp81の一回目の導線成功を今回の繰り返し動作の成功とは扱わない。
- 実装23/33、統合21/33、実機11/33、DONE8/33、BLOCKED3。iPhone操作/転送/pushなし。

## チェックポイント88：運営の招待枠操作を統合（2026-10-31）
- T025/T031/R03/R16/R18：MemberRowの招待枠入力へアクセシビリティラベルを付与。testOperatorInvitationPolicyを追加し、専用simulator-validationアカウントでMFA登録/認証→参加者一覧→UI別の参加者→招待枠変更→元の値へ復元→発行停止→再開を確認。保存後の再取得でフォームが更新されることを待って次の操作へ進む。最後は元の枠・発行可能状態へ戻す。
- cp83/84/87の変更もまとめたシミュレータReleaseビルド成功（/tmp/yumegaoka-operator88-build.log）。対象UI試験成功（/tmp/yumegaoka-operator88.xcresult、53.615秒）。型/Lint/diff成功。試験後に専用アカウントの運営資格/MFAを解除。iPhone・本番アカウントは変更せず、pushなし。
- 今回は招待枠と発行停止/再開の実画面→RPC→再取得を確認。招待個票の運営無効化・発行者/受領者の全表示とページング操作は残るため、T025全体を統合達成/DONEへ変更しない。NFC/画像清掃/繰り返し地図移動の実操作は今回の試験に含めない。
- 実装23/33、統合21/33、実機11/33、DONE8/33、BLOCKED3を維持。

## チェックポイント89：運営招待の無効化（2026-10-31）
- T025/T031/R03/R16/R18：prepare-ui-test --invite-supervisionで専用ローカル発行者と招待を準備。testOperatorInviteRevocationでMFA→運営一覧→「UI招待監督 → 未使用」→招待無効化→無効化表示を確認。成功（/tmp/yumegaoka-invite89.xcresult）。DBで専用code_hashの1件がrevokedかつ発行者一致であることを確認。試験後にシミュレータの運営資格/MFAを解除。
- 本体はcp88ビルドを再利用、製品コード変更/再ビルドなし。使用済み受領者の表示・100件超の画面操作・実機は未確認。既存032 APIページング試験と区別する。試験データはローカルだけ、通常保持期限で清掃対象。iPhone操作/pushなし。
- cp88の枠変更/停止/再開と今回の一覧/無効化を合わせT025をINTEGRATEDへ。コード23/33（69.7%）、統合22/33（66.7%）、実機11/33（33.3%）、DONE8/33（24.2%）、BLOCKED3。作業状態IMPLEMENTEDは維持し、未確認事項をDONE扱いしない。

## チェックポイント90：Homeの格子背景（2026-10-31）
- T006/T013/R19：Figma81の格子背景をGridBackgroundとして追加し、Homeへ適用。白地・細線で構成し、タッチを透過、アクセシビリティツリーから装飾線を除外する。ウィンドウ寸法に合わせて描画し、画像素材や新ライブラリは不要。共通Pageは任意grid指定時だけ適用。
- Homeの参加条件とevent_listのjoined条件も照合し、主催者であるだけで参加予定に入れる仕様変更は行っていない。機能や保存対象に変更なし。
- 型/Lint/diff確認成功。装飾変更のため新規単体試験とビルドを省略。実画面でのヘッダー/タブ/文字との最終外観照合は次のまとめた確認へ。Figma全体の再現完了ではない。
- 実装23/33、統合22/33、実機11/33、DONE8/33、BLOCKED3。iPhone操作/pushなし。

## チェックポイント91：下部タブのアイコン（2026-10-31）
- T006/R19：文字記号⌂/◎/♙をTabIconの線画へ置換。家・照準と方向矢印・人物の図形を既存Viewで描画し、新規ライブラリ/フォント依存を追加しない。選択中Mapは青い角丸背景と白い図形。Figma同様に可視の英語タブラベルを省き、既存Home/Map/Settingsアクセシビリティラベル・選択状態・routeは維持。
- 初回型確認でRouterのColorValue（nullを含む）とstring指定の不一致を検出。型と代替色を修正し、型/Lintを再実行して成功。diff確認済み。装飾とタブ配置のため単体試験追加なし。実画面の収まり/押下/読み上げは次のまとめた画面確認へ。Figma完全一致や実機確認済みとは扱わない。
- 実装23/33、統合22/33、実機11/33、DONE8/33、BLOCKED3。ビルド/iPhone操作/pushなし。

## チェックポイント92：更新後のタブと画面遷移（2026-10-31）
- T006/T013/T031/R19：cp90/91までをまとめたReleaseシミュレータビルド成功（/tmp/yumegaoka-tabs92-build.log）。testMVPNavigation成功（/tmp/yumegaoka-tabs92.xcresult、51.128秒）。Home→作成シート→場所選択→入力保持→Settingsのプロフィール/街アイコン/アカウント管理/招待/お知らせ/ブロック/運営入口→Mapの往復を確認。運営資格なしの入口確認であり、MFA後の操作を今回再確認したものではない。
- 出力画像 /tmp/yumegaoka-tabs92-images/8E520E95-BF3F-48DF-BC85-C548FAD8F558.png で下部の家/地図/人物アイコンと青いMap選択背景の収まりを確認。読み上げ実機確認とHome格子の外観スクリーンショットは未実施。イベントピンのロゴが切れている表示問題を発見。次にマーカーのサイズ・クリップを修正する。全画面Figma一致とは扱わない。
- 製品コード変更なし。直前に成功した型/LintとDB試験の反復を省略。ユーザー就寝中の指示に従いiPhone操作/転送/質問/pushなし。実装23/33（69.7%）、統合22/33（66.7%）、実機11/33（33.3%）、DONE8/33（24.2%）、BLOCKED3を維持。

## チェックポイント93：収束方針とHome・募集の完了（2026-10-31）
- 全未完タスクに最小残作業・再利用証拠を対応付け、BUG_BACKLOGを新設。完了条件/33件分母は変更なし。T013/T014をDONEへ。T029全体のRealtime枠未完を、別途確認済みの募集作成認可の未確認と混同しない。
- recruitment-flowを拡張し実DBで精度/鮮度/街外/題名/所有権/同時1件/20分/位置固定/古い編集/期限/手動終了/退出後再送/1分3件上限を確認。recruitment-concurrencyは独立2接続で作成競合・退出競合・終了後再送を確認。初回2回は試験fixtureの削除順で失敗、募集→滞在、request_limits/commands→membersの順へ修正。残存した専用2ユーザーを特定して削除し、再試験は後片付けまで成功。製品SQLの障害とは扱わない。
- home-expiryを拡張し初回通信失敗・再取得でエラー解除・保存カードの単調時計失効を確認。既存UI cp44/46/51/69/81、期限cp57、募集詳細stateを再利用。実機・新規ビルドなし。型/Lint/diff成功。無関係な既存試験の反復なし。
- DONE10/33（30.3%）、IMPLEMENTED13、IN_PROGRESS7、TODO0、BLOCKED3。コード23/33（69.7%）、統合22/33（66.7%）、実機11/33（33.3%）。非外部30件の残りは20件。iPhone募集操作/背景観測等はT032で未確認のまま。Q05ヘッダーとQ12接続強制方式はまとめて確認中。次はT012の取消/拒否表示とT006/T007必須表示を閉じる。

## チェックポイント94：名前付き入街ログの完了判定（2026-10-31）
- T021/R04/R15/R17：既定条件「新規滞在1ログ・本人名/画像・30日・reuse/更新非追加・ブロック・非公開visitへの追跡APIなし」をcp66実DB試験とcp81実Map画像、現行useStreetChat→StreetChatへ対応付け直した。全条件の証拠が揃っておりDONEへ変更。T020全体が未完という理由で入街ログも未完としていた扱いを修正。条件自体は変更していない。未指定の到達時間測定を追加しない。
- cp93競合試験に両接続のpg_stat_activityロック待ち到達を追加し、同時要求であることを確認して再実行成功。製品コードは不変。今回既存arrival試験の反復・ビルド・iPhone・pushなし。cp93の型/Lint成功を再利用。
- DONE11/33（33.3%）、IMPLEMENTED12、IN_PROGRESS7、BLOCKED3。コード23/33、統合22/33、実機11/33を維持。今回の収束指示後の新規DONEはT013/T014/T021の3件。非外部30件の残り19件。未完のチャット切断復帰と実機観測を別タスクへ正しく残す。

## チェックポイント95：取消中の再入街競合を修正（2026-10-31）
- T012/R04/R06/R19：useStreetMapに入街処理中のrefガードを追加。取消後もnative.checkin応答待ちが残る間の再scanでcanceledがfalseへ戻り、旧結果を成功表示し得る経路を閉じた。処理終了後にガードを解放する。DB/Swiftの退出優先は変更しない。
- entry-state.test.mjsを追加。初回はmockのdefault export指定を修正、その後に製品でcheckin呼出2件を再現。修正後は取消→再scanでも1件、遅延成功を無視、pending_exitを維持、権限拒否/別端末/通信不明は成功表示なし、確定応答後だけ成功/activeとなる3試験が成功。NativeとNFCはmockであり、実機・実NFC・画面のピクセル描画の証拠ではない。
- 型/Lint/diff成功。既存cp77の実UI成功/退出を再利用。今回の取消/拒否の実画面確認はまだ不足するためT012をDONEにしない。次のまとめたUI確認に含める。iPhone/ビルド/pushなし。実装23/33、統合22/33、実機11/33、DONE11/33、BLOCKED3を維持。

## チェックポイント96：招待完了・承認ヘッダーと入街拒否表示（2026-10-31）
- T003/R03/R16：invitations試験へ7日有効期間、期限切れ消費拒否、拒否後未会員を追加し実DBで成功。既存cp50同時消費/上限とcp60のOTP→招待→名前→pool→Map/再起動を再利用。既定条件を満たしDONEへ。Realtime接続枠や追加実機通信断を招待固有条件に重複計上しない。
- Q05はユーザー承認：有効気配の街pool画像最大7個＋残り件数、チェックイン人数は別表示。現行liveCellsの失効後スロットを使いMapへ接続。新たな個人IDや位置APIは追加なし。画像なし枠は既存Avatar代替。Q12は方式の説明希望で未承認を維持。直接接続迂回防止/物理接続上限/運用負担を説明済み。
- T012のシミュレータ試験は最初に取消成功・拒否文言の待機失敗（/tmp/yumegaoka-entry96.xcresult）。権限をlocation/always両方で拒否する条件を整備。コード照合で地図取得成功が操作エラーを消す経路を発見し、refreshErrorを分離。entry-stateに成功refresh後も操作エラー保持を追加し3試験成功。型/Lint成功。
- cp95とヘッダー/エラー保持をまとめたシミュレータReleaseビルド成功（/tmp/yumegaoka-entry96-build.log）。iPhone操作/転送/pushなし。新画像列の人数あり描画、別端末/通信不明/退出待ちの全実画面は未確認。T012/T007はDONEにしない。
- DONE12/33（36.4%）、IMPLEMENTED11、IN_PROGRESS7、BLOCKED3。コード23/33、統合22/33、実機11/33。外部依存以外の残り18件。

cp96再試験：/tmp/yumegaoka-entry96-retry.xcresult成功。入街前取消→OFF維持、位置情報拒否→案内表示→成功表示なし/OFF維持を実Release画面で確認。試験後シミュレータの位置情報許可を復元。最初の失敗には権限条件とエラー消去の両方を修正したため、単一原因と断定しない。

## チェックポイント97：人数差のあるヘッダー実表示（2026-10-31）
- T007/R10/R19：ローカル専用fixtureで10滞在・8気配を作り、既存poolから当日画像を割当。testPresenceHeader成功（/tmp/yumegaoka-header97.xcresult）。実画像 /tmp/yumegaoka-header97-images/D4CE740D-864D-4194-9D65-976B44C28727.png で7画像＋1と別行の10チェックインを目視確認。既存cp96 Releaseを使用、本体再ビルドなし。
- scripts/test-header-ui.mjsは開始時に既存有効滞在0件を要求し、専用UUIDの滞在/気配/割当/会員/Authだけをfinallyで削除。既存pool画像やユーザーの滞在は変更しない。試験終了コード0で清掃完了。再利用時の観測時刻と失効の厳密一致のためstatement_timestampを使用。これは模擬人数の描画試験であり実在ユーザーの観測証明ではない。
- 必須ピン表示の欠けへ、イベントの雲文字に行高/高さ36を明示。表示修正の実画面確認は次のまとめたビルドへ残す。地図上の全マーカーやFigma完全一致は未達。Q10も未解決なのでT007はIN_PROGRESS維持。
- コード23/33、統合22/33、実機11/33、DONE12/33、BLOCKED3。iPhone操作/pushなし。次はピン表示の必須差分と残る入街/通報の統合条件を進める。

## チェックポイント98：イベント作成のサーバー境界（2026-10-31）
- T015/T029/R13/R16：event-flow実DB試験へ空/51文字題名、1001文字説明、定員0/101、街外地点、過去開始、91日先、終了=開始、24時間超の拒否を追加。24時間ちょうど・定員100の作成成功も確認。異なる受付で3件作成後、1分頻度記録だけをfixture内で除去して4件目拒否を確認し、同時3件制限を頻度制限と分けて証明。全fixture rollback。
- node --test tests/event-flow.test.mjs成功。既存の再送・名簿・参加取消・編集・中止の統合試験へ最小条件を追加。製品コードは変更なし。型/Lint/ビルド/実機は無関係なので反復しない。
- T015は作成ピンの表示確認が残るためIMPLEMENTED維持。入力境界の不足を解消した。DONE12/33、コード23/33、統合22/33、実機11/33、BLOCKED3。pushなし。

## チェックポイント99：可変幅ヘッダー・ゲートウェイ承認（2026-10-31）
- ユーザー訂正で7個固定を撤回。PresenceHeaderを分離し、onLayoutで実際の内容幅と＋人数ラベル幅を測定。34ptアイコンと4pt間隔から個数を算出、全員収まる時はラベル用スペースを確保しない。溢れる場合は＋総数を測った保守的な幅を予約して＋残数を表示。端末幅/回転/文字倍率の再レイアウトに追従する。人数ありcp97の旧固定7個検証を新版成功とは扱わない。
- presence-header試験成功：狭幅/広幅/8個全件/大きいラベル/未測定/人数保存。型/Lint結果は下記。新しい実画面確認は次のまとめたビルドへ。
- T029ゲートウェイ方式を採用済みとしてQ12を更新。承認は実装完了ではない。次はローカル認証受付・3接続・直接迂回防止・停止切断の接続を進める。
- DONE12/33、コード23/33、統合22/33、実機11/33、BLOCKED3。iPhone/ビルド/pushなし。

## チェックポイント100：配信ゲートウェイの物理接続受付（2026-10-31）
- T029/R16/R18：wsをroot依存へ固定し、scripts/lib/realtime-gateway.mjsを実装。HTTP upgradeでBearerを認証callbackへ渡し、認証後のaccount単位でソケットを同期予約。最大3本、TCP closeまで枠維持、資格再確認/失効切断、街changed通知（データなし）、受信専用を実装。URLへ認証情報を載せない。公式wsのupgrade/noServer仕様を参照（https://github.com/websockets/ws/blob/master/doc/ws.md）。
- realtime-gateway.test.mjs成功：実ループバックWebSocket4本同時の3受理/429、1本close後の再接続、changed受信、資格失効再確認後の全切断、403拒否。最初はsandboxのlisten EPERMで失敗し、ローカル待受の承認後成功。認証はcallbackの試験用代替であり実JWT/DB検査ではない。
- 未接続：実Auth資格検査、DB通知/停止イベント、アプリの配信経路切替、Supabase直接Realtimeの迂回防止。単一プロセス内の上限であり、独立複数プロセスの配備は未対応。起動/運用まで含めたT029完了とは扱わない。既存アプリは引き続き従来経路で動作する。
- 製品モバイルコード変更なし、型/Lint/ネイティブビルドの反復なし。DONE12/33、コード23/33、統合22/33、実機11/33、BLOCKED3。iPhone/pushなし。次は実認証とDB配信/直接迂回防止を接続する。

## チェックポイント101：ゲートウェイの実Auth・DB認可（2026-10-31）
- T029/R03/R16/R18：gateway-authorizeを追加。Supabase Auth /userで署名/期限を検証後にclaimsを読み、sub一致・authenticated role・session UUIDを確認。DBでactive/withdrawn_at・Authセッション存在/not_after・街存在を再確認する。JWTのdecodeだけでは受理しない。Auth通信4秒制限、失敗は受理しない。
- gateway-auth.test.mjs成功（実ローカルAuth/DB、約1.9秒）。未会員拒否→会員受理→sub改ざん拒否→利用停止拒否→退会拒否→セッション削除拒否。専用Authユーザーはfinallyで削除、DBfixture rollback。ユーザーの既存アカウント・セッションは変更なし。秘密トークン出力なし。
- ゲートウェイ起動処理への接続、DB変更/停止通知、アプリ切替、直接Supabase経路の閉鎖は残る。今回は認可関数の実バックエンド試験であり、アプリ接続済みや本番安全性を意味しない。モバイル型/Lint/ビルドは対象外なので反復なし。
- DONE12/33、コード23/33、統合22/33、実機11/33、BLOCKED3。iPhone/pushなし。

## チェックポイント102：ゲートウェイ起動・DB通知の接続（2026-10-31）
- T029/R16/R18：034 migrationをローカル適用。主要街データ・会員/セッション変更をpg_notifyの空payloadで通知。内容・位置・トークンは通知へ入れない。従来Realtime policyはアプリ切替前なので維持し、まだ迂回防止完了とはしない。
- gateway-runtimeで実Auth認可とWebSocketを接続。専用LISTEN接続のDB advisory lockにより独立2プロセスの起動を拒否。LISTEN/DB接続エラー時は全ソケットを閉じる。変更通知ごとの認可再確認、5秒補完再確認を実装。ローカル専用起動はnpm run realtime:local、54325番。クラウド設定なし。
- gateway-auth試験を拡張して成功：実Auth/DB会員→実WebSocket ready→街DB更新→changed受信→利用停止→3秒以内のclose、同一DBへの2起動拒否。専用データとAuthユーザーはfinallyで削除。以前の認可単体試験だけでなくruntimeまで通した。常駐プロセスはまだ起動していない。
- 残り：アプリWebSocket切替・直接Supabase迂回閉鎖・再接続/無応答ソケット回収・DB切断の障害確認。T029未完。既存モバイルは直接Realtimeを使用中。DONE12/33、コード23/33、統合22/33、実機11/33、BLOCKED3。モバイル変更なし、ビルド/実機/pushなし。

## cp103：残量管理とアプリ配信接続

T029のアプリ購読を承認済みゲートウェイへ切替。前景だけ1接続、毎回最新トークン、再接続ready時の再取得、背景/破棄中の遅延認証による接続を防止。直接経路閉鎖と共通アプリ通信処理の実Auth/DB再接続も確認。上限/認可の最終照合は未完なのでDONE数は12のまま。残量・見積変化はMVP_REMAINING参照。

## cp104：T029/T022の完了条件を解消
T029はLIMIT_ACCEPTANCEの全上限/認可と共通受付再送、T022は募集の残取得経路を確認してDONE。12→14/33。実装24/33・統合23/33・実機11/33。残作業26→24、追加必須0、推測22–52→20.5–49時間＋判断/外部待ち不明。次はT025の使用済招待受領者・ページング表示。

## cp105：T025完了
使用済み招待の受領者表示と101件目へのページ送りを実DB接続シミュレータで確認。DONE14→15/33。残量24→23、追加必須0。推測20.5–49→20–47.5時間＋判断/外部待ち不明。次T007/T015の地図描画を最新版Releaseでまとめて確認。

## チェックポイント114：街範囲の残条件
- T027/R11/R18をDONE。既存公開・交換UI証拠を再利用し、退化と競合公開拒否、新版観測成功を追加確認。
- 初回DB試験は機能条件成功後、試験用日替わり割当の清掃漏れで失敗。清掃修正後18件成功、sticker-flowも1件成功。初回の試験用残データは未整理。製品コード変更なし。
- DONE21/33、IMPLEMENTED3、IN_PROGRESS6、BLOCKED3。実装24/33・統合23/33・実機11/33は不変。
- 残項目16→15、新規必須0。推測13.5–31.5→12.5–28.5h＋待ち不明。次T012-01。ビルドと実機転送は省略。

## チェックポイント115：別端末の入街表示
- T012/R04/R06/R19：scripts/test-other-writer-ui.mjsで専用シミュレータアカウントへ別writerの実DB滞在を用意。既存Release109で「別の端末で参加中」、トグルOFF、入街説明→取消、他端末滞在がendedにならないことを確認。fixture滞在はfinally削除。
- tests/ios-ui/Smoke.swiftのtestOtherWriterEntryState成功（10.37秒）。証拠/tmp/yumegaoka-other-writer115.xcresult。製品再ビルド・iPhone操作なし。
- T012はIMPLEMENTED維持。通信不明/退出待ち画面を次に確認。DONE21/33、実装24/33、統合23/33、実機11/33、BLOCKED3/33。残15→15、新規必須0、推測12.5–28.5h＋待ち不明は据置き。
- cp114で残った専用試験街2ed97d22-1802-4976-bb09-d6ae09573948と日替わり割当3件を、名前test・滞在/タグなしを確認して削除。試験ユーザーの一括削除は行っていない。

## チェックポイント116：退出待ちのトグル修正
- T012/R06/R19：native.stopの通信待ち中にactiveがtrueのままになることをentry-state試験で再現（変更前失敗）。OFF操作直後に観測停止/退出待ちを画面へ反映し、NFC取消と退出Promiseの例外処理を分離。PresenceEngineの状態通知も、停止要求済みのactive滞在を退出待ちとして返す。完了済み/滞在なしでは停止要求だけをpendingにしない。
- entry-state4件成功、TypeScript・Lint成功、Swift構文parse成功。Swift型検査/ネイティブビルドと通信不明・退出待ちのシミュレータ画面確認は未実施。T012をDONEにしない。次回のまとめビルドに含める。
- 固定T012-01内の不具合修正。追加必須0、残項目15→15。推測12.5–28.5h＋待ち不明は据置き。DONE21/33、実装24/33、統合23/33、実機11/33、BLOCKED3/33。

## チェックポイント117：通信断退出の画面統合
- T012/R04/R06/R19をDONE。Releaseシミュレータをcp116修正込みで1回ビルド成功。入街→ローカルAPI停止→OFF→退出待ち表示→API復旧→再起動OFF・チェックイン0人をtestOfflineExitRecoveryで確認（27.08秒）。/tmp/yumegaoka-offline117.xcresult。実DBの最新滞在ended=true/end_reason=manualを確認。APIコンテナ復旧済み。
- scripts/test-offline-exit-ui.mjsはlocalhost制御口とfinally復旧/180秒復旧タイマーを使用。製品の疑似エラー表示ではなく実API停止による通信失敗。物理端末の機内モードや背景歩行ではない。
- 既存cp77演出/成功・cp96取消/権限拒否・cp115別端末の証拠を再利用。T012完了条件を緩和せず実NFCだけT028へ分離。
- DONE22/33、IMPLEMENTED2、IN_PROGRESS6、BLOCKED3。実装24/33、統合23/33、実機11/33は不変。残15→14、新規必須0、推測11.5–25.5作業時間＋待ち不明。次T006-01。

## チェックポイント118：全画面導線の照合
- T006/R19をDONE。NAVIGATION_ACCEPTANCEに現行ルート・呼出元・操作証拠・Figmaの対応と限界を集約。既存機能試験を再実行せず再利用。
- 未確認だったSettings→アカウント管理→退会→戻る→接続状態をtestAccountNestedNavigationで成功。/tmp/yumegaoka-navigation118.xcresult。メール変更/退会は実行せずT005の未決条件を維持。既存Release117を使用、本体ビルドとiPhone操作なし。
- DONE23/33、IMPLEMENTED2、IN_PROGRESS5、BLOCKED3。実装25/33、統合24/33、実機11/33。残14→13、新規必須0。推測10.5–23.5h＋待ち不明。次T030。

## チェックポイント119：期限表の不足確認
- T030/R17：RETENTION_ACCEPTANCEへ要件9章と実装/既存証拠/残条件を対応付け。feature-retentionへ操作受付23h保持/25h削除、制限用記録6日保持/8日削除を追加し実DB成功。新しい保存期限なし。
- T030はIN_PROGRESS。試行/終了滞在/入街ログの物理削除境界、worker稼働、端末残存キャッシュ、Q08が残る。既存T030-01〜03内の確認で項目追加なし。
- 残13→13、新規必須0、推測10.5–23.5h＋待ち不明は据置き。DONE23/33、実装25/33、統合24/33、実機11/33、BLOCKED3/33。製品変更なし、ビルド・実機操作省略。

## チェックポイント120：サーバー保存期限の照合完了
- T030/R17：feature-retentionへ入街試行/終了滞在の23h保持・25h削除、入街ログ29日保持・31日削除を追加。実DBのmaintenance_jobs入口から成功、fixtureはrollback。cp119/既存証拠と合わせRETENTION_ACCEPTANCEのサーバー清掃対応を完了。
- cron.jobのyumegaoka-cleanup active=true、19:02/19:03 UTCの直近2回succeeded。画像/退会worker PID48042と直近2周期成功ログを確認。常時稼働保証やクラウド復旧の証明ではない。
- T030-02解消。残13→12、新規必須0、推測9.5–20.5h＋待ち不明。T030はQ08と端末キャッシュ未完のためIN_PROGRESS。DONE23/33、実装25/33、統合24/33、実機11/33、BLOCKED3/33。製品変更・ビルド・実機操作なし。

## チェックポイント121：前回起動の一時画像を回収
- T030-03/R17：シミュレータのアプリCaches内ImagePicker/ImageManipulatorに4ファイル残存を確認（内容は読まず）。終了finallyだけでは強制終了の残存を回収できないため、TemporaryImageCleanupを追加。native.configureの初回に、前回の選択/変換コピーの通常ファイルだけを削除。プロセス内一度のみ、復帰や再ログインでは選択中ファイルを削除しない。
- 純Swiftの実ファイル試験成功：両専用ディレクトリの通常ファイル削除、写真原本相当/Documents・類似名フォルダ・シンボリックリンクの対象保護、再実行。新しい保存期間ではなく既定一時コピー清掃の取りこぼし修正。
- 本体への組込ビルドとシミュレータ起動時の実残存回収、表示用OS画像キャッシュは未確認。T030-03未完。残12→12、新規必須0、推測9.5–20.5h＋待ち不明は据置き。DONE23/33、実装25/33、統合24/33、実機11/33、BLOCKED3/33。

## チェックポイント122：画像キャッシュ組込確認中
- T030-03：Pod install成功、新Swiftファイル登録後のReleaseシミュレータビルド進行中。実行session24573、ログ/tmp/yumegaoka-release122.log。完了未確認のため成功扱いしない。再開時は同じハンドルを確認し、タイムアウトだけで再起動しない。
- 起動前ImagePicker/ImageManipulatorの一時ファイル4件を/tmp/yumegaoka-cache122-before.jsonへ名前/サイズのみ記録。表示用HTTPキャッシュを読み取りで確認し、Storage経路の記録5件を検出。AvatarのreloadはRN画像メモリキャッシュを迂回するが、HTTPキャッシュへの保存抑止を証明しない。既定T030-03内で対応が必要。
- 残12→12、新規必須0、推測9.5–20.5h＋待ち不明は据置き。DONE23/33、実装25/33、統合24/33、実機11/33、BLOCKED3/33。本体インストール/起動後清掃はまだ未確認。

## チェックポイント123：一時画像の実残存回収
- cp122の同じビルドsession24573が終了コード0、BUILD SUCCEEDED。再起動せず完了を待った。Release122をシミュレータへinstall/launch成功（PID33003）。
- 起動前に記録したImagePicker/ImageManipulatorの4ファイルを、新しいアプリコンテナの同名ディレクトリと照合し残存0件。両ディレクトリは存在し、既存ファイルのみ回収された。純Swiftの対象外/原本/リンク保護試験cp121と合わせ、一時コピー回収を組込確認。
- T030-03には表示用HTTPキャッシュの保存抑止が残る。RN RCTHTTPRequestHandlerはdefaultSessionConfiguration、APIClientはURLSession.sharedを利用。Avatarのreloadによる取得時迂回だけでディスク保存の抑止を主張しない。
- 残12→12、新規必須0、推測9.5–20.5h＋待ち不明は据置き。DONE23/33、実装25/33、統合24/33、実機11/33、BLOCKED3/33。iPhoneは操作していない。

## チェックポイント124：HTTPキャッシュ抑止
- T030-03/R17：native.configureの通信開始前にPrivateHTTPCacheを一度実行。共有URLCacheの旧応答を消去しmemory/diskCapacityを0にする。既に参照済みの共有オブジェクトも変更。共有HTTPキャッシュ全体が対象で再取得通信が増え得る。MapLibre固有キャッシュを直接操作しない。
- 実URLCache試験で旧応答削除/新規保存拒否を確認。純Swift一時ファイル試験も成功。Release124ビルド/install成功、testProfileImageDisplay成功、/tmp/yumegaoka-cache124.xcresult。画面画像/tmp/yumegaoka-cache124.pngは代替文字であり実画像表示成功の証拠ではない。
- 更新後Cache.dbの読取ではcfurl_cache_response表自体がなく旧記録消去を確認。初回読取はSQLite readonly共有メモリエラー、権限付き再読取で表不存在。実画像取得後の保存抑止確認は未完。
- 残12→12、新規必須0、推測9.5–20.5h＋待ち不明は据置き。DONE23/33、実装25/33、統合24/33、実機11/33、BLOCKED3/33。次は実画像fixtureを使い表示と保存なしを確認。iPhone操作なし。

## チェックポイント125：実画像表示とHTTP非保存
- T030-03/R17：cp124の代替文字は検証アカウント画像未設定（pathなし/Storageなし）が原因。scripts/test-image-cache-ui.mjsで専用アカウントへ一時JPEGを設定、Release124のプロフィールに画像が描画されたことを目視確認。/tmp/yumegaoka-image125.png、UI結果/tmp/yumegaoka-image125.xcresult成功。
- 表示後のOS HTTPキャッシュにStorage記録0件。fixtureのプロフィール値を復元、専用Storage画像と生成JPEGをfinally削除。cp123の一時コピー回収と合わせT030-03完了。実機への再インストールはT032に残す。
- 残12→11、新規必須0。推測9.5–20.5→8.5–18.5h＋待ち不明。T030はQ08未決のためIN_PROGRESS維持。DONE23/33、実装25/33、統合24/33、実機11/33、BLOCKED3/33。新規製品ビルドなし。次T024-02。

## チェックポイント126：利用停止・解除の画面統合
- T024-02/R16/R18：専用参加者と有効滞在を実DBへ作成し、MFA運営画面から理由入力→利用停止→解除を操作。testOperatorStopRestore成功、/tmp/yumegaoka-stop126.xcresult。解除後active=true、既存滞在end_reason=bannedを維持、member_stop/member_restoreの理由付き監査2件をDB照合。
- scripts/test-member-stop-ui.mjsのfinallyでfixtureと監査を削除、シミュレータ運営資格を解除。既存Release124利用、製品再ビルド/実機操作なし。投稿制限・解除のAPIはmember-operations既存証拠、画面での確定操作は次に確認。Q07/Q09は未決のまま。
- 残11→11、新規必須0、推測8.5–18.5h＋待ち不明は据置き。DONE23/33、実装25/33、統合24/33、実機11/33、BLOCKED3/33。T024はIMPLEMENTED維持。

## チェックポイント127：投稿制限・解除の画面と監査
- T024-02/R16/R18：MFA運営画面から理由と期限を指定して投稿制限→解除。専用参加者のactive=true・有効滞在end_reason=null維持、operator_chat_restrict/operator_chat_restoreの理由一致を実DB照合。/tmp/yumegaoka-chat-restrict127c.xcresult成功（38.744秒）。fixture/MFAをfinally回収。
- 最初のUI操作は成功したが理由一致で失敗。理由欄の保持を仮定した再試験も失敗。保存後に再生成された理由欄を画面内へ戻し、入力値を照合する試験へ修正して成功。製品コードの変更なし。cp126の停止後非復活を再利用。
- Q09は承認済み方式とcp101/103/104の認可証拠で解決済み。Q01の通常ログイン方針、Q07の一般参加登録波及は未決。T024はIMPLEMENTED維持。残11→10、新規必須0、推測8.5–18.5→7.5–15.5h＋待ち不明。DONE23/33・実装25/33・統合24/33・実機11/33を維持。製品ビルド/実機転送なし。

## チェックポイント128：主要フロー統合の収束
- T031/R01/R03〜R19/R21：LOCAL_FLOW_ACCEPTANCEで固定完了条件の役割別操作を既存実UI/DB証拠へ対応付け。新構成のRN Mapへ別参加者の実DB新着が自動反映されることを追加確認。testGatewayLiveChat成功（/tmp/yumegaoka-gateway128.xcresult、7.034秒）。fixtureだけ直接DB投入、表示は実アプリ/API。ポーリングも動くため単独でWS配送と断定せず、cp101/103/104/111の配信証拠と併用。
- T031をDONE。未決仕様と実機/外部の条件は対応タスクに維持。既存成功フローの全件再試験・製品再ビルド・実機転送なし。T029の方式再検討なし、pushなし。
- DONE24/33（72.7%）、IMPLEMENTED2、IN_PROGRESS4、BLOCKED3。実装26/33（78.8%）、統合25/33（75.8%）、実機11/33（33.3%）。残10→9、新規必須0、推測7.5–15.5→5.5–11.5h＋判断/実機/外部待ち不明。今回cp126からは11→9。

## チェックポイント129：最新版iPhone Releaseの生成
- T032-01/R20/R21：ソースbcf09edを基に、cp68以降の変更をまとめてiPhone向けReleaseビルド成功。ログ `/tmp/yumegaoka-device129-build.log`。成果物 `/tmp/yumegaoka-validation-release/Build/Products/Release-iphoneos/app.app`。同じ成果物を実機再開時に転送し、ソース変更がなければ再ビルドしない。
- codesign --verify --deep --strict成功。bundle jp.yumegaoka.development、表示名「夢ヶ丘 検証用」、localEntry=true/validationRelease=true、main.jsbundle同梱（3,316,654 bytes、SHA256 512770b7fc317fa200e27ad903a344eb2f198ffc6f8ab16a9ea81bb6647cc406）。APIの172.30.100.165は生成時のMac LANアドレスと一致。検証用ローカル設定であり公開版ではない。
- ユーザーの実機確認保留を維持し、端末転送・起動・操作なし。T032-01は転送が残るため未完。残9→9、新規必須0。推測5.5–11.5h＋判断/実機/外部待ち不明は据置き（部分実行を根拠なく時間減算しない）。DONE24/33、実装26/33、統合25/33、実機11/33、BLOCKED3/33を維持。無関係なテストは反復せず。

## チェックポイント130/131：ロジック優先と停止・退会の収束
- ユーザー方針をAGENTS/要件/DECISIONSへ反映。現行UIは仮UI、最終Figmaは後工程。既存33タスク/DONE履歴と条件は保持し、LOGIC_PROGRESSへロジック/仮UI/最終UIの独立達成記録を追加。
- T024/R14/R16/R18：036で停止時の一般参加登録をjoined=false・revision+1に変更し、本人宛通知を削除（outbox cascade）。会員親→イベントID順でロックし、主催イベント取消しと同一トランザクション。解除で復活せず、停止前の古い参加要求はconflict、新しい意思の参加は可能。member-operations実DB成功。T024 DONE。
- 運営のMemberRowからAPI送信/入力検証/書込中状態をuseMemberActionsへ抽出。Member型をlibへ移しhooksからUIへの依存を除去。デザイン変更なし。二重送信抑止・再取得失敗・不正入力のhook2試験、型/Lint成功。停止確認文に参加登録取消しの重要情報を追加。
- T005/T030/R03/R17：037で退会時の投稿制限/招待枠削除と未使用招待だけの無効化を実装。既退会分の制限/通知も回収。account-smokeで実Authの新旧メール確認、別OTPログイン後の旧セッション維持、再認証前拒否、退会後両セッション403、参加/通知/制限/枠削除、未使用招待無効・既使用招待維持、プロフィール削除/投稿匿名化/Auth worker清掃を確認。/tmp/yumegaoka-account131b.log成功。初回はfixture UUID型推論エラー、明示cast修正後成功。
- アカウント導線はcp118、useEmailChange/useWithdrawalの既存状態試験、native.ts→PresenceNativeModule→APIClient接続を照合。メール紛失の自動復旧なしを維持。固定T005条件の採用導線/再認証/他セッション/削除を満たしDONE。物理2台・実機上のメール変更/退会操作は今回未実施、DEVICE_VERIFIEDへ加算しない。T030はRETENTION_ACCEPTANCEの既存期限・清掃・端末コピー証拠とQ08の今回確認でDONE。
- DONE27/33（81.8%）、IMPLEMENTED1、IN_PROGRESS2、BLOCKED3。実装28/33（84.8%）、統合27/33（81.8%）、実機11/33（33.3%）。残9→5（cp130で1、cp131で3解消）、追加必須0。推測5.5–11.5→3.5–7.5h＋待ち不明。ネイティブビルド/実機転送/成功済み全件試験は省略。cp129成果物には今回のJS変更は未同梱、再開時にまとめて更新する。

## チェックポイント132：ロジック変更後のiPhone成果物更新
- T032-01：a843e5dの運営hook/確認文を含めiPhone Releaseを増分生成。/tmp/yumegaoka-device132-build.logでBUILD SUCCEEDED、codesign --verify --deep --strict成功。製品再ビルドはこの1回、全件試験なし。
- 転送待ち成果物は `/tmp/yumegaoka-validation-release/Build/Products/Release-iphoneos/app.app`。main.jsbundle SHA256 `aa7d46d9ebde03e2dbdedacb34e0343c807fd12a5bd083d1c00a4422c95bdb8d`。cp129成果物を置換。ソース変更がなければこの成果物を転送する。DB036/037は適用済み。
- 端末転送/操作は実機再開可否の回答待ち。残5→5、新規必須0、推測3.5–7.5h＋待ち不明は据置き。DONE27/33、ロジック実装29/33・検証28/33、実機11/33は不変。最終UI作業なし。


## チェックポイント133：APNs直接方式のローカル実装

2026-11-01。APNs直接送信・初期同時30人をdocsへ反映。T019の端末登録/端末別ジョブ/HTTP2・ES256/再試行/無効token/iOS接続を実装。[PUSH_DELIVERY](PUSH_DELIVERY.md)に構成と未確認境界を記録。実APNs未接続のためBLOCKEDを維持。DONE増分0（27/33）、作業状態のIMPLEMENTED1/IN_PROGRESS2/BLOCKED3は維持。コード達成29/33（87.9%）、統合27/33（81.8%）、実機11/33（33.3%）。LOGIC_IMPLEMENTED30/33、LOGIC_VERIFIED28/33。残量は前回5→内訳化9→解消4で5、外部3。推測残3.5–7.5h＋不明待ち。実機はユーザー希望で保留。Pushに必要な外部設定前にできる実装を完了し、追加の製品判断は求めない。
