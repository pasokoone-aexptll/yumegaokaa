# iOS Native UI — 監査・承認済み移行計画

## 2026-11-20 現在の到達点

`@expo/ui/swift-ui`のButton/Toggle/Menu、標準formSheetと実際のUIGlassEffectを使用中。Mapの参加スイッチは外周を実寸へ正確に合わせるためUIKitの標準UISwitchをExpoViewで橋渡しする。既存4タブを維持。入街sheetの表示アニメーション、待機リングからの試験入街、PINの確認なし破棄、Home＋→Map、人数の展開時のsheet拡張、Figmaの余白/提供素材を修正。自己操作通知の054をローカル/クラウド適用済み。画面別の確認/未確認は[UI_REVIEW_STATUS](UI_REVIEW_STATUS.md)の最新表。全29画面完全一致・実機段階合格にはまだ達していない。

2026-11-19。監査基準 `c449960`。初回監査後、ユーザーが添付29画面と動画に基づく実装・Simulator確認を承認。既存の電信PINのクラウド配備とSimulator起動は別途明示承認済み。以下は静的な構造監査と移行案であり、全画面の実機合格を意味しない。

## 採用する方針

React Native / TypeScript、認証・API・GPS・NFC・チャットのロジックを維持し、iOSの表示・操作を本物のApple標準UIへ段階移行する。SwiftUI標準部品を `@expo/ui/swift-ui` で使用し、対応不能な要件だけSwiftUIのネイティブ部品を追加する。RN標準・独自部品はその後の選択肢。Androidの現行表示・操作は保持する。

Figmaは情報構造、電信PINの状態と導線、街の世界観の基準として維持する。既存4タブの外観は維持しNativeTabsを採用しない。添付Figmaの外観を基準に、シート・フォーム・ボタン・スイッチはネイティブ部品で実装する。Liquid GlassをBlurViewや半透明Viewで模倣しない。標準Sheetで成立する操作を独自再実装しない。操作アイコンはユーザー提供superassets、システムの文字スタイル、Dynamic Type、VoiceOver、ダークモード、セーフエリア、キーボード、Reduce Motion/Reduce Transparencyを確認する。

## 初回監査時の構造・依存関係（現在の実装状況は追跡節）

| 対象 | コードで確認した現状 | 移行上の判断 |
| --- | --- | --- |
| 基盤 | Expo `~58.0.22`、Router `~58.0.29`、RN `0.88.1`、React `19.3.0`。具体解決版はlockfile | RN/TSを維持。SDK対応版の `@expo/ui` を後続で導入 |
| ナビゲーション | `src/app/_layout.tsx` のStack、react-native-screens `4.30.1`。PIN・入街等は既にnative formSheet | Stackを再利用。二重のSwiftUI NavigationStack/Sheetを載せない |
| タブ | `(tabs)/_layout.tsx` はRouter TabsとAnimatedTabButton/TabIcon。NativeTabsではない | 既存4タブとユーザー製Home/チャット/ベルを維持。表示条件・ルート名・通知導線を維持 |
| SwiftUI | `@expo/ui` はpackage.jsonに未導入。独自PresenceNativeのUIはUIKit | SwiftUIを既存採用済みと扱わない。Host境界を画面またはまとまった領域で設ける |
| ガラス/背景 | PINのPinSheetはexpo-blur `~58.0.5`。SheetChrome→SheetBackdropはUIBlurEffectとCADisplayLinkで背景を追従 | iOSの独自背景・追従処理を標準Sheetへ置換。Android側は保持 |
| 実際のLiquid Glass | PresenceNativeModule.prepareEntrySheetとEventDateSheetにはOS条件付きの **UIGlassEffect** が既にある | 全てを偽物とは扱わない。ただし独自挿入背景や強制lightを整理し、システムの標準外観を優先 |
| 地図 | iOS react-native-maps `1.29.11` / Apple Maps。Android MapLibre `11.5.0`。地図上に独自マーカー・操作層 | 3D地図、座標選択、気配・PINの表現は保持。操作層からネイティブ化 |
| 共通フォーム | Page/Action、DetailUI、AccountPage、IconMotion、RN TextInput/Pressable等 | Form/List/Section/Button/TextField/Toggle等へ。APIや状態管理はhooks/libのまま |
| 日時 | iOS EventDateSheetはUIDatePicker＋標準pageSheet。datetimepicker `9.2.1`も依存 | 旧イベント互換画面の移行時に検討。電信PINへ日時予約機能を追加しない |
| アイコン・画像 | expo-symbols `~58.0.4`、SVG `15.16.0`、masked-view `0.3.2`、figma-squircle `1.1.0`、独自画像/アニメーション | 操作アイコンはsuperassetsへ置換（文字代用禁止）。ブランド・アバター・地図マーカー素材は保持 |
| チャット | StreetChat/ChatInput＋Swift ChatIMEInput/ChatTouchRegion、キーボード重なり管理 | 日本語未確定文字、送信、スクロール、メンションを壊さないよう最後に移行 |
| 認証/端末 | PresenceNativeのAPIClient/PresenceEngine、SecureStore、NFC manager `4.2.0`、画像選択/加工 | UI移行のために認証・保存・背景処理・画像変換を変更しない |
| アクセシビリティ | 一部accessibilityLabel/stateとIconMotionのReduce Motion対応あり。一方DetailUIは固定色/サイズ、app.jsonはlight固定 | 対応ゼロではないが全体適合ではない。自動外観と文字スタイルへの移行が必要 |

監査範囲は全32 TSXルート/レイアウトの導線と依存、共通UI、iOS/Android表示分岐、Swift UIブリッジ、package/Pod設定。全ビジネスロジックの再検証や全画面の実操作は今回の監査には含めない。

## 画面ごとの具体的な移行先

以下の部品名はSwiftUIとしての構成案。Expo UIのSDK58で公開されるAPIを実装時に照合し、未対応部品だけネイティブブリッジを用いる。

| 段階 | 画面・ルート/条件付き画面 | 使用予定の部品と保持する接続 |
| --- | --- | --- |
| 1 | `_layout`、`(tabs)/_layout` | Native Stack/formSheet維持、既存4タブと配置順の水平遷移。標準ナビゲーションタイトル・toolbar・閉じる/戻る。認証ガード、タブ非表示条件、deep linkは維持 |
| 2 | `pins/create`（作成/編集） | Host＋Form/Section、TextFieldまたはTextEditor、Toggle×2、Stepper、Button、標準確認ダイアログ。useDenshinEditor/draft/保存再送を再利用 |
| 2 | `map-pin`（他人/自分/参加予定/現地） | native formSheet＋List/Section、Label、Button、Toggle。ホスト・名簿、参加→到着、取消、募集OFF確認を既存hookへ接続。成功画面も標準レイアウト/シンボル |
| 2 | `(tabs)/home` | List/Section（募集中/PIN）、toolbar追加ボタン、refreshable相当。期限・隠れた参加の解除・位置を確認する導線を維持 |
| 2 | Map内のPIN配置、`pins/location` | 地図実体とpinPlacementは維持。標準toolbarのキャンセル/配置確定。編集下書きとの往復とキーボード復元を確認 |
| 3 | `(tabs)/index`のMap操作、`street-entry`、接続状態/ゴースト等 | 標準Button/Toggle/Menu/Sheet。Apple Mapsと街のマーカー、チェックイン処理、位置権限、退出確認は維持。独自ぼかし背景を減らす |
| 3 | ログイン（StreetLogin、Map内） | Form、メール/OTP TextField、Button、ProgressView。既存OTP/確認リンク・セッション復元・再送待ちを維持 |
| 4 | `(tabs)/inbox`、`notifications` | Listと標準ナビゲーション。notificationsのredirect、既読・対象が終了済みの場合の処理、Push遷移を維持 |
| 4 | `(tabs)/settings`、`account`、`access`、`withdraw` | Form/Section/NavigationLink相当、TextField、Button、Alert/ConfirmationDialog。メール変更・会員状態・退会確認ロジックを維持 |
| 4 | `profile`、`street-icons` | Form、画像選択の標準システムUI、選択用グリッド、Button。既存画像圧縮/アップロード・アイコンプールの条件は維持 |
| 4 | `invitations`、`blocks`、`report`、`licenses` | List/Form、TextEditor、標準Share Sheet、確認ダイアログ。招待枠・ブロック・通報APIを維持 |
| 5 | `admin`、`members`、`moderation` | Form/List、Stepper/TextField、標準Alert。MFA、認可、参加者詳細・招待枠変更・通報対応のhookを維持 |
| 5 | `stickers/index`、`stickers/[id]`、`stickers/area` | Form/List/標準Sheet＋既存Map。登録/書込/移設/停止の確認、NFCと区画処理は維持 |
| 5 | `events/[id]`、`events/edit/[id]`、`map-event`、`recruitments/[id]`、`map-recruitment` | 旧リンク互換として保持。共通ネイティブ部品を適用し、通常の新規作成は電信PINのまま。旧機能の再拡張や無断削除をしない |
| 6 | Map上チャット/拡大チャット・入力・画像/メンション | 標準メニュー/ボタン、SwiftUIの入力とsafe area。Expo UIでIME要件を満たせない箇所だけ既存UIKit入力を橋渡しし、SwiftUIから包む。配信・送信・再送状態は既存hook |
| 各段階 | `ui-preview` | 開発専用プレビュー。製品と同じnative部品を表示するが、モックの成功をクラウド・実機合格にしない |

## Simulatorで見つかった既存PINの阻害要因

クラウド版をiOS27.0 Simulatorで起動し、未入街から作成を開き、募集/定員切替と位置選択往復の保持を確認。作成シートの見出し/操作部と入力欄が重なる問題は、見出しを本文と同じScrollView内に移して修正済み。Simulatorで閉じる操作と定員の展開・12→13の変更を確認。保存・公開や参加一巡は未確認。

## 実装方法と検証ゲート

1. iOS用表示アダプターを設け、Android既存部品と共通hooks/libを維持する。Expo UIをSDK対応で導入しlockfile固定、ネイティブビルドをまとめて実施。現在のiOS deployment targetは16.4。導入時に依存の最低OSを照合し、OS条件は無断で引き上げない。
2. 各段階で状態/イベントの契約を変えずに表示部品を置換。PINの24時間・日次3個・定員競合・名簿状態はDB側の既存仕様を再利用する。JS側へ制約の正本を移さない。
3. Native Stackが所有するSheetにはSwiftUIのSheetを重ねない。RN/SwiftUIでスクロール、セーフエリア、キーボード補正を二重適用しない。位置選択往復の未保存入力、戻るジェスチャーとキャンセルを確認する。
4. 各段階で対象の型/Lint、状態遷移の必要な回帰確認、Simulatorの操作確認を実施。その後iPhone実機で同じ導線、背景復帰、文字サイズ、VoiceOver、light/dark、Reduce Motion/Transparencyを確認してから段階合格とする。Androidは関連する分岐の回帰確認を行う。
5. チャットは日本語IMEの未確定/変換/連続送信、添付、スクロール、キーボード表示中のSheet往復を専用の合格条件にする。NFC・背景GPS・実PushはSimulatorで合格扱いにしない。

関連R03〜R19/R21/R22。電信PINはDP01とR12/R13/R14/R16/R17/R19。旧33タスクのDONE履歴・固定分母を増減させず、UI段階の達成を別記録する。初回監査時は実装0段階。その後の実装状況は末尾の追跡を参照。実機合格は0段階。既存PINの配備をSwiftUIへの移行完了と混同しない。

## 公式資料の照合

- [Expo UI SDK58](https://docs.expo.dev/versions/v58.0.0/sdk/ui/) と [SwiftUI / Host](https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/)：ReactからSwiftUIの実部品を使用でき、HostでUIKitと接続する。SDK対応版を選んで段階導入できる。
- [Native Tabs](https://docs.expo.dev/router/advanced/native-tabs/)：SDK58の公開importは `expo-router/native-tabs`。現在のJS Tabsと異なりOSのTab Barを使う。
- [Apple: Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)：標準バー・シート・コントロールを優先し、重複する独自背景を取り除く。ガラスは操作/ナビゲーション層に限定し、表示設定・アクセシビリティで確認する。

以上は2026-11-19に一次資料を確認した計画。監査時点では依存導入・コード変更・新UIの実機検証は未実施。現在の実装状況はTECH_VALIDATIONを参照。

## 追加合意（2026-11-19）

- 29画面とオンボーディング動画を表示・遷移の正本とする。SF Rounded、白黒のopacity階層、提供された曲線の吹き出し、正規SVGロゴの配色変種を使う。
- Home/チャット/ベルの既存タブアイコンはユーザー自身の原本であり継続採用。時計・ゴミ箱は新UIに追加しない。superassets内のほかの操作素材へ順次置換する。
- Homeの現地ユーザー列、招待チケット→QR、街のユーザー吹き出し、PIN半画面/全画面名簿・参加予定/到着・参加確定、定員の展開と方向付き数字アニメーションを実装する。
- 通知の日付整理と確認消去、プロフィール/街アイコン/ブロック/メールOTP/運営を添付画面に合わせる。既存API・認可・再送は維持する。
- 招待はQRで受け取る。中央に非常口の人物と白地、誤り訂正と読み取り検証、残時間ゲージ、履歴、削除確認を備える。ユーザー回答により、招待削除は未使用QRの失効だけでなく登録済み相手の利用停止を伴う。発行者が自分の招待先のみ停止できる認可と、停止影響の確認表示を実装済み。050をクラウド配備、DBテスト成功。実アカウント停止の操作は未実施。
- 動画のスプラッシュ・メール/OTP・QR受取・プロフィール・開始演出を実際の状態遷移に接続する。モックや時間経過だけで認証成功にしない。
- この合意は実装範囲。Simulator/実機合格は検証事実が揃うまで記録しない。旧33タスクと新UIの進捗は分離する。

## 11月19日・実装中の追跡（R03/R12〜R14/R19）

- 入街累計：既存利用者も移行後を1回目とするユーザー回答を採用。051は新規visit INSERTだけ加算し、気配更新・滞在削除で変化しない。退会時は削除。街ごとの本人カウンターを表示する。過去の回数は復元しない。
- 名前検索ブロック：入力名の完全一致（大文字小文字・先頭@を正規化）で候補を取得し、本人画像/名前を確認して既存block_setへ接続。自身・退会/停止者は検索対象外。検索15回/分まで。名前の重複は候補を複数表示し、先頭を自動選択しない。
- 051の最初の永続適用は自動承認レビューが拒否。権限変更を新規関数だけへ限定し、ROLLBACKテスト成功後、ユーザーがローカル/クラウド適用を明示承認。両方適用済み。
- `superassets`原本を保持。Home/チャット/ベルは従来のユーザー制作素材を維持。アカウントタブはuser/user-fill。時計/ゴミ箱を新UIへ追加しない。
- PIN：標準formSheet、SwiftUI Button/Toggle、同一ScrollView内見出し、定員展開/増減アニメーション、固定下部CTA、参加確定の全高Sheet。現地のスタックは到着した参加者だけとし、ホストは別枠、参加予定は別一覧とする。
- 4tabs内Settings/通知の子Stackを追加。プロフィール、city pool、メール変更、ブロックの遷移でタブ維持。メール変更は既存の新旧両メール確認を維持し、承認済みの6桁自動認証とリング→成功チェックへ置換。
- 起動/オンボーディング：戻された元動画を再読。SVGの人物と扉を分離した起動演出、welcome→メール→OTP、QRスキャン、名前→本人写真、pool提供→10秒welcomeを接続。動画との全フレーム一致は未確認。

通知日付の上端グラデーション・固定日付、運営画面のSwiftUI Form、QR履歴確認の子Stack pushを実装。Homeの招待残数は052のinvite_list結果へ接続。052もユーザーの明示承認後にローカル・クラウドへ適用済み。

現状（11月20日更新）：全29状態のSimulator照合と動画の主要タイミング比較はUI_REVIEW_STATUSへ記録済み。アイコン参照監査では、現行Mapの画像未提供時の旧presence-starを提供user-fillへ置換。旧イベント/募集ルートのclock等は残るが現行29画面に追加しない。通常/募集PINの他者操作は、最新指示により画像長押しから右上「…」のSwiftUI Menuへ置換済み。通報/ブロックの確認と戻るはSimulatorで確認済み（実送信なし）。気配画像fallbackもPID19506の本番StreetMapMarkersを使うfixtureで確認済み。実カメラQR、実メール、他アカウント参加/到着一巡は別の機能検証として残る。全ピクセル/動画全フレームの完全一致を宣言しない。

## 2026-11-19 Figma差分の再修正（R03/R12〜R14/R19）

- 最新ユーザー指示：Mapの電信ロゴ横に街人数を表示。通信エラーだけで人数を消さない。取得前は未取得として表示し、古い人数はアクセシビリティでも最終取得時と示す。履歴ee1939a以前の人数バッジを照合。
- 12→13は一の位だけを動かす。増減方向は数全体で判定し、各桁の旧値/新値が同じなら静止させる。
- Mapマーカーは中央のシンプルなしっぽ。Home/Sheetの曲線吹き出しとは分ける。吹き出しの本文を中央に配置し、背景としっぽを一体のSVG輪郭へ修正。参照した原資料は添付PNGと提供SVGで、編集可能な.figファイルは未取得。
- タブはフェードなし、現在画面と次画面を同時に画面幅だけ横移動。順番の逆移動では方向も反転。Reduce Motion時は移動しない。通信エラーダイアログはiOS標準Alertへ変更。
- 挙動の意味が変わる修正は事前に差分を提示してユーザーへ確認する。招待はユーザー回答により、有効な未使用QRを再表示し、再発行は未使用QRを置換、枠を追加消費せず期限を更新。登録済み履歴と相手は保持。削除による登録済み相手の利用停止は前回合意のまま。
- 053で認証済み発行者だけが現在QRを取得できるAPIを実装。旧コードはhashから復元せず、残っている正規command receiptだけから移行。復元できない旧未使用QRは再発行操作が必要。再発行は同じ招待レコードのtoken/期限を更新し、登録済みレコードは変更しない。使用/削除時に表示用tokenを消去。
- Historyは一つの角丸グループと行区切りへ修正。発行者→受取人/未使用の実データ表示を維持する。

追加のユーザー回答/指示：HomeのPINは対象位置のMapへ移動して半画面詳細を開く。同じ募集PINの再タップは閉じる、別PINは表示対象を置換し積み重ねない。Map詳細/参加確定ルートでもタブは暗色を維持。Accountのピンクヘッダーは負のスクロール量だけ縦に伸縮して上側の背景露出を防ぐ。実装後のSimulator確認を別に記録する。
