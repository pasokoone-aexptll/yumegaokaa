# yumegaoka ドキュメントの入口

更新：2026-10-30。実装・レビューはここから開始する。現行文書は現在の合意を示し、履歴は採用根拠を残す。記載がない詳細を承認済みと解釈しない。

## 文書の役割

| 文書 | 役割・扱い |
| --- | --- |
| [PUSH_DELIVERY](PUSH_DELIVERY.md) | APNs直接配信・端末登録・ローカル検証と外部接続条件 |
| [LOGIC_PROGRESS](LOGIC_PROGRESS.md) | ロジック・仮UI・最終UIを分離した達成記録 |
| [ARCHITECTURE_CURRENT](ARCHITECTURE_CURRENT.svg) | 現在の実装構成とローカル/クラウドの境界（SVG） |
| [Map再設計差分](frontend-redesign/MAP_REDESIGN.md) | 2026-11-02のFigma差替え・追加機能の後工程・未確認事項 |
| [frontend-redesign](frontend-redesign/README.md) | 2026-11-01・全ルート/条件付き操作面/表示項目/状態/データ接続のコード調査。Figma設計の入口 |
| [UI_LOGIC_CONTRACT](UI_LOGIC_CONTRACT.md) | Figma差替え用の画面/操作/状態/ロジック境界（草案） |
| [MVP_TASKS](MVP_TASKS.md) | MVP全体のタスク・完了条件・進捗率・次の順序の正本 |
| [LOCAL_FLOW_ACCEPTANCE](LOCAL_FLOW_ACCEPTANCE.md) | 役割別の主要フローと実UI/DB統合証拠（T031） |
| [NAVIGATION_ACCEPTANCE](NAVIGATION_ACCEPTANCE.md) | 全画面・導線と操作証拠の対応（T006） |
| [MVP_REMAINING](MVP_REMAINING.md) | 固定完了条件の残チェックリスト・件数・推測工数と増減 |
| [MVP_IMPLEMENTATION_AUDIT](MVP_IMPLEMENTATION_AUDIT.md) | 2026-10-30の全体コード監査・未完成一覧・証拠 |
| [PROJECT_CONTEXT](PROJECT_CONTEXT.md) | 目的・文化・顧客仮説の正本 |
| [MVP_REQUIREMENTS](MVP_REQUIREMENTS.md) | 現在の承認済み要件の正本。未決定の細部は明記 |
| [DECISIONS](DECISIONS.md) | 現行決定の根拠と旧案の置換関係 |
| [OPEN_QUESTIONS](OPEN_QUESTIONS.md) | 未決定事項の正本。決定後は解決済みとしてここから除く |
| [SCREEN_FLOW_REVIEW](SCREEN_FLOW_REVIEW.md) | 現行の画面・フローと未承認の操作案 |
| [PRESENCE_AND_EVENTS](PRESENCE_AND_EVENTS.md) | 気配とイベントの合意境界・未決定の実装方式 |
| [ARCHITECTURE_PROPOSAL](ARCHITECTURE_PROPOSAL.md) | 単一バックエンド・端末区画化は採用済み。他の内部構成・具体方式は提案 |
| [PRESENCE_DISPLAY](PRESENCE_DISPLAY.md) | Figmaを基準にした気配の集約・失効・描画案。V01〜V03承認済み |
| [CHAT_MODERATION_DESIGN](CHAT_MODERATION_DESIGN.md) | チャット・削除・ブロック・通報の詳細案。C01〜C03承認済み |
| [PINS_AND_EVENTS_DESIGN](PINS_AND_EVENTS_DESIGN.md) | 募集・イベントの画面、データ、競合、通知と削除の設計案。E01〜E03承認済み |
| [NFC_OPERATIONS](NFC_OPERATIONS.md) | iPhone運営端末の登録・書込・設置・移設・停止案。N01〜N03承認済み |
| [OBSERVATION_RULES](OBSERVATION_RULES.md) | 時計同期・固定区画・境界判定の内部推奨設計。G01承認済み、Swift計算と本体接続を実装中 |
| [IPHONE_STACK](IPHONE_STACK.md) | iPhone向けRN/Expo・NFC・背景観測の構成。K01承認済み・本体ビルド確認中 |
| [FIRST_SLICE_CONTRACT](FIRST_SLICE_CONTRACT.md) | 最初の一本のDB項目・API型・画面状態・T01〜T16対応表。実装時の入口。実装差分と証拠はIMPLEMENTATION_PROGRESS/TECH_VALIDATION |
| [VISIT_LIFECYCLE](VISIT_LIFECYCLE.md) | チェックイン→気配更新→退出の詳細設計案。データ・API・状態・競合を統合。L01〜L04は承認済み。残る詳細は提案 |
| [DATA_MODEL_REVIEW](DATA_MODEL_REVIEW.md) | データ設計の問題点、再現条件、修正案。実DBテストではない |
| [DATA_MODEL_AND_STATES](DATA_MODEL_AND_STATES.md) | データ・状態・競合処理の設計案。D01・D03と入退場例外は承認済み。D04・D05も承認済み。D02は入街の期限のみ承認済み。他の具体方式は提案 |
| [TECH_STACK_PROPOSAL](TECH_STACK_PROPOSAL.md) | Supabase＋PostgreSQL採用の根拠。メールOTPも採用済み。認証設定・配信等の詳細は未確定 |
| [MVP_PROPOSALS](MVP_PROPOSALS.md) | P01〜P09の現在の状態・参照先 |
| [MVP_REVIEW](MVP_REVIEW.md) | 現在も残るリスクと設計上の確認点 |
| [IMPLEMENTATION_PROGRESS](IMPLEMENTATION_PROGRESS.md) | 最初の一本の工程・実装場所・設計との差分・残作業 |
| [TECH_VALIDATION](TECH_VALIDATION.md) | 実装済み・確認済み・未確認という事実の正本 |
| [ACCEPTANCE](ACCEPTANCE.md) | 要件ID、確認条件、確認状況の対応表 |
| [DOC_MAINTENANCE](DOC_MAINTENANCE.md) | 更新・逸脱レビュー・変更提案の手順 |
| [DOC_AUDIT](DOC_AUDIT.md) | 2026-10-29時点の整合点検履歴。最新監査はMVP_IMPLEMENTATION_AUDIT |
| [history](history/README.md) / [reference](reference/README.md) | 過去案・資料。現在の仕様や実装指示ではない |

## 優先関係

最新のユーザーの明示的な訂正・承認 → 現行の要件と決定 → 承認された詳細設計部分（滞在L01〜L04。文書全体への包括承認ではない）。構成提案、試作コード、旧資料から要件を上書きしない。現行文書同士の矛盾を見つけたら、都合のよい方を選ばず根拠を確認する。根拠がない製品判断は未決定として提示する。

現在は監査済み33タスクを基準に全MVPの実装・統合を再開している。Androidは将来移植が必要だが、当面の実装・検証・完了条件の対象外。React Nativeの方向は撤回していないが、バックエンドはSupabase＋PostgreSQLを採用。Expo開発ビルドと背景観測のSwiftモジュールを採用済み。具体バージョンはlockfileへ固定し、Expoの互換チェックとXcodeビルドで確認する。本体のDB/API・RN画面・Swift観測を実装中。既存Swift試作は保持している。

## 実装時に読む範囲と次の成果物

文書を全部順に読む運用にはしない。共通で要件・該当R番号・未決定一覧を確認し、作業対象の詳細書を読む。過去の比較案・レビューは根拠確認が必要な時に参照する。

| 実装単位 | 詳細書 | 確認条件 |
| --- | --- | --- |
| NFCから入街・更新・退出 | VISIT_LIFECYCLE / NFC_OPERATIONS | R04〜R09/R11/R17/R18/R21 |
| 気配を地図表示 | PRESENCE_DISPLAY | R07/R08/R10/R19/R21 |
| 募集とイベント | PINS_AND_EVENTS_DESIGN | R12〜R14/R16/R17/R19 |
| チャット・通報・制限 | CHAT_MODERATION_DESIGN | R03/R15〜R19 |

最初の実装単位のDBスキーマ案・API入出力・画面状態・受入テストは [FIRST_SLICE_CONTRACT](FIRST_SLICE_CONTRACT.md) に対応付け済み。全体進捗は [MVP_TASKS](MVP_TASKS.md) に集約する。[IMPLEMENTATION_PROGRESS](IMPLEMENTATION_PROGRESS.md) は最初の一本の工程・証拠を保持する。要件から設計、将来のコード、テストへの対応が追えることを成果物とする。全未決定事項の解消を着手条件にせず、最初の実装単位を阻むものだけ先に解決する。2026-10-29に製品本体の最初の一本の実装・ローカル検証を許可された。

現状の限界：DB/APIの通し確認とシミュレータビルドは進んだが、実タグ・本体での背景通信・全競合ケースは未確認。試験結果の範囲を超えて完成とは扱わない。
