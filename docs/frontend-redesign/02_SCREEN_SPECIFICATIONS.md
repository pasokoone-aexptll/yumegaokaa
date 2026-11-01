調査日：2026-11-01。対象コード：`45c089e`（本調査で製品コード変更なし）。
これは**現行実装の観察記録**であり、新しい製品仕様・デザイン案ではない。実装済みはソース上の接続の存在を意味し、全状態の実機成功を意味しない。検証事実の正本は[TECH_VALIDATION](../TECH_VALIDATION.md)、進捗は[MVP_TASKS](../MVP_TASKS.md)。

# 02 画面ごとの現行仕様

画面IDの一覧は[01](01_SCREEN_INVENTORY.md)。データ型/APIレスポンスの全文対応は[04](04_COMPONENT_AND_LOGIC_MAP.md)、全ソースの関数・位置は[07](07_SOURCE_COVERAGE.md)。

## 共通契約 C0（各画面に適用する範囲）

1. `Page`利用画面はScrollView＋「戻る」。戻れる履歴がなければ`/`へreplace。タブには戻るなし。画面ごとの独立した「保存して戻る」保証はない。
2. グローバルな資格状態はrootのガードが処理する。停止/退会/期限切れはS017、名前/街pool/招待不足は各設定へ。通信エラーすべてがログアウトを意味しない。
3. エラーが出ても直前の書込みが失敗したとは断定しない。共通command採用操作は同じ受付で照会/再送。非採用操作は画面固有の再取得・revisionを参照。UIのbusy表示だけをDB二重実行防止としない。
4. 通信断専用フルスクリーンはない。画面ごとのerror/status/旧一覧表示を用いる。独立した空状態・競合状態がないものは下記に明示。
5. DB項目をTextで表示するだけの場所は編集不可。入力欄の操作可否はC欄とD欄を優先。「未取得時に表示なし」は専用プレースホルダーがないことを意味する。
6. API側の認可・期限・世代・revision・操作受付・native永続化は視覚デザインに依存させない。装飾、色、余白、文字組、アイコン外観は本調査では確定しない。
7. 非該当状態：静的メニューや確認ダイアログに「保存成功画面」を補完しない。個別に記載のない保存成功/競合/失敗状態は、親の処理結果に統合される。未保存フォームを自動永続化すると解釈しない。

<a id="s001"></a>
## S001 Map

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見る。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/(tabs)/index.tsx`](<../../apps/mobile/src/app/(tabs)/index.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useStreetMap / liveCells / native.currentLocation`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`ActivityIndicator`, `Camera`, `CameraRef`, `Map`, `Modal`, `PresenceHeader`, `Pressable`, `SafeAreaView`, `StreetChat`, `StreetEntrySheet`, `StreetLogin`, `StreetMapMarkers`, `Switch`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S001-F01 | 街名 | string | get_street_config.name（初期は夢ヶ丘） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F02 | チェックイン人数 | number | get_presence_snapshot.checked_in_count（未取得は街の様子を確認中、エラー時は最終取得時） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F03 | 有効気配アイコン列 | string／null[] | cells.expiry_groups.icons→liveCells→PresenceHeader（0件は列なし） | 値ありの場合。分岐は取得元欄参照 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F04 | 気配人数 | number | 各cluster.count | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F05 | 気配座標 | longitude/latitude | cell.anchor（描画分割で位置は変えない） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F06 | 気配透明度 | number | expires_atと補正時刻から0〜1 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F07 | イベント題名 | string | event_list.items.title | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F08 | 開始まで/残り | string | starts_at/ends_at→countdown（長時間は日/時間） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F09 | 募集者名 | string | recruitment_list.items.display_name | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F10 | 募集題名 | string | recruitment_list.items.title | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F11 | 滞在状態 | string | NativeState.status（未参加/気配を観測中は通常ラベル非表示） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S001-F12 | 参加スイッチ | boolean | active=有効滞在・本人更新元・退出待ちでない・期限内 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S001-F13 | エラー | string | 操作error優先、次にrefreshError | 非空のerror/statusまたは結果がある時 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S001-A01 | トグルON→[S026](02_SCREEN_SPECIFICATIONS.md#s026)、OFF→exit/native.stop（気配・募集終了、通信不明でもOFF維持） |
| S001-A02 | 気配は閲覧のみ、イベント/募集ピンtap→[S011](02_SCREEN_SPECIFICATIONS.md#s011)/[S013](02_SCREEN_SPECIFICATIONS.md#s013) |
| S001-A03 | 地図pan/zoom→MapLibre内だけ、現在地→単発測位→camera（投稿なし） |
| S001-A04 | 追加→[S018](02_SCREEN_SPECIFICATIONS.md#s018)、接続状態→[S030](02_SCREEN_SPECIFICATIONS.md#s030)、チャット操作→[S028](02_SCREEN_SPECIFICATIONS.md#s028)/[S029](02_SCREEN_SPECIFICATIONS.md#s029) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

起動準備spinner/未認証/通常/気配0/初回取得待ち/旧snapshot＋通信エラー/別端末で参加中/退出反映待ち/期限切れ。snapshotが0でも現地無人と断言しない。失効計算1秒、前景取得10秒とgateway通知、復帰時resume。

**再起動・復元：** 滞在はnative journalから復元。snapshotはメモリ。精密現在地は再センタリングのみ。

### E. 遷移

流入：起動/中央タブ/Home・詳細の地図操作。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S002](02_SCREEN_SPECIFICATIONS.md#s002) [S003](02_SCREEN_SPECIFICATIONS.md#s003) [S011](02_SCREEN_SPECIFICATIONS.md#s011) [S013](02_SCREEN_SPECIFICATIONS.md#s013) [S018](02_SCREEN_SPECIFICATIONS.md#s018) [S026](02_SCREEN_SPECIFICATIONS.md#s026) [S027](02_SCREEN_SPECIFICATIONS.md#s027) [S028](02_SCREEN_SPECIFICATIONS.md#s028) [S029](02_SCREEN_SPECIFICATIONS.md#s029) [S030](02_SCREEN_SPECIFICATIONS.md#s030)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの人数/気配/滞在状態とCのOFF/取消を維持。気配0を無人と断言せず、背景共有の意思・精密位置との違いを区別する。scanning/checking取消とexplain/success閉じるは別処理。

<a id="s002"></a>
## S002 Homeピン一覧

### A. 基本情報

- 用途：参加予定と募集中を一覧表示。
- 関連要件：R12 R13 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/(tabs)/home.tsx`](<../../apps/mobile/src/app/(tabs)/home.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useHomePins / PinListItem`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `PinListItem`, `Pressable`, `ScrollView`, `Text`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S002-F01 | 選択タブ | string | ローカル参加予定/募集中（初期参加予定） | この操作面が表示中 | focus・前景10秒・streetChanges・復帰、期限表示1秒 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S002-F02 | イベント題名 | string | event_list(mine_only=true).title | この操作面が表示中 | focus・前景10秒・streetChanges・復帰、期限表示1秒 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S002-F03 | 開始日時 | string | starts_at→端末ロケール | この操作面が表示中 | focus・前景10秒・streetChanges・復帰、期限表示1秒 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S002-F04 | 募集題名 | string | recruitment_list.title | この操作面が表示中 | focus・前景10秒・streetChanges・復帰、期限表示1秒 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S002-F05 | 募集者名 | string | display_name | この操作面が表示中 | focus・前景10秒・streetChanges・復帰、期限表示1秒 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S002-F06 | 地図操作座標 | number×2 | longitude/latitude（数値は直接表示しない） | この操作面が表示中 | focus・前景10秒・streetChanges・復帰、期限表示1秒 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S002-F07 | 取得エラー | string | hook.error | 非空のerror/statusまたは結果がある時 | focus・前景10秒・streetChanges・復帰、期限表示1秒 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S002-A01 | タブtapで切替 |
| S002-A02 | 作成→[S018](02_SCREEN_SPECIFICATIONS.md#s018) |
| S002-A03 | 一覧題名tap→各詳細、地図を開く→S001指定地点 |
| S002-A04 | 再読み込み→両一覧取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

初回loading/タブ別空状態/取得成功/失敗（旧一覧維持）。前景10秒・streetChanges・復帰、期限削除1秒。

**再起動・復元：** 選択タブはローカルstate。参加予定はDB再取得、参加履歴なし。

### E. 遷移

流入：Homeタブ。表示資格：有効会員・未入街可。遷移・子面：[S011](02_SCREEN_SPECIFICATIONS.md#s011) [S013](02_SCREEN_SPECIFICATIONS.md#s013) [S018](02_SCREEN_SPECIFICATIONS.md#s018) [S001](02_SCREEN_SPECIFICATIONS.md#s001)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s003"></a>
## S003 Settings

### A. 基本情報

- 用途：アカウント関連の入口。
- 関連要件：R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/(tabs)/settings.tsx`](<../../apps/mobile/src/app/(tabs)/settings.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`router`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Page`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S003-F01 | 見出し | string | アカウント（固定） | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S003-F02 | メニュー | string[] | プロフィール/街のアイコン/友人を招待/お知らせ/ブロック設定/アカウント管理/運営/ログイン・接続状態 | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S003-A01 | 各Actionで対象route、接続状態のみ/へpanel=accountでnavigate |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

メニューは一般会員にも運営入口を表示する。資格判定はS014とDB。独自loadingなし。

**再起動・復元：** この画面固有の永続入力なし。認証・資格はrootから復元し、API画面は再取得する。

### E. 遷移

流入：Settingsタブ。表示資格：有効会員。遷移・子面：[S004](02_SCREEN_SPECIFICATIONS.md#s004) [S005](02_SCREEN_SPECIFICATIONS.md#s005) [S006](02_SCREEN_SPECIFICATIONS.md#s006) [S007](02_SCREEN_SPECIFICATIONS.md#s007) [S008](02_SCREEN_SPECIFICATIONS.md#s008) [S009](02_SCREEN_SPECIFICATIONS.md#s009) [S014](02_SCREEN_SPECIFICATIONS.md#s014) [S030](02_SCREEN_SPECIFICATIONS.md#s030)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s004"></a>
## S004 プロフィール

### A. 基本情報

- 用途：本人表示名・チャット用画像を設定。
- 関連要件：R03 R15 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/profile.tsx`](<../../apps/mobile/src/app/profile.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useProfile / chooseAvatar / AccountAccessContext`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Avatar`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S004-F01 | 表示名 | string | profile_get.display_name→name（編集可、50文字、空白のみ不可） | この操作面が表示中 | focus取得、保存応答 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S004-F02 | 本人画像 | string? | avatar_path/avatar_updated_at→Avatar（なければ名前先頭） | 値ありの場合。分岐は取得元欄参照 | focus取得、保存応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S004-F03 | 操作結果 | string | status（保存しました/画像エラー等） | 非空のerror/statusまたは結果がある時 | focus取得、保存応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S004-F04 | 保存ボタン名 | string | onboardingなら次へ、通常保存 | この操作面が表示中 | focus取得、保存応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S004-F05 | ログアウトエラー | string | logoutError | 非空のerror/statusまたは結果がある時 | focus取得、保存応答 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S004-A01 | 名前保存→profile_save→access.retry |
| S004-A02 | 写真を選ぶ→[S044](02_SCREEN_SPECIFICATIONS.md#s044)→Storage→profile_avatar_set（名前が既にある場合のみ） |
| S004-A03 | 初回はログアウト可 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

取得失敗はstatus。画像保存/名前保存中はAction停止。画像選択cancelは変更なし。名前欄自体はbusyでもeditable指定なし。

**再起動・復元：** 通常の未保存名は再起動で消える。focusで再取得。初回は名前→街poolで、本人写真は必須ではない。

### E. 遷移

流入：S003またはprofile_requiredリダイレクト。表示資格：会員・名前未設定も可。遷移・子面：[S044](02_SCREEN_SPECIFICATIONS.md#s044) [S005](02_SCREEN_SPECIFICATIONS.md#s005) [S001](02_SCREEN_SPECIFICATIONS.md#s001)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

本人用画像と街pool提供/当日割当を別用途として示す。初回pool必須、正方形編集/保存エラー/取下げを維持。OS所有画面を独自UI実装済みと見なさない。

<a id="s005"></a>
## S005 街アイコン

### A. 基本情報

- 用途：poolへの提供と当日割当を確認。
- 関連要件：R03 R07 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/street-icons.tsx`](<../../apps/mobile/src/app/street-icons.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`chooseStreetIcon / street_icon_get/remove / access.retry`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Avatar`, `Page`, `StreetIconState`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S005-F01 | 共有用途説明 | string | 本人用とは別・毎日午前0時shuffle（固定） | この操作面が表示中 | focus/30秒poll/画像公開・取下げ応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S005-F02 | 提供画像 | string／null | contribution_path（なければ画像を選んで街に提供） | 値ありの場合。分岐は取得元欄参照 | focus/30秒poll/画像公開・取下げ応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S005-F03 | 当日画像 | string／null | daily_path/day（なければ当日カード非表示） | 値ありの場合。分岐は取得元欄参照 | focus/30秒poll/画像公開・取下げ応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S005-F04 | 提供状態 | boolean | contribution_idの有無で取下げAction | この操作面が表示中 | focus/30秒poll/画像公開・取下げ応答 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S005-F05 | エラー | string | 取得/変換/保存失敗 | 非空のerror/statusまたは結果がある時 | focus/30秒poll/画像公開・取下げ応答 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S005-A01 | 選択/差替え→[S044](02_SCREEN_SPECIFICATIONS.md#s044)→prepare/upload/publish |
| S005-A02 | 取り下げ→[D001](02_SCREEN_SPECIFICATIONS.md#d001)→street_icon_remove |
| S005-A03 | 初回未完了時logout |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

focus/30秒再取得。busyで変更停止。初期loading専用表示なし。提供済みcontributedは取り下げても初回未登録へ戻さないDB契約。

**再起動・復元：** 画像と日割当はDB。選択途中はOS管理、一時画像は削除。

### E. 遷移

流入：S003またはpool_required。表示資格：会員・初回提供前も可。遷移・子面：[S044](02_SCREEN_SPECIFICATIONS.md#s044) [D001](02_SCREEN_SPECIFICATIONS.md#d001) [S001](02_SCREEN_SPECIFICATIONS.md#s001)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

本人用画像と街pool提供/当日割当を別用途として示す。初回pool必須、正方形編集/保存エラー/取下げを維持。OS所有画面を独自UI実装済みと見なさない。

<a id="s006"></a>
## S006 招待

### A. 基本情報

- 用途：招待受領・発行・共有・停止。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/invitations.tsx`](<../../apps/mobile/src/app/invitations.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useInvitations / submitCommand`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S006-F01 | 受領コード | string | code入力 | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | 初期空欄／placeholder（明記した既定値は例外） | 不可（操作結果・データ再取得で変化） |
| S006-F02 | 発行コード | string | issued.code（発行成功直後のみselectable） | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S006-F03 | 招待期限 | string | items.expires_at（日付） | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S006-F04 | 使用済 | boolean | items.used | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S006-F05 | 停止済 | boolean | items.revoked | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S006-F06 | 期限切れ | boolean | 端末時刻比較expired | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S006-F07 | 処理結果 | string | status | 非空のerror/statusまたは結果がある時 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S006-F08 | 前回発行未確定 | boolean | pendingで前回の招待を確認 | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S006-A01 | 受領→invite_accept→access.retry |
| S006-A02 | 発行→command invite_create |
| S006-A03 | 共有→OS Share |
| S006-A04 | 有効未使用のみinvite_revoke |
| S006-A05 | 再読み込み |
| S006-A06 | 受領のみの時logout |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

loading/空/発行中/発行成功/上限エラー/無効・使用済・期限切れ。UI文言は7日5件固定で運営枠変更に追従しない。

**再起動・復元：** コード表示はblur時クリア、一覧は再取得。未確定発行はSecureStore command復元。

### E. 遷移

流入：[S003](02_SCREEN_SPECIFICATIONS.md#s003)/未登録リダイレクト。表示資格：認証済み未登録は受領のみ。会員は発行と受領フォーム。遷移・子面：[S031](02_SCREEN_SPECIFICATIONS.md#s031) [S032](02_SCREEN_SPECIFICATIONS.md#s032) [S004](02_SCREEN_SPECIFICATIONS.md#s004) [S005](02_SCREEN_SPECIFICATIONS.md#s005) [S001](02_SCREEN_SPECIFICATIONS.md#s001) [S045](02_SCREEN_SPECIFICATIONS.md#s045)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s007"></a>
## S007 お知らせ

### A. 基本情報

- 用途：変更/中止通知とPush許可。
- 関連要件：R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/notifications.tsx`](<../../apps/mobile/src/app/notifications.tsx>)。部分実装として扱う：アプリ内実装済み、Pushロジック実装済み・実配信未確認。
- 接続：`useNotifications / usePushPermission`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S007-F01 | 題名 | string | notification_list.title | この操作面が表示中 | focus/10秒/復帰/streetChanges/既読応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S007-F02 | 未読印 | boolean | !readで●/太字 | この操作面が表示中 | focus/10秒/復帰/streetChanges/既読応答 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S007-F03 | 変更種別 | string | kind=changed/canceledを文章化 | この操作面が表示中 | focus/10秒/復帰/streetChanges/既読応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S007-F04 | 日時 | string | created_at | この操作面が表示中 | focus/10秒/復帰/streetChanges/既読応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S007-F05 | ボタン名 | string | 詳細を確認/確認しました/確認済み | この操作面が表示中 | focus/10秒/復帰/streetChanges/既読応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S007-F06 | Push状態 | string | disabled/registering/registered/denied/error/unavailable | この操作面が表示中 | focus/10秒/復帰/streetChanges/既読応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S007-F07 | エラー | string | hook.error | 非空のerror/statusまたは結果がある時 | focus/10秒/復帰/streetChanges/既読応答 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S007-A01 | 変更通知→notification_read成功後S011 |
| S007-A02 | 中止通知→既読化のみ |
| S007-A03 | 再読込 |
| S007-A04 | Push有効化→[S046](02_SCREEN_SPECIFICATIONS.md#s046) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

loading/空/旧一覧＋エラー/既読保存中。reading中は全通知Action無効。10秒・focus・復帰・streetChanges再取得。Push拒否でも一覧を使える。

**再起動・復元：** 既読はDB。通知タップは任意URLを使わず認証後一覧へ。実APNsは未確認。

### E. 遷移

流入：[S003](02_SCREEN_SPECIFICATIONS.md#s003)/Pushタップ。表示資格：有効会員。遷移・子面：[S011](02_SCREEN_SPECIFICATIONS.md#s011) [S046](02_SCREEN_SPECIFICATIONS.md#s046)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s008"></a>
## S008 ブロック設定

### A. 基本情報

- 用途：自分の非表示設定を解除。
- 関連要件：R16（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/blocks.tsx`](<../../apps/mobile/src/app/blocks.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`native.rpc / localBlocks`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Block`, `Empty`, `Page`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S008-F01 | 対象名 | string | block_list.items.display_name | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S008-F02 | 説明 | string | チャット・入街ログ・募集のみ非表示、気配人数不変 | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S008-F03 | 取得/解除エラー | string | error | 非空のerror/statusまたは結果がある時 | 固定メニュー | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S008-A01 | 解除→block_set(false)→localBlocks→再取得 |
| S008-A02 | 再読込 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

loading/空/取得失敗/解除busy。解除はwriting refで二重実行を抑止。

**再起動・復元：** DBが正本、セッション内maskは即時非表示用。

### E. 遷移

流入：[S003](02_SCREEN_SPECIFICATIONS.md#s003)。表示資格：有効会員。遷移・子面：[S003](02_SCREEN_SPECIFICATIONS.md#s003)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s009"></a>
## S009 アカウント管理

### A. 基本情報

- 用途：メール変更・退会入口。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/account.tsx`](<../../apps/mobile/src/app/account.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useEmailChange / APIClient Auth`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S009-F01 | 現在メール | string | accountDetails.email | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S009-F02 | 新メール入力 | string | next（@含有で送信可） | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S009-F03 | 変更予定メール | string | accountDetails.new_email=pending | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S009-F04 | 旧メール確認コード | string | oldCode（最大8、6以上でAction可） | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S009-F05 | 新メール確認コード | string | newCode（同条件） | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S009-F06 | 結果 | string | status | 非空のerror/statusまたは結果がある時 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S009-F07 | 復旧非対応説明 | string | メール紛失の自動復旧なし | この操作面が表示中 | 固定メニュー | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S009-A01 | changeEmail→新旧コード送信 |
| S009-A02 | verifyEmailChange旧/新→両方成功でsession/native.resume更新 |
| S009-A03 | 退会→[S010](02_SCREEN_SPECIFICATIONS.md#s010) |
| S009-A04 | 読込失敗時再取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

loading/ready=false入力不可/変更未開始/片方確認済/完了/通信不明時Auth再取得。

**再起動・復元：** 新旧codeはblurで消去。変更予定はAuth再取得、入力nextは永続なし。

### E. 遷移

流入：[S003](02_SCREEN_SPECIFICATIONS.md#s003)。表示資格：認証済み会員。遷移・子面：[S033](02_SCREEN_SPECIFICATIONS.md#s033) [S010](02_SCREEN_SPECIFICATIONS.md#s010)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s010"></a>
## S010 退会

### A. 基本情報

- 用途：再認証して資格と関連情報を終了。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/withdraw.tsx`](<../../apps/mobile/src/app/withdraw.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useWithdrawal`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S010-F01 | 影響説明 | string | 滞在/募集終了、主催中止、プロフィール削除、投稿匿名化、不可逆 | この操作面が表示中 | focus/メール変更・確認後load | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S010-F02 | 本人メール | string | request.email | この操作面が表示中 | focus/メール変更・確認後load | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S010-F03 | 確認コード | string | code（最大8、6以上） | この操作面が表示中 | focus/メール変更・確認後load | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S010-F04 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/メール変更・確認後load | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S010-A01 | 本人確認送信→withdraw_prepare＋sendOTP |
| S010-A02 | 確認→[D002](02_SCREEN_SPECIFICATIONS.md#d002)→verifyOTP→withdraw_confirm→logout→/ |
| S010-A03 | 再送→受付取り直し |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

busy/コード待ち/期限切れ（requestを解除）/通信不明（再試行）。writing refで抑止、成功済み段階は同mount内で再利用。

**再起動・復元：** 受付/入力はReact state、再起動後は開始から。サーバー退会状態は残る。

### E. 遷移

流入：[S009](02_SCREEN_SPECIFICATIONS.md#s009)。表示資格：認証済み会員。遷移・子面：[S034](02_SCREEN_SPECIFICATIONS.md#s034) [D002](02_SCREEN_SPECIFICATIONS.md#d002) [S024](02_SCREEN_SPECIFICATIONS.md#s024)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s011"></a>
## S011 イベント詳細

### A. 基本情報

- 用途：参加・取消・名簿・主催操作。
- 関連要件：R13 R14（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/events/[id].tsx`](<../../apps/mobile/src/app/events/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useEventDetail / StreetEvent`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S011-F01 | 題名 | string | event_get.title（未取得はオフ会） | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S011-F02 | 開始日時 | string | starts_at | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S011-F03 | 終了日時 | string | ends_at | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S011-F04 | 説明 | string | description（空は空Text） | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S011-F05 | 参加人数 | number | count | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S011-F06 | 定員 | number | capacity | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S011-F07 | 参加状態 | boolean | joined→参加する/参加を取り消す | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S011-F08 | 主催判定 | boolean | mine→主催操作 | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S011-F09 | 運営判定 | boolean | operator_status→名簿操作のみ | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S011-F10 | 地図地点 | number×2 | longitude/latitude（数値表示なし） | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S011-F11 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/10秒/復帰/streetChanges/操作後 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S011-A01 | event_registerにregistration_revision＋希望joined |
| S011-A02 | 満員は新規参加だけ不可 |
| S011-A03 | 名簿→[S035](02_SCREEN_SPECIFICATIONS.md#s035) |
| S011-A04 | 主催編集→[S012](02_SCREEN_SPECIFICATIONS.md#s012) |
| S011-A05 | 主催中止→[D003](02_SCREEN_SPECIFICATIONS.md#d003) |
| S011-A06 | 通報→[S019](02_SCREEN_SPECIFICATIONS.md#s019) |
| S011-A07 | Mapへ |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

loading/取得成功/満員/参加済/中止成功/終了・中止・通信失敗は表示不可へ。再取得失敗で旧詳細/名簿を消す。actはref排他、応答不明なら再取得。

**再起動・復元：** DB再取得。参加操作で街人数は変えない。主催者名・開催住所・参加者写真はレスポンス/画面にない。

### E. 遷移

流入：Map/Home/通知/運営通報。表示資格：会員。名簿は主催者またはMFA運営。遷移・子面：[S012](02_SCREEN_SPECIFICATIONS.md#s012) [S035](02_SCREEN_SPECIFICATIONS.md#s035) [D003](02_SCREEN_SPECIFICATIONS.md#d003) [S001](02_SCREEN_SPECIFICATIONS.md#s001) [S019](02_SCREEN_SPECIFICATIONS.md#s019) [S014](02_SCREEN_SPECIFICATIONS.md#s014)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの題名・日時・定員/人数・公開地点・自分の権限に該当する情報とCの操作を保持。送信中/競合/期限終了を区別し、一般参加者へ名簿を公開しない。未送信入力と結果未確定の受付は別状態。

<a id="s012"></a>
## S012 イベント編集

### A. 基本情報

- 用途：主催イベント更新。
- 関連要件：R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/events/edit/[id].tsx`](<../../apps/mobile/src/app/events/edit/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useEventEditor / eventInputError`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `EventDateField`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S012-F01 | 題名 | string | title（50） | この操作面が表示中 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S012-F02 | 説明 | string | description（1000） | この操作面が表示中 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S012-F03 | 開始 | string | start ISO | この操作面が表示中 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S012-F04 | 終了 | string | end ISO | この操作面が表示中 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S012-F05 | 定員 | string | capacity（整数1〜100） | この操作面が表示中 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S012-F06 | 選択地点 | tuple | point（場所変更ボタン、数値表示なし） | この操作面が表示中 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S012-F07 | 開催中 | boolean | server_time>=starts_at→終了以外無効 | この操作面が表示中 | 初回/focusと保存・競合時再取得。入力はeditor管理 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S012-F08 | 最新比較内容 | StreetEvent | latest.title/description/starts_at/ends_at/capacity | この操作面が表示中 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S012-F09 | エラー | string | error | 非空のerror/statusまたは結果がある時 | 初回/focusと保存・競合時再取得。入力はeditor管理 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S012-A01 | 保存→event_edit(revision)→back |
| S012-A02 | 場所→[S036](02_SCREEN_SPECIFICATIONS.md#s036) |
| S012-A03 | 日付→[S037](02_SCREEN_SPECIFICATIONS.md#s037) |
| S012-A04 | 競合最新内容採用→[D004](02_SCREEN_SPECIFICATIONS.md#d004)→再取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

初期取得/編集/保存中/競合latest表示＋保存停止/最新採用/失敗入力維持。場所の最新比較表示はなし。

**再起動・復元：** 未保存編集はメモリ、focus時loadが上書き。共通commandの永続再送対象ではない。

### E. 遷移

流入：S011主催編集。表示資格：mine=true、DBでも主催認可。遷移・子面：[S036](02_SCREEN_SPECIFICATIONS.md#s036) [S037](02_SCREEN_SPECIFICATIONS.md#s037) [D004](02_SCREEN_SPECIFICATIONS.md#d004) [S011](02_SCREEN_SPECIFICATIONS.md#s011)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの題名・日時・定員/人数・公開地点・自分の権限に該当する情報とCの操作を保持。送信中/競合/期限終了を区別し、一般参加者へ名簿を公開しない。未送信入力と結果未確定の受付は別状態。

<a id="s013"></a>
## S013 募集詳細・題名編集

### A. 基本情報

- 用途：募集の閲覧・本人編集・終了。
- 関連要件：R12（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/recruitments/[id].tsx`](<../../apps/mobile/src/app/recruitments/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useRecruitmentDetail`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S013-F01 | 題名 | string | pin.title | この操作面が表示中 | focus/10秒/復帰/streetChanges/編集・終了後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S013-F02 | 募集者 | string | display_name | この操作面が表示中 | focus/10秒/復帰/streetChanges/編集・終了後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S013-F03 | 終了時刻 | string | expires_at | この操作面が表示中 | focus/10秒/復帰/streetChanges/編集・終了後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S013-F04 | 題名入力 | string | title（本人のみ50文字） | この操作面が表示中 | focus/10秒/復帰/streetChanges/編集・終了後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S013-F05 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/10秒/復帰/streetChanges/編集・終了後 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S013-A01 | Mapへ/通報 |
| S013-A02 | 本人題名保存→recruitment_edit(revision) |
| S013-A03 | 本人終了→recruitment_end(revision) |
| S013-A04 | 再読込 |
| S013-A05 | 最新題名採用→[D005](02_SCREEN_SPECIFICATIONS.md#d005) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

loading/有効/dirty/終了/取得不能。dirty時の再取得はbaseline保持。not_foundでended、10秒/復帰/streetChanges更新。

**再起動・復元：** 保存未済題名は再起動で消える。位置/期限は編集不可。ブロック対象は非表示。

### E. 遷移

流入：Map/Home/通報確認。表示資格：会員。mineのみ編集。遷移・子面：[S001](02_SCREEN_SPECIFICATIONS.md#s001) [S019](02_SCREEN_SPECIFICATIONS.md#s019) [D005](02_SCREEN_SPECIFICATIONS.md#d005)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの題名・日時・定員/人数・公開地点・自分の権限に該当する情報とCの操作を保持。送信中/競合/期限終了を区別し、一般参加者へ名簿を公開しない。未送信入力と結果未確定の受付は別状態。

<a id="s014"></a>
## S014 運営入口・ダッシュボード

### A. 基本情報

- 用途：運営資格とMFA、招待監督。
- 関連要件：R17 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/admin.tsx`](<../../apps/mobile/src/app/admin.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useOperatorDashboard`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S014-F01 | 運営資格 | boolean | operator_status.operator | この操作面が表示中 | focus/追加認証/refresh/next/revoke | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S014-F02 | 準備完了 | boolean | operator_dashboard成功 | この操作面が表示中 | focus/追加認証/refresh/next/revoke | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S014-F03 | 有効会員数 | number | summary.active_members | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S014-F04 | 有効招待数 | number | summary.active_invitations | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S014-F05 | 招待発行者 | string／null | issuer_name（名前未設定） | 値ありの場合。分岐は取得元欄参照 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S014-F06 | 受領者 | string／null | recipient_name（参加済み/未使用fallback） | 値ありの場合。分岐は取得元欄参照 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S014-F07 | 無効化時刻 | string／null | revoked_at→無効化済み | 値ありの場合。分岐は取得元欄参照 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S014-F08 | 期限 | string | expires_at | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S014-F09 | ページ有無 | boolean | 100件取得ならmore | この操作面が表示中 | focus/追加認証/refresh/next/revoke | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S014-F10 | エラー | string | String(error) | 非空のerror/statusまたは結果がある時 | focus/追加認証/refresh/next/revoke | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S014-A01 | MFA→[S038](02_SCREEN_SPECIFICATIONS.md#s038)/[S039](02_SCREEN_SPECIFICATIONS.md#s039) |
| S014-A02 | 参加者→[S015](02_SCREEN_SPECIFICATIONS.md#s015)/通報→[S016](02_SCREEN_SPECIFICATIONS.md#s016)/ステッカー→[S020](02_SCREEN_SPECIFICATIONS.md#s020) |
| S014-A03 | 招待無効化→operator_invite_revoke |
| S014-A04 | 続きを表示cursor100件 |
| S014-A05 | 最新取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

未判定でも初期operator=falseの資格必要表示。非運営/運営未MFA/ready/通信失敗はready=falseへ戻る。失敗がMFAフォームに見える場合あり。

**再起動・復元：** blurでsecret/code/名簿/summary消去。サーバー資格をUIで付与しない。

### E. 遷移

流入：[S003](02_SCREEN_SPECIFICATIONS.md#s003)/名簿の追加認証。表示資格：入口は全員、機能はoperatorかつAAL2。遷移・子面：[S038](02_SCREEN_SPECIFICATIONS.md#s038) [S039](02_SCREEN_SPECIFICATIONS.md#s039) [S015](02_SCREEN_SPECIFICATIONS.md#s015) [S016](02_SCREEN_SPECIFICATIONS.md#s016) [S020](02_SCREEN_SPECIFICATIONS.md#s020)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s015"></a>
## S015 運営参加者一覧

### A. 基本情報

- 用途：会員状態と個別操作を選択。
- 関連要件：R17 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/members.tsx`](<../../apps/mobile/src/app/members.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useMembers / MemberRow / useMemberActions`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `ActivityIndicator`, `Empty`, `MemberRow`, `Page`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S015-F01 | 表示名 | string | operator_members.display_name | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S015-F02 | 状態 | string | withdrawn_at優先、activeで利用中/停止 | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S015-F03 | 展開対象 | string／null | selected account_id | 値ありの場合。分岐は取得元欄参照 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S015-F04 | ページ有無 | boolean | 100件取得でmore | この操作面が表示中 | focus/追加認証/refresh/next/revoke | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S015-F05 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/追加認証/refresh/next/revoke | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S015-A01 | 対象tapで一件展開S040 |
| S015-A02 | 最新取得/続きを表示 |
| S015-A03 | refreshは読込済全ページを再取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

busy indicator/空/失敗は一覧クリア/展開中。権限専用画面はなくエラー。

**再起動・復元：** blur一覧消去。個別行keyが状態変更で変わり入力を再初期化。

### E. 遷移

流入：[S014](02_SCREEN_SPECIFICATIONS.md#s014)。表示資格：運営＋MFA（API認可）。遷移・子面：[S040](02_SCREEN_SPECIFICATIONS.md#s040) [D006](02_SCREEN_SPECIFICATIONS.md#d006) [S037](02_SCREEN_SPECIFICATIONS.md#s037)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s016"></a>
## S016 運営通報対応

### A. 基本情報

- 用途：証拠確認・元投稿削除・対応終了。
- 関連要件：R16 R17 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/moderation.tsx`](<../../apps/mobile/src/app/moderation.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useModeration`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S016-F01 | 対象種別 | string | target_kind翻訳 | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S016-F02 | 理由 | string | reason翻訳 | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S016-F03 | 説明 | string | description | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S016-F04 | 証拠題名 | string? | evidence.title | 値ありの場合。分岐は取得元欄参照 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S016-F05 | 証拠本文 | string? | evidence.body ?? evidence.description | 値ありの場合。分岐は取得元欄参照 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S016-F06 | 整理対象 | boolean | review_due | この操作面が表示中 | focus/追加認証/refresh/next/revoke | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S016-F07 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/追加認証/refresh/next/revoke | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S016-A01 | event/recruitment詳細へ |
| S016-A02 | messageのみ元投稿削除D007→operator_message_delete(report id) |
| S016-A03 | handled/no_action→operator_report_resolve |
| S016-A04 | 最新取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

loading/未対応なし/証拠あり/処理中/権限通信エラー。失敗も一覧再取得、成功後streetChanges。

**再起動・復元：** 証拠はDB保持、通常投稿削除でも証拠は期限まで残る。画面に通報者・作成日時は表示しない。

### E. 遷移

流入：[S014](02_SCREEN_SPECIFICATIONS.md#s014)。表示資格：運営＋MFA。遷移・子面：[S011](02_SCREEN_SPECIFICATIONS.md#s011) [S013](02_SCREEN_SPECIFICATIONS.md#s013) [D007](02_SCREEN_SPECIFICATIONS.md#d007)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s017"></a>
## S017 利用資格・再ログイン案内

### A. 基本情報

- 用途：停止/退会/期限切れを表示。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/access.tsx`](<../../apps/mobile/src/app/access.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`AccountAccessContext / native.logout`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Page`, `Text`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S017-F01 | 見出し | string | withdrawn=退会済み、expired=再ログインが必要、他=利用停止中 | この操作面が表示中 | access retry/session資格変化 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S017-F02 | エラー | string | logout失敗 | 非空のerror/statusまたは結果がある時 | access retry/session資格変化 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S017-A01 | 状態を確認→access.retry |
| S017-A02 | logout→rootガード |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

状態確認で復帰可。解除だけで滞在/イベント参加は復活しない。独自busy/停止理由表示なし。

**再起動・復元：** この画面固有の永続入力なし。認証・資格はrootから復元し、API画面は再取得する。

### E. 遷移

流入：rootガード。表示資格：suspended/withdrawn/expired。遷移・子面：[S024](02_SCREEN_SPECIFICATIONS.md#s024) [S001](02_SCREEN_SPECIFICATIONS.md#s001)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s018"></a>
## S018 ピン作成

### A. 基本情報

- 用途：募集/イベントの作成受付。
- 関連要件：R12 R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/pins/create.tsx`](<../../apps/mobile/src/app/pins/create.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`usePinCreation / pinDraft / commands`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `EventDateField`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S018-F01 | 種別 | enum | draft.kind（初期recruitment） | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S018-F02 | 題名 | string | draft.title（50） | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 初期空欄／placeholder（明記した既定値は例外） | 入力/選択可。条件はC・D参照 |
| S018-F03 | 復元中 | boolean | restoring | この操作面が表示中 | 入力/測位/受付復元/送信結果 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S018-F04 | エラー | string | error | 非空のerror/statusまたは結果がある時 | 入力/測位/受付復元/送信結果 | エラー表示なし | 不可（操作結果・データ再取得で変化） |
| S018-F05 | 固定送信本文 | boolean | eventBody/recruitBodyでlocked | この操作面が表示中 | 入力/測位/受付復元/送信結果 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S018-A01 | 種別切替/各入力→draft |
| S018-A02 | 作成→共通command→詳細へreplace |
| S018-A03 | 前回送信確認して入力し直す→command_cancel（完了済なら詳細） |
| S018-A04 | 閉じる→back |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

復元中/入力中/本文固定/送信中/結果不明。busy/locked時は種別・題名・イベント項目不可。 restore失敗は開き直しを案内。作成ボタン自体はbusy/空題名で無効化され、追加の整合性はhook/APIで確認。

**再起動・復元：** 未送信draftはメモリのみ。送信受付済本文はSecureStore、再起動復元。

### E. 遷移

流入：Map/Home作成。表示資格：会員。募集は当該端末の有効入街が必要。遷移・子面：[S041](02_SCREEN_SPECIFICATIONS.md#s041) [S042](02_SCREEN_SPECIFICATIONS.md#s042) [S043](02_SCREEN_SPECIFICATIONS.md#s043) [S037](02_SCREEN_SPECIFICATIONS.md#s037) [S011](02_SCREEN_SPECIFICATIONS.md#s011) [S013](02_SCREEN_SPECIFICATIONS.md#s013)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの題名・日時・定員/人数・公開地点・自分の権限に該当する情報とCの操作を保持。送信中/競合/期限終了を区別し、一般参加者へ名簿を公開しない。未送信入力と結果未確定の受付は別状態。

<a id="s019"></a>
## S019 通報フォーム

### A. 基本情報

- 用途：対象投稿/募集/イベントを運営へ報告。
- 関連要件：R16（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/report.tsx`](<../../apps/mobile/src/app/report.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`native.rpc(report_create)`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S019-F01 | 理由 | enum | spam/harassment/other（初期spam） | この操作面が表示中 | 入力/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S019-F02 | 説明 | string | description（任意1000） | この操作面が表示中 | 入力/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S019-F03 | 対象 | route | kind/idは画面に直接表示しない | この操作面が表示中 | 入力/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S019-F04 | エラー | string | error | 非空のerror/statusまたは結果がある時 | 入力/送信結果 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S019-A01 | 理由tap/説明入力 |
| S019-A02 | 送信→report_create→[S047](02_SCREEN_SPECIFICATIONS.md#s047) |
| S019-A03 | backで破棄 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

busyで送信のみ停止、理由/入力は停止しない。成功sent→受付完了。UIだけのref排他なし、サーバーは同一通報再利用。

**再起動・復元：** フォームは永続なし。

### E. 遷移

流入：チャット長押し/各詳細。表示資格：会員、route kind/idをAPIで検証。遷移・子面：[S047](02_SCREEN_SPECIFICATIONS.md#s047)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s020"></a>
## S020 ステッカー一覧・新規登録

### A. 基本情報

- 用途：登録一覧と下書き準備。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/index.tsx`](<../../apps/mobile/src/app/stickers/index.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useStickerRegistration / commands`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S020-F01 | 管理名 | string | title（50、必須） | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S020-F02 | 選択地点 | tuple | point（ボタン文言だけ） | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S020-F03 | 未確定登録 | boolean | pending | この操作面が表示中 | focus/追加認証/refresh/next/revoke | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S020-F04 | 登録名 | string | items.title | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S020-F05 | 工程 | enum | phase→書込待ち/照合待ち/設置待ち/公開待ち/公開済み | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S020-F06 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/追加認証/refresh/next/revoke | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S020-A01 | 管理名入力/場所→[S049](02_SCREEN_SPECIFICATIONS.md#s049) |
| S020-A02 | 登録開始→sticker_create command→[S021](02_SCREEN_SPECIFICATIONS.md#s021) |
| S020-A03 | 未確定取消→command_cancel（成功済は詳細へ） |
| S020-A04 | 一覧tap詳細/範囲→[S022](02_SCREEN_SPECIFICATIONS.md#s022) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

loading/空/未確定（入力固定）/busy/認証通信失敗。

**再起動・復元：** 未確定command本文復元。通常の未送信入力は永続なし。

### E. 遷移

流入：[S014](02_SCREEN_SPECIFICATIONS.md#s014)。表示資格：運営＋MFA。遷移・子面：[S048](02_SCREEN_SPECIFICATIONS.md#s048) [S049](02_SCREEN_SPECIFICATIONS.md#s049) [S021](02_SCREEN_SPECIFICATIONS.md#s021) [S022](02_SCREEN_SPECIFICATIONS.md#s022)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s021"></a>
## S021 ステッカー詳細

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。部分実装：開発用代替の工程接続あり、実NFC読書未確認。
- 接続：`useStickerDetail / stickerTouch`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S021-F01 | 管理名 | string | draft.title（未取得ステッカー） | この操作面が表示中 | focus/再取得/工程・保存結果 | 初期空欄／placeholder（明記した既定値は例外） | 不可（操作結果・データ再取得で変化） |
| S021-F02 | 緯度 | number | latitude.toFixed(5) | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S021-F03 | 経度 | number | longitude.toFixed(5) | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S021-F04 | 工程 | enum | draft.phase→操作ボタン | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S021-F05 | 代用説明 | boolean | localStickerAdapter | この操作面が表示中 | focus/再取得/工程・保存結果 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S021-F06 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/再取得/工程・保存結果 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S021-A01 | 未公開のみ編集/登録取消 |
| S021-A02 | draft→書込確認D008→stickerTouch(write)→sticker_step(written) |
| S021-A03 | written→読取一致→verified |
| S021-A04 | verified→設置確認→installed |
| S021-A05 | installed/published→範囲 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

取得不能時draft消去/各工程/busy/書込・照合失敗/期限切れ。移設は既にwritten開始の場合あり。

**再起動・復元：** 下書きDB7日。focus再取得。NFC処理の離脱は世代チェックで後段更新抑止。

### E. 遷移

流入：[S020](02_SCREEN_SPECIFICATIONS.md#s020)/S022移設・交換。表示資格：運営＋MFA。遷移・子面：[S050](02_SCREEN_SPECIFICATIONS.md#s050) [S051](02_SCREEN_SPECIFICATIONS.md#s051) [S052](02_SCREEN_SPECIFICATIONS.md#s052) [S053](02_SCREEN_SPECIFICATIONS.md#s053) [S054](02_SCREEN_SPECIFICATIONS.md#s054) [S022](02_SCREEN_SPECIFICATIONS.md#s022) [D008](02_SCREEN_SPECIFICATIONS.md#d008) [D009](02_SCREEN_SPECIFICATIONS.md#d009) [S062](02_SCREEN_SPECIFICATIONS.md#s062) [S063](02_SCREEN_SPECIFICATIONS.md#s063)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s022"></a>
## S022 街範囲・設置管理

### A. 基本情報

- 用途：公開範囲と移設/交換/停止。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/area.tsx`](<../../apps/mobile/src/app/stickers/area.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`placement_list / sticker_list / sticker_preview/publish/suspend / submitCommand`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Camera`, `Empty`, `GeoJSONSource`, `Layer`, `LocationPicker`, `Map`, `Modal`, `Page`, `Placement`, `Preview`, `StickerDraft`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S022-F01 | 公開待ち管理名 | string | drafts phase=installed | この操作面が表示中 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S022-F02 | 選択 | boolean | selected IDs（初期全installed） | この操作面が表示中 | 初回/再取得/preview/publish/変更後 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S022-F03 | プレビュー有効 | boolean | preview.valid | この操作面が表示中 | 初回/再取得/preview/publish/変更後 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S022-F04 | 外周 | GeoJSON.Polygon | preview.boundary | この操作面が表示中 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S022-F05 | 設置管理名 | string | placements.title | この操作面が表示中 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S022-F06 | 設置状態 | string | retired/active→廃止/有効/停止中 | この操作面が表示中 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S022-F07 | エラー | string | error | 非空のerror/statusまたは結果がある時 | 初回/再取得/preview/publish/変更後 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S022-A01 | 選択切替でpreview破棄 |
| S022-A02 | プレビューAPI |
| S022-A03 | validのみD010公開 |
| S022-A04 | 移設→[S055](02_SCREEN_SPECIFICATIONS.md#s055)→[D012](02_SCREEN_SPECIFICATIONS.md#d012)→sticker_create(tag_id)→[S021](02_SCREEN_SPECIFICATIONS.md#s021) |
| S022-A05 | 交換D011→create(replaces_tag)→[S021](02_SCREEN_SPECIFICATIONS.md#s021) |
| S022-A06 | 有効タグ停止D013→sticker_suspend(revision) |
| S022-A07 | 最新取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

地点不足/一直線は旧範囲維持を説明。busyで主操作不可。取得loading/空専用表示なし。失敗は汎用error＋再取得。

**再起動・復元：** preview/selected/movingはメモリ。公開はAPI確定。範囲変更だけでは一斉退出しない。

### E. 遷移

流入：[S020](02_SCREEN_SPECIFICATIONS.md#s020)/[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[S055](02_SCREEN_SPECIFICATIONS.md#s055) [D010](02_SCREEN_SPECIFICATIONS.md#d010) [D011](02_SCREEN_SPECIFICATIONS.md#d011) [D012](02_SCREEN_SPECIFICATIONS.md#d012) [S021](02_SCREEN_SPECIFICATIONS.md#s021)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s023"></a>
## S023 地点選択route

### A. 基本情報

- 用途：イベント作成の場所を選ぶ。
- 関連要件：R13 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/pins/location.tsx`](<../../apps/mobile/src/app/pins/location.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`LocationPicker / usePinDraft`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`LocationPicker`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S023-F01 | 選択地点 | tuple? | draft.location→point | 値ありの場合。分岐は取得元欄参照 | 地図tap/決定 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S023-F02 | 地図 | style | mapStyle（初期池袋） | この操作面が表示中 | 地図tap/決定 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S023-F03 | 選択点 | Marker | pointがある時のみ | この操作面が表示中 | 地図tap/決定 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S023-A01 | 地図tap→point |
| S023-A02 | 決定→updateDraft(location)→back |
| S023-A03 | 戻る→back（未確定point破棄） |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

未選択は決定無効。地図タイル失敗の専用UIなし。

**再起動・復元：** 作成draftは同プロセス往復保持、単なる選択ではDB変更なし。

### E. 遷移

流入：[S042](02_SCREEN_SPECIFICATIONS.md#s042)。表示資格：会員。遷移・子面：[S018](02_SCREEN_SPECIFICATIONS.md#s018)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s024"></a>
## S024 メールOTP・送信前

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/StreetLogin.tsx`](<../../apps/mobile/src/components/StreetLogin.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Pressable`, `SafeAreaView`, `ScrollView`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S024-F01 | メール | string | email（空初期値） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S024-F02 | エラー | string | error | 非空のerror/statusまたは結果がある時 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | エラー表示なし | 不可（操作結果・データ再取得で変化） |
| S024-F03 | 開発案内 | string | localEntry時だけMailpit案内 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S024-A01 | メール入力 |
| S024-A02 | 確認コードを送る→useStreetMap.login→native.sendOTP→[S025](02_SCREEN_SPECIFICATIONS.md#s025) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

busyまたはメール空は送信無効。メール入力自体はbusyでも編集可能。形式検証はAuth応答。失敗は同画面error。

**再起動・復元：** email/code/sentはメモリ、再起動後は保存sessionから分岐。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S025](02_SCREEN_SPECIFICATIONS.md#s025)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s025"></a>
## S025 メールOTP・コード入力

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/StreetLogin.tsx`](<../../apps/mobile/src/components/StreetLogin.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Pressable`, `SafeAreaView`, `ScrollView`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S025-F01 | メール | string | email（引き続き編集可） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S025-F02 | コード | string | code（number-pad、maxLengthなし） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S025-F03 | エラー | string | error | 非空のerror/statusまたは結果がある時 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | エラー表示なし | 不可（操作結果・データ再取得で変化） |
| S025-F04 | 送信中表示 | string | 確認中… | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S025-A01 | ログイン→native.verifyOTP→session更新→root資格判定 |
| S025-A02 | メールを確認・再送→sent=false/codeとerrorを消してS024（この操作だけでは送信しない） |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

busyまたはメール空は主操作無効。コード桁数のUI無効化はなし。失敗はcode画面維持。

**再起動・復元：** 滞在はnative journalから復元。snapshotはメモリ。精密現在地は再センタリングのみ。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S024](02_SCREEN_SPECIFICATIONS.md#s024) [S031](02_SCREEN_SPECIFICATIONS.md#s031) [S004](02_SCREEN_SPECIFICATIONS.md#s004) [S005](02_SCREEN_SPECIFICATIONS.md#s005) [S001](02_SCREEN_SPECIFICATIONS.md#s001) [S017](02_SCREEN_SPECIFICATIONS.md#s017)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s026"></a>
## S026 入街・共有説明

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/StreetEntrySheet.tsx`](<../../apps/mobile/src/components/StreetEntrySheet.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`ActivityIndicator`, `Modal`, `Pressable`, `SafeAreaView`, `ScrollView`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S026-F01 | 見出し | string | 街に参加する | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S026-F02 | 説明 | string | 背景共有/名前と正確な位置非表示/OFF停止 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S026-F03 | 開始ボタン | string | localEntryなら開発用タグ、それ以外NFCを読み取る | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S026-A01 | 開始→scan→[S027](02_SCREEN_SPECIFICATIONS.md#s027) |
| S026-A02 | キャンセル/Modal close→setSheet(null)、まだ退出しない |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

explain中のみ開始Action。入街/人数増加は開始前には実行しない。

**再起動・復元：** 滞在はnative journalから復元。snapshotはメモリ。精密現在地は再センタリングのみ。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S001](02_SCREEN_SPECIFICATIONS.md#s001) [S027](02_SCREEN_SPECIFICATIONS.md#s027) [S059](02_SCREEN_SPECIFICATIONS.md#s059) [S060](02_SCREEN_SPECIFICATIONS.md#s060)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの人数/気配/滞在状態とCのOFF/取消を維持。気配0を無人と断言せず、背景共有の意思・精密位置との違いを区別する。scanning/checking取消とexplain/success閉じるは別処理。

<a id="s027"></a>
## S027 入街・読取待ち

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/StreetEntrySheet.tsx`](<../../apps/mobile/src/components/StreetEntrySheet.tsx>)。部分実装/検証待ち：NFC接続ロジックあり、実タグ未確認。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`ActivityIndicator`, `Modal`, `Pressable`, `SafeAreaView`, `ScrollView`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S027-F01 | 見出し | string | ステッカーにタッチ | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S027-F02 | 進行表示 | spinner | NFC読取待ち | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S027-F03 | 補足 | string | 標準NFC画面/読み取ったら離してよい（開発時は代用説明） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S027-A01 | 取消/Modal close→exit |
| S027-A02 | NFC結果→scan継続→[S056](02_SCREEN_SPECIFICATIONS.md#s056) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

読取中/読取失敗。失敗は親errorへ、成功確定前のcancelは退出処理と連動。

**再起動・復元：** native側世代・受付取消で遅延結果を抑止。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S056](02_SCREEN_SPECIFICATIONS.md#s056) [S001](02_SCREEN_SPECIFICATIONS.md#s001) [S060](02_SCREEN_SPECIFICATIONS.md#s060)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの人数/気配/滞在状態とCのOFF/取消を維持。気配0を無人と断言せず、背景共有の意思・精密位置との違いを区別する。scanning/checking取消とexplain/success閉じるは別処理。

<a id="s028"></a>
## S028 街チャット・縮小

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/StreetChat.tsx`](<../../apps/mobile/src/components/StreetChat.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useStreetChat / useChatComposer`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Avatar`, `BlurView`, `ComponentRef`, `KeyboardAvoidingView`, `Pressable`, `SafeAreaView`, `ScrollView`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S028-F01 | 名前 | string | Message.display_name（退会/削除はAPI表示値） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S028-F02 | 本人画像 | string? | avatar_path/avatar_updated_at→Avatar fallback | 値ありの場合。分岐は取得元欄参照 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S028-F03 | 時刻 | string | created_at→時刻 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S028-F04 | 本文 | string? | deletedなら削除表示、arrivalなら入街文言 | 値ありの場合。分岐は取得元欄参照 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S028-F05 | 新着表示 | boolean | 追従していない時hasNew（件数表示なし） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S028-F06 | 入力 | string | useChatComposer.text（500文字） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S028-F07 | 制限日時 | string? | chatRestrictedUntil | 値ありの場合。分岐は取得元欄参照 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S028-F08 | 送信エラー | string | composer.error | 非空のerror/statusまたは結果がある時 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | エラー表示なし | 不可（操作結果・データ再取得で変化） |
| S028-F09 | 履歴エラー | string | chat.error | 非空のerror/statusまたは結果がある時 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | エラー表示なし | 不可（操作結果・データ再取得で変化） |
| S028-F10 | 未確定送信 | boolean | pendingなら結果を確認/未確定の送信を取り消して編集 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S028-F11 | 復元失敗 | boolean | restoreFailedなら送信状態を再取得 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S028-F12 | 復元中 | boolean | restoring | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S028-A01 | 入力/送信→chat_post command |
| S028-A02 | 履歴スクロール/過去取得→[S029](02_SCREEN_SPECIFICATIONS.md#s029) |
| S028-A03 | 新着tap→末尾 |
| S028-A04 | 長押し→[D014](02_SCREEN_SPECIFICATIONS.md#d014) |
| S028-A05 | 送信状態を再取得→composer.restore |
| S028-A06 | 未確定の送信を取り消して編集→composer.revise（成功済なら送信済みとして扱う） |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

未取得/投稿なし/読み込み/送信中/未確定送信復元/制限中/通信断。投稿不要で眺められる。

**再起動・復元：** 通常入力はhookメモリ。送信受付済本文はSecureStore。履歴は取得し直す。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S029](02_SCREEN_SPECIFICATIONS.md#s029) [D014](02_SCREEN_SPECIFICATIONS.md#d014) [S019](02_SCREEN_SPECIFICATIONS.md#s019)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

本人の名前/画像/時刻/本文、入街ログと通常投稿、削除状態、投稿制限、履歴位置、未確定送信を区別。地図の流動アイコンで本人の発言者画像を置き換えない。

<a id="s029"></a>
## S029 街チャット・拡大

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/StreetChat.tsx`](<../../apps/mobile/src/components/StreetChat.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`StreetChat local state / useStreetChat`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Avatar`, `BlurView`, `ComponentRef`, `KeyboardAvoidingView`, `Pressable`, `SafeAreaView`, `ScrollView`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S029-F01 | 投稿フィールド | Message[] | S028と同一 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S029-F02 | 縮小操作 | string | 閉じる | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S029-F03 | 取得中 | boolean | loading | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S029-F04 | 利用可能領域 | number | onLayoutとKeyboardAvoidingView | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S029-A01 | 過去を読む→chat_list cursor |
| S029-A02 | 閉じる→縮小 |
| S029-A03 | 送信/長押しはS028同じ |
| S029-A04 | 背景blur |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

表示領域拡大とキーボード位置調整。拡大は別のチャット購読ではない。古い履歴取得中は重複取得抑止。

**再起動・復元：** 同じcomposerを維持し縮小でも入力を保持。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S028](02_SCREEN_SPECIFICATIONS.md#s028) [D014](02_SCREEN_SPECIFICATIONS.md#d014)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

本人の名前/画像/時刻/本文、入街ログと通常投稿、削除状態、投稿制限、履歴位置、未確定送信を区別。地図の流動アイコンで本人の発言者画像を置き換えない。

<a id="s030"></a>
## S030 アカウント・接続状態Modal

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/(tabs)/index.tsx`](<../../apps/mobile/src/app/(tabs)/index.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`ActivityIndicator`, `Camera`, `CameraRef`, `Map`, `Modal`, `PresenceHeader`, `Pressable`, `SafeAreaView`, `StreetChat`, `StreetEntrySheet`, `StreetLogin`, `StreetMapMarkers`, `Switch`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S030-F01 | メール | string | session.email | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S030-F02 | 接続先 | string | url | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S030-F03 | 滞在状態 | string | state.status | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S030-F04 | 開発操作 | string | __DEV__ && !nfcDisabledの時のみテストタグ書込 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S030-A01 | ログアウト→native.logout |
| S030-A02 | 閉じる→accountPanel=false |
| S030-A03 | 開発タグ書込→[D015](02_SCREEN_SPECIFICATIONS.md#d015) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

ログアウト失敗は親error。運営管理画面ではない。サーバーURL等は現行検証用表示。

**再起動・復元：** 滞在はnative journalから復元。snapshotはメモリ。精密現在地は再センタリングのみ。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S001](02_SCREEN_SPECIFICATIONS.md#s001) [S024](02_SCREEN_SPECIFICATIONS.md#s024) [D015](02_SCREEN_SPECIFICATIONS.md#d015)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s031"></a>
## S031 招待コード受領フォーム

### A. 基本情報

- 用途：招待受領・発行・共有・停止の専用操作。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/invitations.tsx`](<../../apps/mobile/src/app/invitations.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S031-F01 | コード | string | code | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S031-F02 | 結果 | string | status | 非空のerror/statusまたは結果がある時 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S031-A01 | 受け取ったコードを入力→accept→invite_accept→access.retry |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

busyで受領不可。既に別会員が使った/期限切れ/停止はエラー。同じ会員の再送はDB契約。

**再起動・復元：** コード表示はblur時クリア、一覧は再取得。未確定発行はSecureStore command復元。

### E. 遷移

流入：[S006](02_SCREEN_SPECIFICATIONS.md#s006)。表示資格：認証済み未登録は受領のみ。会員は発行と受領フォーム。遷移・子面：[S004](02_SCREEN_SPECIFICATIONS.md#s004) [S005](02_SCREEN_SPECIFICATIONS.md#s005) [S001](02_SCREEN_SPECIFICATIONS.md#s001) [S006](02_SCREEN_SPECIFICATIONS.md#s006)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s032"></a>
## S032 招待発行・共有フォーム

### A. 基本情報

- 用途：招待受領・発行・共有・停止の専用操作。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/invitations.tsx`](<../../apps/mobile/src/app/invitations.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S032-F01 | 新規コード | string? | issued.code（selectable） | 値ありの場合。分岐は取得元欄参照 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S032-F02 | 発行説明 | string | 7日/週5件の固定文言 | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S032-F03 | 前回未確定 | boolean | pending | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S032-F04 | 既存招待一覧 | Invite[] | S006 | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S032-A01 | 招待を発行→submitCommand invite_create |
| S032-A02 | 前回確認→既存受付再送 |
| S032-A03 | 共有→Share.share |
| S032-A04 | 停止→invite_revoke |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

未確定は別発行を抑止。復帰時受付復元。共有を閉じても招待は無効にならない。

**再起動・復元：** コード表示はblur時クリア、一覧は再取得。未確定発行はSecureStore command復元。

### E. 遷移

流入：[S006](02_SCREEN_SPECIFICATIONS.md#s006)。表示資格：認証済み未登録は受領のみ。会員は発行と受領フォーム。遷移・子面：[S045](02_SCREEN_SPECIFICATIONS.md#s045) [S006](02_SCREEN_SPECIFICATIONS.md#s006)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s033"></a>
## S033 メール変更・新旧確認

### A. 基本情報

- 用途：メール変更・退会入口の専用操作。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/account.tsx`](<../../apps/mobile/src/app/account.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useEmailChange`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S033-F01 | 新メール | string | email | この操作面が表示中 | focus/メール変更・確認後load | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S033-F02 | 旧メールコード | string | oldCode | この操作面が表示中 | focus/メール変更・確認後load | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S033-F03 | 新メールコード | string | newCode | この操作面が表示中 | focus/メール変更・確認後load | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S033-F04 | 変更状態 | string | pendingEmail | この操作面が表示中 | focus/メール変更・確認後load | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S033-F05 | 結果 | string | status | 非空のerror/statusまたは結果がある時 | focus/メール変更・確認後load | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S033-A01 | メール変更申請→native.changeEmail |
| S033-A02 | コード確認→native.verifyEmailChange |
| S033-A03 | 再取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

各コード最大8、6文字以上で確認可能。通信結果不明は状態再取得。アプリ離脱時コードを消す。

**再起動・復元：** Authのnew_emailは復元、入力コードは復元しない。

### E. 遷移

流入：[S009](02_SCREEN_SPECIFICATIONS.md#s009)。表示資格：認証済み会員。遷移・子面：[S009](02_SCREEN_SPECIFICATIONS.md#s009)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s034"></a>
## S034 退会・再認証フォーム

### A. 基本情報

- 用途：再認証して資格と関連情報を終了の専用操作。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/withdraw.tsx`](<../../apps/mobile/src/app/withdraw.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useWithdrawal`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S034-F01 | 確認コード | string | code | この操作面が表示中 | 操作結果のみ | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S034-F02 | 確認段階 | boolean | request有無 | この操作面が表示中 | 操作結果のみ | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S034-F03 | エラー | string | error | 非空のerror/statusまたは結果がある時 | 操作結果のみ | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S034-A01 | コード送信→withdraw_prepare＋native.sendOTP |
| S034-A02 | 退会する→D002承認後にverifyOTP→withdraw_confirm→logout |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

送信/照合/削除段階でbusy。取消は会員を消さない。受付切れは準備からやり直す。

**再起動・復元：** 受付/入力はReact state、再起動後は開始から。サーバー退会状態は残る。

### E. 遷移

流入：[S010](02_SCREEN_SPECIFICATIONS.md#s010)。表示資格：認証済み会員。遷移・子面：[D002](02_SCREEN_SPECIFICATIONS.md#d002) [S010](02_SCREEN_SPECIFICATIONS.md#s010)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s035"></a>
## S035 イベント参加者一覧

### A. 基本情報

- 用途：参加・取消・名簿・主催操作の専用操作。
- 関連要件：R13 R14（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/events/[id].tsx`](<../../apps/mobile/src/app/events/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useEventDetail.loadRoster`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S035-F01 | 参加者名 | string[] | event_roster.items.display_name（名前以外の個人情報は表示なし） | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S035-F02 | エラー | string | error（詳細と共用） | 非空のerror/statusまたは結果がある時 | focus/10秒/復帰/streetChanges/操作後 | エラー表示なし | 不可（操作結果・データ再取得で変化） |
| S035-F03 | 読み込み表示 | boolean | rosterLoading | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S035-F04 | 空表示 | string | roster.length===0なら参加者はまだいません | この操作面が表示中 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S035-A01 | 参加者一覧ボタン→event_roster→詳細内に列挙 |
| S035-A02 | operatorかつerrorあり→運営の追加認証→[S014](02_SCREEN_SPECIFICATIONS.md#s014) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

主催者またはoperatorのみボタン。APIは運営MFAも検証。一般閲覧者には人数のみ。0人は「参加者はまだいません」。

**再起動・復元：** 詳細離脱/イベント変更で再取得。

### E. 遷移

流入：[S011](02_SCREEN_SPECIFICATIONS.md#s011)。表示資格：会員。名簿は主催者またはMFA運営。遷移・子面：[S011](02_SCREEN_SPECIFICATIONS.md#s011) [S014](02_SCREEN_SPECIFICATIONS.md#s014)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの題名・日時・定員/人数・公開地点・自分の権限に該当する情報とCの操作を保持。送信中/競合/期限終了を区別し、一般参加者へ名簿を公開しない。未送信入力と結果未確定の受付は別状態。

<a id="s036"></a>
## S036 イベント編集・地点Modal

### A. 基本情報

- 用途：主催イベント更新の専用操作。
- 関連要件：R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/events/edit/[id].tsx`](<../../apps/mobile/src/app/events/edit/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`LocationPicker / useEventEditor`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `EventDateField`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S036-F01 | 地図 | style | mapStyle | この操作面が表示中 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S036-F02 | 仮地点 | tuple? | editor point | 値ありの場合。分岐は取得元欄参照 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S036-A01 | tap→仮point |
| S036-A02 | 決定→editor.location更新して閉じる |
| S036-A03 | 閉じる→取消 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

開催前の編集可能時のみ。位置変更だけではDB保存しない。

**再起動・復元：** 未保存編集はメモリ、focus時loadが上書き。共通commandの永続再送対象ではない。

### E. 遷移

流入：[S012](02_SCREEN_SPECIFICATIONS.md#s012)。表示資格：mine=true、DBでも主催認可。遷移・子面：[S012](02_SCREEN_SPECIFICATIONS.md#s012)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s037"></a>
## S037 日時選択sheet（共通）

### A. 基本情報

- 用途：募集/イベントの作成受付の専用操作。
- 関連要件：R12 R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/EventDateField.tsx`](<../../apps/mobile/src/components/EventDateField.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`EventDateField local state`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Date`, `DateTimePicker`, `Modal`, `Pressable`, `SafeAreaView`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S037-F01 | 項目名 | string | label prop | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S037-F02 | 日時 | Date | 既存有効value、suggested、または現在+1h | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S037-F03 | picker | datetime spinner | 端末ロケール | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S037-A01 | 日時回転→editing |
| S037-A02 | 決定→onChange(ISO8601)→閉じる |
| S037-A03 | キャンセル/Modal close→editing=null |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

disabled時はModal非表示。開くと秒/ミリ秒0。開始・終了の相関検証は呼出元eventInput/API。

**再起動・復元：** 未確定日時はModal local state。

### E. 遷移

流入：[S018](02_SCREEN_SPECIFICATIONS.md#s018)。表示資格：会員。募集は当該端末の有効入街が必要。遷移・子面：[S018](02_SCREEN_SPECIFICATIONS.md#s018) [S012](02_SCREEN_SPECIFICATIONS.md#s012) [S040](02_SCREEN_SPECIFICATIONS.md#s040)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s038"></a>
## S038 運営TOTP登録

### A. 基本情報

- 用途：運営資格とMFA、招待監督の専用操作。
- 関連要件：R17 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/admin.tsx`](<../../apps/mobile/src/app/admin.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useOperatorDashboard`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S038-F01 | 秘密鍵 | string | enrollment.secret（selectable） | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S038-F02 | 確認コード | string | code（6桁） | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S038-F03 | 説明 | string | 認証アプリへの登録 | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S038-F04 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/追加認証/refresh/next/revoke | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S038-A01 | 登録開始→native.mfaEnroll |
| S038-A02 | コード入力→mfaVerify→ready |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

運営資格あり/未検証factorのみ。QR画像なし。blurで秘密とコードをクリア。

**再起動・復元：** blurでsecret/code/名簿/summary消去。サーバー資格をUIで付与しない。

### E. 遷移

流入：[S014](02_SCREEN_SPECIFICATIONS.md#s014)。表示資格：入口は全員、機能はoperatorかつAAL2。遷移・子面：[S039](02_SCREEN_SPECIFICATIONS.md#s039) [S014](02_SCREEN_SPECIFICATIONS.md#s014)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s039"></a>
## S039 運営TOTP追加認証

### A. 基本情報

- 用途：運営資格とMFA、招待監督の専用操作。
- 関連要件：R17 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/admin.tsx`](<../../apps/mobile/src/app/admin.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useOperatorDashboard`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S039-F01 | コード | string | code（6桁） | この操作面が表示中 | focus/追加認証/refresh/next/revoke | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S039-F02 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/追加認証/refresh/next/revoke | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S039-A01 | 確認→native.mfaVerify→operator_status再取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

既にverified factorあり。成功で運営ダッシュボード。失敗は同画面。

**再起動・復元：** 資格はDB、追加認証はAuthセッション。

### E. 遷移

流入：[S014](02_SCREEN_SPECIFICATIONS.md#s014)。表示資格：入口は全員、機能はoperatorかつAAL2。遷移・子面：[S014](02_SCREEN_SPECIFICATIONS.md#s014)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s040"></a>
## S040 会員制限操作フォーム

### A. 基本情報

- 用途：会員状態と個別操作を選択の専用操作。
- 関連要件：R17 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/MemberRow.tsx`](<../../apps/mobile/src/components/MemberRow.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useMemberActions`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `EventDateField`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S040-F01 | 理由 | string | reason（500、必須） | この操作面が表示中 | focus/再読込/続きを表示/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S040-F02 | 投稿制限終了 | ISOstring | until | この操作面が表示中 | focus/再読込/続きを表示/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S040-F03 | 週招待枠 | string | limit（数値0〜1000） | この操作面が表示中 | focus/再読込/続きを表示/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S040-F04 | 投稿制限中 | boolean | member.chat_restricted_until | この操作面が表示中 | focus/再読込/続きを表示/操作後 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S040-F05 | 利用停止中 | boolean | !member.active | この操作面が表示中 | focus/再読込/続きを表示/操作後 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S040-F06 | 招待停止 | boolean | invite_paused | この操作面が表示中 | focus/再読込/続きを表示/操作後 | false/未確定時は対応操作・印を表示しない | 不可（操作結果・データ再取得で変化） |
| S040-F07 | 退会日時 | string? | withdrawn_at | 値ありの場合。分岐は取得元欄参照 | focus/再読込/続きを表示/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S040-A01 | 投稿制限設定/解除→operator_member_* |
| S040-A02 | 招待枠保存/停止/再開 |
| S040-A03 | 利用停止/解除→[D006](02_SCREEN_SPECIFICATIONS.md#d006) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

展開中のみフォーム。退会済みは操作なし。busy時操作無効。API拒否はerror、最新一覧を再取得。

**再起動・復元：** 展開解除・member値変化でフォーム破棄されうる。

### E. 遷移

流入：[S015](02_SCREEN_SPECIFICATIONS.md#s015)。表示資格：運営＋MFA（API認可）。遷移・子面：[S037](02_SCREEN_SPECIFICATIONS.md#s037) [D006](02_SCREEN_SPECIFICATIONS.md#d006) [S015](02_SCREEN_SPECIFICATIONS.md#s015)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s041"></a>
## S041 募集ピン作成タブ

### A. 基本情報

- 用途：募集/イベントの作成受付の専用操作。
- 関連要件：R12 R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/pins/create.tsx`](<../../apps/mobile/src/app/pins/create.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`usePinCreation`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `EventDateField`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S041-F01 | 題名 | string | draft.title（50、trim必須） | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 初期空欄／placeholder（明記した既定値は例外） | 入力/選択可。条件はC・D参照 |
| S041-F02 | 説明 | string | 現在地を公開する | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S041-F03 | 状態 | string | 準備/取得中/位置確定 | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S041-A01 | 現在地取得→native.currentLocation＋get_my_visit→[S043](02_SCREEN_SPECIFICATIONS.md#s043) |
| S041-A02 | タブ切替→[S042](02_SCREEN_SPECIFICATIONS.md#s042) |
| S041-A03 | 位置を確認し直す→locate（未確定受付があればその本文を再利用） |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

有効滞在・更新端末・測位精度条件。拒否/範囲外はエラー。地点を自由に選んで募集はできない。

**再起動・復元：** 未送信draftはメモリのみ。送信受付済本文はSecureStore、再起動復元。

### E. 遷移

流入：[S018](02_SCREEN_SPECIFICATIONS.md#s018)。表示資格：会員。募集は当該端末の有効入街が必要。遷移・子面：[S043](02_SCREEN_SPECIFICATIONS.md#s043) [S042](02_SCREEN_SPECIFICATIONS.md#s042) [S059](02_SCREEN_SPECIFICATIONS.md#s059)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの題名・日時・定員/人数・公開地点・自分の権限に該当する情報とCの操作を保持。送信中/競合/期限終了を区別し、一般参加者へ名簿を公開しない。未送信入力と結果未確定の受付は別状態。

<a id="s042"></a>
## S042 オフ会通知作成タブ

### A. 基本情報

- 用途：募集/イベントの作成受付の専用操作。
- 関連要件：R12 R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/pins/create.tsx`](<../../apps/mobile/src/app/pins/create.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`usePinCreation / eventInputError`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `EventDateField`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S042-F01 | 題名 | string | draft.title（50） | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 初期空欄／placeholder（明記した既定値は例外） | 入力/選択可。条件はC・D参照 |
| S042-F02 | 説明 | string | draft.description（1000） | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 初期空欄／placeholder（明記した既定値は例外） | 入力/選択可。条件はC・D参照 |
| S042-F03 | 開始 | string | draft.starts | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 初期空欄／placeholder（明記した既定値は例外） | 入力/選択可。条件はC・D参照 |
| S042-F04 | 終了 | string | draft.ends | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 初期空欄／placeholder（明記した既定値は例外） | 入力/選択可。条件はC・D参照 |
| S042-F05 | 定員 | string | draft.capacity（初期20、1〜100） | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 初期空欄／placeholder（明記した既定値は例外） | 入力/選択可。条件はC・D参照 |
| S042-F06 | 地点 | string | draft.location?緯度経度5桁:未選択 | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 初期空欄／placeholder（明記した既定値は例外） | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S042-A01 | 場所を選択→[S023](02_SCREEN_SPECIFICATIONS.md#s023) |
| S042-A02 | 日付→[S037](02_SCREEN_SPECIFICATIONS.md#s037) |
| S042-A03 | 各入力 |
| S042-A04 | 作成→eventInputError→submitCommand(event_create)→[S011](02_SCREEN_SPECIFICATIONS.md#s011) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

必須・日時順/24h/定員/街内等は入力検証＋API。本文固定後は編集停止、取消受付で再入力。

**再起動・復元：** 未送信draftはメモリのみ。送信受付済本文はSecureStore、再起動復元。

### E. 遷移

流入：[S018](02_SCREEN_SPECIFICATIONS.md#s018)。表示資格：会員。募集は当該端末の有効入街が必要。遷移・子面：[S023](02_SCREEN_SPECIFICATIONS.md#s023) [S037](02_SCREEN_SPECIFICATIONS.md#s037) [S011](02_SCREEN_SPECIFICATIONS.md#s011)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの題名・日時・定員/人数・公開地点・自分の権限に該当する情報とCの操作を保持。送信中/競合/期限終了を区別し、一般参加者へ名簿を公開しない。未送信入力と結果未確定の受付は別状態。

<a id="s043"></a>
## S043 募集・公開地点確認

### A. 基本情報

- 用途：募集/イベントの作成受付の専用操作。
- 関連要件：R12 R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/pins/create.tsx`](<../../apps/mobile/src/app/pins/create.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`usePinCreation`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `EventDateField`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S043-F01 | 緯度 | number | recruitBody.latitude | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S043-F02 | 経度 | number | recruitBody.longitude | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S043-F03 | 募集題名 | string | 取得時に確定したtitle | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S043-F04 | 公開説明 | string | この場所に20分間募集ピン | この操作面が表示中 | 入力/測位/受付復元/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S043-A01 | 作成→submitCommand recruitment_create→[S013](02_SCREEN_SPECIFICATIONS.md#s013) |
| S043-A02 | 前回の送信を確認/取消→command_cancel |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

位置確認済みbodyにより題名/種別編集を固定。精密座標の公開は募集の明示操作だけ。

**再起動・復元：** 未送信draftはメモリのみ。送信受付済本文はSecureStore、再起動復元。

### E. 遷移

流入：[S018](02_SCREEN_SPECIFICATIONS.md#s018)。表示資格：会員。募集は当該端末の有効入街が必要。遷移・子面：[S013](02_SCREEN_SPECIFICATIONS.md#s013) [S018](02_SCREEN_SPECIFICATIONS.md#s018)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの題名・日時・定員/人数・公開地点・自分の権限に該当する情報とCの操作を保持。送信中/競合/期限終了を区別し、一般参加者へ名簿を公開しない。未送信入力と結果未確定の受付は別状態。

<a id="s044"></a>
## S044 OS写真選択

### A. 基本情報

- 用途：本人表示名・チャット用画像を設定の専用操作。
- 関連要件：R03 R15 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`lib/avatar.ts`](<../../apps/mobile/src/lib/avatar.ts>)。実装済み（仮UI・静的コード確認）。
- 接続：`chooseAvatar / chooseStreetIcon`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Profile`, `StreetIconState`, `T`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S044-F01 | 写真候補 | OS管理 | フォトライブラリ | この操作面が表示中 | focus取得、保存応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S044-F02 | 結果asset | uri/width/height | ImagePicker | 非空のerror/statusまたは結果がある時 | focus取得、保存応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S044-A01 | 写真選択→[S058](02_SCREEN_SPECIFICATIONS.md#s058) |
| S044-A02 | キャンセル→呼出元（変更なし） |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

画像のみ/カメラ撮影導線なし。OSのアクセス範囲・表示に従う。

**再起動・復元：** 通常の未保存名は再起動で消える。focusで再取得。初回は名前→街poolで、本人写真は必須ではない。

### E. 遷移

流入：[S004](02_SCREEN_SPECIFICATIONS.md#s004)。表示資格：会員・名前未設定も可。遷移・子面：[S058](02_SCREEN_SPECIFICATIONS.md#s058) [S004](02_SCREEN_SPECIFICATIONS.md#s004) [S005](02_SCREEN_SPECIFICATIONS.md#s005)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

本人用画像と街pool提供/当日割当を別用途として示す。初回pool必須、正方形編集/保存エラー/取下げを維持。OS所有画面を独自UI実装済みと見なさない。

<a id="s045"></a>
## S045 OS招待共有

### A. 基本情報

- 用途：招待受領・発行・共有・停止の専用操作。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/invitations.tsx`](<../../apps/mobile/src/app/invitations.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`invitations.tsx Share.share`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S045-F01 | 共有文 | string | 招待コードを含むShare.message | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S045-F02 | 共有先 | OS管理 | Share sheet | この操作面が表示中 | focus/受領・発行・停止・明示再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S045-A01 | 送信先選択/取消→呼出元 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

コード共有。カスタム招待リンク生成や受信自動入力ではない。

**再起動・復元：** コード表示はblur時クリア、一覧は再取得。未確定発行はSecureStore command復元。

### E. 遷移

流入：[S006](02_SCREEN_SPECIFICATIONS.md#s006)。表示資格：認証済み未登録は受領のみ。会員は発行と受領フォーム。遷移・子面：[S006](02_SCREEN_SPECIFICATIONS.md#s006)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s046"></a>
## S046 OS通知許可

### A. 基本情報

- 用途：変更/中止通知とPush許可の専用操作。
- 関連要件：R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`hooks/usePushNotifications.ts`](<../../apps/mobile/src/hooks/usePushNotifications.ts>)。部分実装/検証待ち：許可・token登録あり、実APNs未確認。
- 接続：`usePushPermission / usePushLifecycle`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S046-F01 | 許可選択 | OS管理 | 通知許可 | この操作面が表示中 | focus/10秒/復帰/streetChanges/既読応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S046-F02 | 結果status | enum | native.pushStatus | 非空のerror/statusまたは結果がある時 | focus/10秒/復帰/streetChanges/既読応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S046-A01 | 有効化→native.pushSync(true) |
| S046-A02 | 許可→端末token登録 |
| S046-A03 | 拒否→denied |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

現在のPersonal検証ビルドはunavailableで操作不可。実APNs到達は未確認。

**再起動・復元：** 既読はDB。通知タップは任意URLを使わず認証後一覧へ。実APNsは未確認。

### E. 遷移

流入：[S007](02_SCREEN_SPECIFICATIONS.md#s007)。表示資格：有効会員。遷移・子面：[S007](02_SCREEN_SPECIFICATIONS.md#s007)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s047"></a>
## S047 通報受付完了

### A. 基本情報

- 用途：対象投稿/募集/イベントを運営へ報告の専用操作。
- 関連要件：R16（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/report.tsx`](<../../apps/mobile/src/app/report.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S047-F01 | 完了文 | string | 通報を受け付けました | この操作面が表示中 | 入力/送信結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S047-A01 | 戻る→router.back |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

sent=trueでフォームの代わりに完了表示。新たな通報一覧画面ではない。

**再起動・復元：** フォームは永続なし。

### E. 遷移

流入：[S019](02_SCREEN_SPECIFICATIONS.md#s019)。表示資格：会員、route kind/idをAPIで検証。遷移・子面：[S019](02_SCREEN_SPECIFICATIONS.md#s019)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s048"></a>
## S048 ステッカー新規入力

### A. 基本情報

- 用途：登録一覧と下書き準備の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/index.tsx`](<../../apps/mobile/src/app/stickers/index.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useStickerRegistration`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S048-F01 | 管理名 | string | title（必須50） | この操作面が表示中 | focus/登録・取消/再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S048-F02 | 地点状態 | string | pointの有無 | この操作面が表示中 | focus/登録・取消/再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S048-F03 | エラー | string | error | 非空のerror/statusまたは結果がある時 | focus/登録・取消/再取得 | エラー表示なし | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S048-A01 | 管理名入力/場所S049 |
| S048-A02 | 開始→submitCommand sticker_create→[S021](02_SCREEN_SPECIFICATIONS.md#s021) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

未確定受付は新しい入力を固定。同一受付を確認/取消可能。

**再起動・復元：** 未確定command本文復元。通常の未送信入力は永続なし。

### E. 遷移

流入：[S020](02_SCREEN_SPECIFICATIONS.md#s020)。表示資格：運営＋MFA。遷移・子面：[S049](02_SCREEN_SPECIFICATIONS.md#s049) [S021](02_SCREEN_SPECIFICATIONS.md#s021)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s049"></a>
## S049 新規ステッカー地点Modal

### A. 基本情報

- 用途：登録一覧と下書き準備の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/index.tsx`](<../../apps/mobile/src/app/stickers/index.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`LocationPicker`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S049-F01 | 選択地点 | tuple? | point | 値ありの場合。分岐は取得元欄参照 | focus/登録・取消/再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S049-F02 | 地図 | style | mapStyle | この操作面が表示中 | focus/登録・取消/再取得 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S049-A01 | tap→point |
| S049-A02 | 決定→フォーム位置を設定し閉じる |
| S049-A03 | Modal close→閉じる |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

決定前はDB登録しない。

**再起動・復元：** 未確定command本文復元。通常の未送信入力は永続なし。

### E. 遷移

流入：[S020](02_SCREEN_SPECIFICATIONS.md#s020)。表示資格：運営＋MFA。遷移・子面：[S020](02_SCREEN_SPECIFICATIONS.md#s020)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s050"></a>
## S050 ステッカー編集フォーム

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useStickerDetail`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S050-F01 | 管理名 | string | title | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |
| S050-F02 | 緯度経度 | tuple | draft location | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S050-F03 | 版 | number | revision（通常表示なし） | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S050-A01 | 名前入力/位置S054 |
| S050-A02 | 保存→sticker_update(expected_revision) |
| S050-A03 | 取消→編集閉じる |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

publishedは編集不可。競合はエラー・再取得し最新データへ。

**再起動・復元：** 下書きDB7日。focus再取得。NFC処理の離脱は世代チェックで後段更新抑止。

### E. 遷移

流入：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[S054](02_SCREEN_SPECIFICATIONS.md#s054) [S021](02_SCREEN_SPECIFICATIONS.md#s021)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s051"></a>
## S051 ステッカー・書込待ち

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。部分実装/検証待ち：NFC接続ロジックあり、実タグ未確認。
- 接続：`useStickerDetail / stickerTouch`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S051-F01 | 管理名 | string | draft.title | この操作面が表示中 | focus/再取得/工程・保存結果 | 初期空欄／placeholder（明記した既定値は例外） | 不可（操作結果・データ再取得で変化） |
| S051-F02 | 地点 | number×2 | draft latitude/longitude | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S051-F03 | 代用説明 | string? | localStickerAdapter | 値ありの場合。分岐は取得元欄参照 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S051-A01 | 書き込む→[D008](02_SCREEN_SPECIFICATIONS.md#d008)→stickerTouch write→sticker_step written |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

実タグの読書はOSセッション。fakeは開発モードだけ。失敗ではwrittenへ進めない。

**再起動・復元：** 下書きDB7日。focus再取得。NFC処理の離脱は世代チェックで後段更新抑止。

### E. 遷移

流入：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[D008](02_SCREEN_SPECIFICATIONS.md#d008) [S052](02_SCREEN_SPECIFICATIONS.md#s052) [S060](02_SCREEN_SPECIFICATIONS.md#s060)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s052"></a>
## S052 ステッカー・照合待ち

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。部分実装/検証待ち：NFC接続ロジックあり、実タグ未確認。
- 接続：`useStickerDetail / stickerTouch`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S052-F01 | 工程 | string | written | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S052-F02 | 管理名/地点 | 同S021 | draft | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S052-A01 | 再読取→stickerTouch read→内容一致→sticker_step verified |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

不一致/通信不明/読取取消は公開不可。画面へ戻って再取得/再試行。

**再起動・復元：** 下書きDB7日。focus再取得。NFC処理の離脱は世代チェックで後段更新抑止。

### E. 遷移

流入：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[S053](02_SCREEN_SPECIFICATIONS.md#s053) [S060](02_SCREEN_SPECIFICATIONS.md#s060)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s053"></a>
## S053 ステッカー・設置確認待ち

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useStickerDetail`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S053-F01 | 工程 | string | verified | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S053-F02 | 管理名/地点 | 同S021 | draft | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S053-A01 | 設置完了→sticker_step installed→[S062](02_SCREEN_SPECIFICATIONS.md#s062) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

設置完了だけでは公開されない。街範囲のpublishが必要。

**再起動・復元：** 下書きDB7日。focus再取得。NFC処理の離脱は世代チェックで後段更新抑止。

### E. 遷移

流入：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[S062](02_SCREEN_SPECIFICATIONS.md#s062)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s054"></a>
## S054 ステッカー編集地点Modal

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`LocationPicker`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S054-F01 | 地図 | style | mapStyle | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S054-F02 | 仮地点 | tuple | draft位置 | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S054-A01 | tap/決定で編集フォームへ |
| S054-A02 | 閉じるは確定しない |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

公開済の直接編集不可。保存APIはフォームから。

**再起動・復元：** 下書きDB7日。focus再取得。NFC処理の離脱は世代チェックで後段更新抑止。

### E. 遷移

流入：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s055"></a>
## S055 ステッカー移設地点Modal

### A. 基本情報

- 用途：公開範囲と移設/交換/停止の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/area.tsx`](<../../apps/mobile/src/app/stickers/area.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`LocationPicker`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Camera`, `Empty`, `GeoJSONSource`, `Layer`, `LocationPicker`, `Map`, `Modal`, `Page`, `Placement`, `Preview`, `StickerDraft`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S055-F01 | 地図 | style | mapStyle | この操作面が表示中 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S055-F02 | 移設元 | string | placement.title | この操作面が表示中 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S055-F03 | 仮地点 | tuple | 選択位置 | この操作面が表示中 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 入力/選択可。条件はC・D参照 |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S055-A01 | 地点決定→[D012](02_SCREEN_SPECIFICATIONS.md#d012) |
| S055-A02 | 取消→moving=null |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

確認後create commandで旧タグ停止＋移設下書き。確定前は公開位置変更なし。

**再起動・復元：** preview/selected/movingはメモリ。公開はAPI確定。範囲変更だけでは一斉退出しない。

### E. 遷移

流入：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。表示資格：運営＋MFA。遷移・子面：[D012](02_SCREEN_SPECIFICATIONS.md#d012) [S022](02_SCREEN_SPECIFICATIONS.md#s022) [S021](02_SCREEN_SPECIFICATIONS.md#s021)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s056"></a>
## S056 入街・サーバー記録待ち

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/StreetEntrySheet.tsx`](<../../apps/mobile/src/components/StreetEntrySheet.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`ActivityIndicator`, `Modal`, `Pressable`, `SafeAreaView`, `ScrollView`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S056-F01 | 見出し | string | 街への参加を記録中 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S056-F02 | 進行 | spinner | checking | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S056-A01 | 取消→exit |
| S056-A02 | 成功→[S057](02_SCREEN_SPECIFICATIONS.md#s057) |
| S056-A03 | エラー→Map error |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

読取成功だけではチェックイン成功にしない。通信不明時の重複はnative受付/DBで制御。

**再起動・復元：** 滞在はnative journalから復元。snapshotはメモリ。精密現在地は再センタリングのみ。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S057](02_SCREEN_SPECIFICATIONS.md#s057) [S001](02_SCREEN_SPECIFICATIONS.md#s001)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの人数/気配/滞在状態とCのOFF/取消を維持。気配0を無人と断言せず、背景共有の意思・精密位置との違いを区別する。scanning/checking取消とexplain/success閉じるは別処理。

<a id="s057"></a>
## S057 入街完了

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/StreetEntrySheet.tsx`](<../../apps/mobile/src/components/StreetEntrySheet.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`ActivityIndicator`, `Modal`, `Pressable`, `SafeAreaView`, `ScrollView`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S057-F01 | 見出し | string | 街への参加が完了しました | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S057-F02 | 完了記号 | string | ✓ | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S057-A01 | 地図へ/Modal close→setSheet(null) |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

閉じても退出しない。以後OFFが退出操作。

**再起動・復元：** 滞在はnative journalから復元。snapshotはメモリ。精密現在地は再センタリングのみ。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの人数/気配/滞在状態とCのOFF/取消を維持。気配0を無人と断言せず、背景共有の意思・精密位置との違いを区別する。scanning/checking取消とexplain/success閉じるは別処理。

<a id="s058"></a>
## S058 OS画像切り抜き

### A. 基本情報

- 用途：本人表示名・チャット用画像を設定の専用操作。
- 関連要件：R03 R15 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`lib/avatar.ts`](<../../apps/mobile/src/lib/avatar.ts>)。実装済み（仮UI・静的コード確認）。
- 接続：`chooseImage / chooseAvatar / chooseStreetIcon`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Profile`, `StreetIconState`, `T`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S058-F01 | 画像 | OS編集UI | 選択asset | この操作面が表示中 | focus取得、保存応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S058-F02 | 切抜範囲 | 正方形 | allowsEditing/aspect1:1 | この操作面が表示中 | focus取得、保存応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S058-A01 | 確定→最大512px/JPEG段階圧縮/メタデータ除去→Storage→API |
| S058-A02 | 取消→変更なし |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

2MiB以内。変換失敗/サイズ超過/通信失敗は呼出元status。OS UIはFigmaで完全置換する自前editorではない。

**再起動・復元：** 通常の未保存名は再起動で消える。focusで再取得。初回は名前→街poolで、本人写真は必須ではない。

### E. 遷移

流入：[S004](02_SCREEN_SPECIFICATIONS.md#s004)。表示資格：会員・名前未設定も可。遷移・子面：[S004](02_SCREEN_SPECIFICATIONS.md#s004) [S005](02_SCREEN_SPECIFICATIONS.md#s005)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

本人用画像と街pool提供/当日割当を別用途として示す。初回pool必須、正方形編集/保存エラー/取下げを維持。OS所有画面を独自UI実装済みと見なさない。

<a id="s059"></a>
## S059 OS位置情報許可

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`../modules/presence-native/ios/PresenceNativeModule.swift`](<../../apps/mobile/src/../modules/presence-native/ios/PresenceNativeModule.swift>)。実装済み（仮UI・静的コード確認）。
- 接続：`native.currentLocation / start`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Void`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S059-F01 | 許可文言 | string | Info.plist（前景/背景） | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S059-F02 | 選択 | OS管理 | 許可/拒否 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S059-A01 | 前景許可→必要に応じ再操作 |
| S059-A02 | 背景開始時Always要求 |
| S059-A03 | 拒否→native status |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

拒否でも閲覧/チャットは可能。OS更新・ユーザー設定の変更を反映。権限拒否を街内観測成功と扱わない。

**再起動・復元：** 許可状態はOS。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S001](02_SCREEN_SPECIFICATIONS.md#s001) [S041](02_SCREEN_SPECIFICATIONS.md#s041)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

Bの人数/気配/滞在状態とCのOFF/取消を維持。気配0を無人と断言せず、背景共有の意思・精密位置との違いを区別する。scanning/checking取消とexplain/success閉じるは別処理。

<a id="s060"></a>
## S060 OS NFC読書セッション

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`hooks/useStreetMap.ts`](<../../apps/mobile/src/hooks/useStreetMap.ts>)。部分実装/検証待ち：NFC接続ロジックあり、実タグ未確認。
- 接続：`useStreetMap.scan / lib/stickers.ts stickerTouch`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Recruitment`, `Snapshot`, `StreetEvent`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S060-F01 | システム文言 | string | NfcManager標準session | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S060-F02 | 結果 | NDEF/tag payload | reader | 非空のerror/statusまたは結果がある時 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S060-A01 | タッチ→read/write |
| S060-A02 | 取消→reject |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

読取/書込ともADP実機未検証。アプリ独自sheetのみで標準OS表示を完全代替できない。

**再起動・復元：** OSセッションは再起動復元しない。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S027](02_SCREEN_SPECIFICATIONS.md#s027) [S051](02_SCREEN_SPECIFICATIONS.md#s051) [S052](02_SCREEN_SPECIFICATIONS.md#s052)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s061"></a>
## S061 OSローカルネットワーク許可（開発環境）

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`../app.json`](<../../apps/mobile/src/../app.json>)。OS依存：設定文言あり、今回の出現/拒否操作未確認。
- 接続：`NSLocalNetworkUsageDescription / native.configure`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S061-F01 | 用途説明 | string | NSLocalNetworkUsageDescription | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S061-F02 | 許可状態 | OS管理 | Macローカルサーバーへの到達可否 | この操作面が表示中 | 初期/復帰/10秒poll/gateway通知。失効描画は1秒tick | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S061-A01 | OSの許可/拒否 |
| S061-A02 | 拒否後はiOS設定で変更 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

アプリ独自Modalではない。ローカル接続に伴うOS表示の対象。出現時点/実機拒否後の表示は今回未確認。拒否時のアプリ側は通信error扱い。

**再起動・復元：** OS設定で保持。

### E. 遷移

流入：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S001](02_SCREEN_SPECIFICATIONS.md#s001)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s062"></a>
## S062 ステッカー・公開待ち

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程の専用操作。
- 関連要件：R04 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useStickerDetail`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S062-F01 | 工程 | string | installed | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S062-F02 | 管理名/地点 | 同S021 | draft | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S062-A01 | 街の範囲へ→[S022](02_SCREEN_SPECIFICATIONS.md#s022)→preview/publish |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

設置記録済みでもまだ入街用として公開されていない。編集/取消は未公開の条件に従う。

**再起動・復元：** 下書きDB7日。focus再取得。NFC処理の離脱は世代チェックで後段更新抑止。

### E. 遷移

流入：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="s063"></a>
## S063 ステッカー・公開済み

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程の専用操作。
- 関連要件：R04 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`useStickerDetail`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S063-F01 | 工程 | string | published | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |
| S063-F02 | 管理名/地点 | 同S021 | draft | この操作面が表示中 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| S063-A01 | 街の範囲へ→[S022](02_SCREEN_SPECIFICATIONS.md#s022) |
| S063-A02 | 状態を再取得 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

直接編集/登録取消/書込ボタンなし。移設/交換/停止はS022から。

**再起動・復元：** 下書きDB7日。focus再取得。NFC処理の離脱は世代チェックで後段更新抑止。

### E. 遷移

流入：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d001"></a>
## D001 街pool取り下げ

### A. 基本情報

- 用途：poolへの提供と当日割当を確認の専用操作。
- 関連要件：R03 R07 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/street-icons.tsx`](<../../apps/mobile/src/app/street-icons.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Avatar`, `Page`, `StreetIconState`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D001-F01 | 確認/結果文 | string | 街の共有アイコンから取り下げる確認 | 非空のerror/statusまたは結果がある時 | focus/30秒poll/画像公開・取下げ応答 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D001-A01 | street_icon_remove→再取得。既に提供した登録実績は維持 |
| D001-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S005](02_SCREEN_SPECIFICATIONS.md#s005)。表示資格：会員・初回提供前も可。遷移・子面：[S005](02_SCREEN_SPECIFICATIONS.md#s005)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d002"></a>
## D002 退会最終確認

### A. 基本情報

- 用途：再認証して資格と関連情報を終了の専用操作。
- 関連要件：R03 R17（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/withdraw.tsx`](<../../apps/mobile/src/app/withdraw.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D002-F01 | 確認/結果文 | string | アカウントと投稿の扱い、退会確認 | 非空のerror/statusまたは結果がある時 | 操作結果のみ | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D002-A01 | withdraw_confirm→native.logout→[S024](02_SCREEN_SPECIFICATIONS.md#s024)。復元不可 |
| D002-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S010](02_SCREEN_SPECIFICATIONS.md#s010)。表示資格：認証済み会員。遷移・子面：[S010](02_SCREEN_SPECIFICATIONS.md#s010)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d003"></a>
## D003 イベント中止確認

### A. 基本情報

- 用途：参加・取消・名簿・主催操作の専用操作。
- 関連要件：R13 R14（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/events/[id].tsx`](<../../apps/mobile/src/app/events/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D003-F01 | 確認/結果文 | string | 中止の確認 | 非空のerror/statusまたは結果がある時 | focus/10秒/復帰/streetChanges/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D003-A01 | event_cancel(expected_revision)→中止状態/通知作成 |
| D003-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S011](02_SCREEN_SPECIFICATIONS.md#s011)。表示資格：会員。名簿は主催者またはMFA運営。遷移・子面：[S011](02_SCREEN_SPECIFICATIONS.md#s011)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d004"></a>
## D004 イベント最新内容へ置換

### A. 基本情報

- 用途：主催イベント更新の専用操作。
- 関連要件：R13（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/events/edit/[id].tsx`](<../../apps/mobile/src/app/events/edit/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `EventDateField`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D004-F01 | 確認/結果文 | string | 入力を破棄して最新へ戻す | 非空のerror/statusまたは結果がある時 | 初回/focusと保存・競合時再取得。入力はeditor管理 | 初期空欄／placeholder（明記した既定値は例外） | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D004-A01 | editor.useLatest→入力置換。DB更新なし |
| D004-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S012](02_SCREEN_SPECIFICATIONS.md#s012)。表示資格：mine=true、DBでも主催認可。遷移・子面：[S012](02_SCREEN_SPECIFICATIONS.md#s012)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d005"></a>
## D005 募集題名を最新へ置換

### A. 基本情報

- 用途：募集の閲覧・本人編集・終了の専用操作。
- 関連要件：R12（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/recruitments/[id].tsx`](<../../apps/mobile/src/app/recruitments/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D005-F01 | 確認/結果文 | string | 未保存の題名を破棄する確認 | 非空のerror/statusまたは結果がある時 | focus/10秒/復帰/streetChanges/編集・終了後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D005-A01 | load(true)→題名と版を置換。DB更新なし |
| D005-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S013](02_SCREEN_SPECIFICATIONS.md#s013)。表示資格：会員。mineのみ編集。遷移・子面：[S013](02_SCREEN_SPECIFICATIONS.md#s013)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d006"></a>
## D006 会員停止/解除

### A. 基本情報

- 用途：会員状態と個別操作を選択の専用操作。
- 関連要件：R17 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/MemberRow.tsx`](<../../apps/mobile/src/components/MemberRow.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `EventDateField`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D006-F01 | 確認/結果文 | string | 対象者と停止/解除の確認 | 非空のerror/statusまたは結果がある時 | focus/再読込/続きを表示/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D006-A01 | useMemberActions→operator_member_state。停止は関連滞在/募集/主催イベント/参加を終了。解除で復活しない |
| D006-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S015](02_SCREEN_SPECIFICATIONS.md#s015)。表示資格：運営＋MFA（API認可）。遷移・子面：[S015](02_SCREEN_SPECIFICATIONS.md#s015)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d007"></a>
## D007 運営の投稿削除

### A. 基本情報

- 用途：証拠確認・元投稿削除・対応終了の専用操作。
- 関連要件：R16 R17 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/moderation.tsx`](<../../apps/mobile/src/app/moderation.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `Page`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D007-F01 | 確認/結果文 | string | 元投稿を削除する確認 | 非空のerror/statusまたは結果がある時 | focus/再読込/操作後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D007-A01 | operator_message_delete→一覧再取得。通報証拠は保持 |
| D007-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S016](02_SCREEN_SPECIFICATIONS.md#s016)。表示資格：運営＋MFA。遷移・子面：[S016](02_SCREEN_SPECIFICATIONS.md#s016)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d008"></a>
## D008 ステッカー書込

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D008-F01 | 確認/結果文 | string | NFCへ書き込む確認 | 非空のerror/statusまたは結果がある時 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D008-A01 | stickerTouch(write)→sticker_step written。失敗は元工程 |
| D008-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d009"></a>
## D009 ステッカー登録取消

### A. 基本情報

- 用途：書込→再読取→設置確認→公開の工程の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Empty`, `LocationPicker`, `Modal`, `Page`, `Text`, `TextInput`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D009-F01 | 確認/結果文 | string | 未公開登録を取消す確認 | 非空のerror/statusまたは結果がある時 | focus/再取得/工程・保存結果 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D009-A01 | sticker_cancel→一覧へ。公開済はこの操作不可 |
| D009-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。表示資格：運営＋MFA。遷移・子面：[S021](02_SCREEN_SPECIFICATIONS.md#s021)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d010"></a>
## D010 街範囲公開

### A. 基本情報

- 用途：公開範囲と移設/交換/停止の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/area.tsx`](<../../apps/mobile/src/app/stickers/area.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Camera`, `Empty`, `GeoJSONSource`, `Layer`, `LocationPicker`, `Map`, `Modal`, `Page`, `Placement`, `Preview`, `StickerDraft`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D010-F01 | 確認/結果文 | string | プレビューした範囲の公開確認 | 非空のerror/statusまたは結果がある時 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D010-A01 | sticker_publish→再取得。既存滞在を一斉退出しない |
| D010-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。表示資格：運営＋MFA。遷移・子面：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d011"></a>
## D011 ステッカー交換

### A. 基本情報

- 用途：公開範囲と移設/交換/停止の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/area.tsx`](<../../apps/mobile/src/app/stickers/area.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Camera`, `Empty`, `GeoJSONSource`, `Layer`, `LocationPicker`, `Map`, `Modal`, `Page`, `Placement`, `Preview`, `StickerDraft`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D011-F01 | 確認/結果文 | string | 新ステッカーへ交換する確認 | 非空のerror/statusまたは結果がある時 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D011-A01 | sticker_create(replaces_tag)→[S021](02_SCREEN_SPECIFICATIONS.md#s021)。旧タグは公開切替まで有効 |
| D011-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。表示資格：運営＋MFA。遷移・子面：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d012"></a>
## D012 ステッカー移設

### A. 基本情報

- 用途：公開範囲と移設/交換/停止の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/area.tsx`](<../../apps/mobile/src/app/stickers/area.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Camera`, `Empty`, `GeoJSONSource`, `Layer`, `LocationPicker`, `Map`, `Modal`, `Page`, `Placement`, `Preview`, `StickerDraft`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D012-F01 | 確認/結果文 | string | 旧場所での利用停止を伴う移設確認 | 非空のerror/statusまたは結果がある時 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D012-A01 | sticker_create(tag_id,location)→[S021](02_SCREEN_SPECIFICATIONS.md#s021)。下書きから設置/公開へ |
| D012-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。表示資格：運営＋MFA。遷移・子面：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d013"></a>
## D013 ステッカー停止

### A. 基本情報

- 用途：公開範囲と移設/交換/停止の専用操作。
- 関連要件：R04 R17 R11 R18（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`app/stickers/area.tsx`](<../../apps/mobile/src/app/stickers/area.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Action`, `Camera`, `Empty`, `GeoJSONSource`, `Layer`, `LocationPicker`, `Map`, `Modal`, `Page`, `Placement`, `Preview`, `StickerDraft`, `Text`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D013-F01 | 確認/結果文 | string | このステッカーの利用停止確認 | 非空のerror/statusまたは結果がある時 | 初回/再取得/preview/publish/変更後 | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D013-A01 | sticker_suspend(expected_revision)→再取得。街範囲は維持 |
| D013-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。表示資格：運営＋MFA。遷移・子面：[S022](02_SCREEN_SPECIFICATIONS.md#s022)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d014"></a>
## D014 チャット長押しメニュー

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作の専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`components/StreetChat.tsx`](<../../apps/mobile/src/components/StreetChat.tsx>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Avatar`, `BlurView`, `ComponentRef`, `KeyboardAvoidingView`, `Pressable`, `SafeAreaView`, `ScrollView`, `Text`, `TextInput`, `View`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D014-F01 | 確認/結果文 | string | 本人のtextは削除、他人はブロック、未削除textは通報、閉じる | 非空のerror/statusまたは結果がある時 | 親画面の更新またはこの面での操作結果。独立pollなし | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D014-A01 | 削除→chat_delete。ブロック→block_set。通報→[S019](02_SCREEN_SPECIFICATIONS.md#s019)。入街ログは通常投稿と別条件 |
| D014-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S028](02_SCREEN_SPECIFICATIONS.md#s028)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S028](02_SCREEN_SPECIFICATIONS.md#s028)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

本人の名前/画像/時刻/本文、入街ログと通常投稿、削除状態、投稿制限、履歴位置、未確定送信を区別。地図の流動アイコンで本人の発言者画像を置き換えない。

<a id="d015"></a>
## D015 開発用タグ上書き確認

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作の専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`hooks/useStreetMap.ts`](<../../apps/mobile/src/hooks/useStreetMap.ts>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Recruitment`, `Snapshot`, `StreetEvent`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D015-F01 | 確認/結果文 | string | 検証用NFCタグの上書き確認 | 非空のerror/statusまたは結果がある時 | 親画面の更新またはこの面での操作結果。独立pollなし | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D015-A01 | useStreetMap.writeTestTag。__DEV__ && !nfcDisabledのみ表示。空でないタグはtag_not_emptyで拒否 |
| D015-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S030](02_SCREEN_SPECIFICATIONS.md#s030)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S030](02_SCREEN_SPECIFICATIONS.md#s030)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。

<a id="d016"></a>
## D016 開発用タグ書込結果

### A. 基本情報

- 用途：街の人数・気配・ピンとチャットを見るの専用操作の専用操作。
- 関連要件：R03 R04 R07 R08 R10 R19（[ACCEPTANCE](../ACCEPTANCE.md)）。
- 実装：[`hooks/useStreetMap.ts`](<../../apps/mobile/src/hooks/useStreetMap.ts>)。実装済み（仮UI・静的コード確認）。
- 接続：`親画面と同じ`。API操作名はC、正確な呼出箇所は07。
- 同じソース内の使用部品：`Recruitment`, `Snapshot`, `StreetEvent`（条件付き兄弟部品を含む）。

### B. 表示フィールド

| 項目ID | 表示/意味 | 型 | 取得元・具体的分岐 | 表示条件 | 更新契機 | 未取得/空 | 変更 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D016-F01 | 確認/結果文 | string | 書込成功/失敗の結果 | 非空のerror/statusまたは結果がある時 | 親画面の更新またはこの面での操作結果。独立pollなし | 未取得は表示なし／初期値。専用表示はD参照 | 不可（操作結果・データ再取得で変化） |

### C. 操作と処理

| 操作ID | 対象・方法・呼出先・DB/API影響・成功時 |
| --- | --- |
| D016-A01 | 閉じるのみ。実読書の成功を今回確認したものではない |
| D016-A02 | キャンセル/閉じる→親画面 |

失敗・実行条件・二重実行・取消はDと共通契約C0を併読。地図pan/zoom、テキスト入力、選択のみではDB保存されない。API成功を待つ操作と単なる画面遷移を上表で区別する。

### D. 状態と操作可否

React Native Alert。通常は確認後に親のbusyへ移行、失敗は親errorへ。取消なら処理開始なし。

**再起動・復元：** ダイアログは永続化しない。処理開始済みの取消可否は親画面とAPI契約に従う。

### E. 遷移

流入：[S030](02_SCREEN_SPECIFICATIONS.md#s030)。表示資格：有効会員。未入街可。未認証はS024、準備中はspinner。遷移・子面：[S030](02_SCREEN_SPECIFICATIONS.md#s030)。共通の戻る/取消はC0、特別な戻り処理はC。外部ディープリンクは03の制約を参照。

### F. Figmaへの引継ぎ

この面の必須情報はB、操作はC、状態差はD、権限差はE。共通の視覚変更可能範囲/OS制約はC0と06。説明の意味と処理結果を残し、現行装飾そのものを固定仕様にしない。
