# iOS Native UI — 初回監査と移行計画

2026-11-19。監査基準 `c449960`。ユーザー指定により、この回はUI再設計のコード・依存関係を変更しない。既存の電信PINのクラウド配備とSimulator起動は別途明示承認済み。以下は静的な構造監査と移行案であり、全画面の実機合格を意味しない。

## 採用する方針

React Native / TypeScript、認証・API・GPS・NFC・チャットのロジックを維持し、iOSの表示・操作を本物のApple標準UIへ段階移行する。SwiftUI標準部品を `@expo/ui/swift-ui` で使用し、対応不能な要件だけSwiftUIのネイティブ部品を追加する。RN標準・独自部品はその後の選択肢。Androidの現行表示・操作は保持する。

Figmaは情報構造、電信PINの状態と導線、街の世界観の基準として維持する。iOSのタブ・シート・フォーム・ボタン・スイッチの外観と動作は最新のネイティブ方針を優先する。Liquid GlassをBlurViewや半透明Viewで模倣しない。標準Sheet/Tab Barで成立する操作を独自再実装しない。SF Symbols、システムの文字スタイル、Dynamic Type、VoiceOver、ダークモード、セーフエリア、キーボード、Reduce Motion/Reduce Transparencyを確認する。

## 現行構造・依存関係

| 対象 | コードで確認した現状 | 移行上の判断 |
| --- | --- | --- |
| 基盤 | Expo `~58.0.22`、Router `~58.0.29`、RN `0.88.1`、React `19.3.0`。具体解決版はlockfile | RN/TSを維持。SDK対応版の `@expo/ui` を後続で導入 |
| ナビゲーション | `src/app/_layout.tsx` のStack、react-native-screens `4.30.1`。PIN・入街等は既にnative formSheet | Stackを再利用。二重のSwiftUI NavigationStack/Sheetを載せない |
| タブ | `(tabs)/_layout.tsx` はRouter TabsとAnimatedTabButton/TabIcon。NativeTabsではない | iOSを `expo-router/native-tabs` へ。表示条件・ルート名・通知導線を維持 |
| SwiftUI | `@expo/ui` はpackage.jsonに未導入。独自PresenceNativeのUIはUIKit | SwiftUIを既存採用済みと扱わない。Host境界を画面またはまとまった領域で設ける |
| ガラス/背景 | PINのPinSheetはexpo-blur `~58.0.5`。SheetChrome→SheetBackdropはUIBlurEffectとCADisplayLinkで背景を追従 | iOSの独自背景・追従処理を標準Sheetへ置換。Android側は保持 |
| 実際のLiquid Glass | PresenceNativeModule.prepareEntrySheetとEventDateSheetにはOS条件付きの **UIGlassEffect** が既にある | 全てを偽物とは扱わない。ただし独自挿入背景や強制lightを整理し、システムの標準外観を優先 |
| 地図 | iOS react-native-maps `1.29.11` / Apple Maps。Android MapLibre `11.5.0`。地図上に独自マーカー・操作層 | 3D地図、座標選択、気配・PINの表現は保持。操作層からネイティブ化 |
| 共通フォーム | Page/Action、DetailUI、AccountPage、IconMotion、RN TextInput/Pressable等 | Form/List/Section/Button/TextField/Toggle等へ。APIや状態管理はhooks/libのまま |
| 日時 | iOS EventDateSheetはUIDatePicker＋標準pageSheet。datetimepicker `9.2.1`も依存 | 旧イベント互換画面の移行時に検討。電信PINへ日時予約機能を追加しない |
| アイコン・画像 | expo-symbols `~58.0.4`、SVG `15.16.0`、masked-view `0.3.2`、figma-squircle `1.1.0`、独自画像/アニメーション | 操作アイコンはSF Symbols。ブランド・アバター・地図マーカー素材は保持 |
| チャット | StreetChat/ChatInput＋Swift ChatIMEInput/ChatTouchRegion、キーボード重なり管理 | 日本語未確定文字、送信、スクロール、メンションを壊さないよう最後に移行 |
| 認証/端末 | PresenceNativeのAPIClient/PresenceEngine、SecureStore、NFC manager `4.2.0`、画像選択/加工 | UI移行のために認証・保存・背景処理・画像変換を変更しない |
| アクセシビリティ | 一部accessibilityLabel/stateとIconMotionのReduce Motion対応あり。一方DetailUIは固定色/サイズ、app.jsonはlight固定 | 対応ゼロではないが全体適合ではない。自動外観と文字スタイルへの移行が必要 |

監査範囲は全32 TSXルート/レイアウトの導線と依存、共通UI、iOS/Android表示分岐、Swift UIブリッジ、package/Pod設定。全ビジネスロジックの再検証や全画面の実操作は今回の監査には含めない。

## 画面ごとの具体的な移行先

以下の部品名はSwiftUIとしての構成案。Expo UIのSDK58で公開されるAPIを実装時に照合し、未対応部品だけネイティブブリッジを用いる。

| 段階 | 画面・ルート/条件付き画面 | 使用予定の部品と保持する接続 |
| --- | --- | --- |
| 1 | `_layout`、`(tabs)/_layout` | Native Stack/formSheet維持、iOS NativeTabs。標準ナビゲーションタイトル・toolbar・閉じる/戻る。認証ガード、タブ非表示条件、deep linkは維持 |
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

クラウド版をiOS27.0 Simulatorで起動し、未入街から作成を開き、募集/定員切替と位置選択往復の保持を確認。ただし作成シートで見出し/閉じる/保存と本文入力欄が重なり、閉じる位置へのタップが入力欄に届く。シート外タップで地図へ戻れた。保存・公開や参加一巡は未確認。標準Sheet/toolbar/Form移行の最優先修正としてDP01に残す。今回コード修正は行わない。

## 実装方法と検証ゲート

1. iOS用表示アダプターを設け、Android既存部品と共通hooks/libを維持する。Expo UIをSDK対応で導入しlockfile固定、ネイティブビルドをまとめて実施。現在のiOS deployment targetは16.4。導入時に依存の最低OSを照合し、OS条件は無断で引き上げない。
2. 各段階で状態/イベントの契約を変えずに表示部品を置換。PINの24時間・日次3個・定員競合・名簿状態はDB側の既存仕様を再利用する。JS側へ制約の正本を移さない。
3. Native Stackが所有するSheetにはSwiftUIのSheetを重ねない。RN/SwiftUIでスクロール、セーフエリア、キーボード補正を二重適用しない。位置選択往復の未保存入力、戻るジェスチャーとキャンセルを確認する。
4. 各段階で対象の型/Lint、状態遷移の必要な回帰確認、Simulatorの操作確認を実施。その後iPhone実機で同じ導線、背景復帰、文字サイズ、VoiceOver、light/dark、Reduce Motion/Transparencyを確認してから段階合格とする。Androidは関連する分岐の回帰確認を行う。
5. チャットは日本語IMEの未確定/変換/連続送信、添付、スクロール、キーボード表示中のSheet往復を専用の合格条件にする。NFC・背景GPS・実PushはSimulatorで合格扱いにしない。

関連R03〜R19/R21/R22。電信PINはDP01とR12/R13/R14/R16/R17/R19。旧33タスクのDONE履歴・固定分母を増減させず、UI段階の達成を別記録する。今回はこの移行の実装0段階、実機合格0段階。既存PINの配備をSwiftUIへの移行完了と混同しない。

## 公式資料の照合

- [Expo UI SDK58](https://docs.expo.dev/versions/v58.0.0/sdk/ui/) と [SwiftUI / Host](https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/)：ReactからSwiftUIの実部品を使用でき、HostでUIKitと接続する。SDK対応版を選んで段階導入できる。
- [Native Tabs](https://docs.expo.dev/router/advanced/native-tabs/)：SDK58の公開importは `expo-router/native-tabs`。現在のJS Tabsと異なりOSのTab Barを使う。
- [Apple: Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)：標準バー・シート・コントロールを優先し、重複する独自背景を取り除く。ガラスは操作/ナビゲーション層に限定し、表示設定・アクセシビリティで確認する。

以上は2026-11-19に一次資料を確認した計画。依存導入・コード変更・新UIの実機検証はまだ行っていない。
