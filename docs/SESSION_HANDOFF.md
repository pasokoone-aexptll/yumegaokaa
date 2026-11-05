# セッション引き継ぎ — 2026-11-05

## 最初に読むこと

この資料は長期チャットなしで再開するための入口。[README](README.md) → 本書 → 作業対象の仕様・コードを読む。11月5日にUI操作改善と整理、期限切れ署名の更新・iPhone再インストールを依頼され、UIコードを更新した。変更・検証はUI_REVIEW_STATUSとTECH_VALIDATIONの11月5日記録を参照。DBリセット・チャット再削除・GitHub pushは禁止を継続する。

監査時のコード基準は `2ab1d9b`（Update mobile UI and architecture docs）。開始時の作業ツリーはclean。今回の監査は進捗資料・仕様と、Router、Mapのプラットフォーム分岐、入街/気配hook、Swift接続、配信スクリプト、入街ログSQLを照合したもの。全コードの再レビューや全機能の再実行ではない。既存試験の証拠と今回確認した事実を区別する。

最新ユーザー指示が優先。過去の「UIは後工程」は、11月2〜3日にユーザーが依頼したUI改修を禁止する意味ではない。ただし未承認の新機能をUIサンプルから推測して追加しない。

## 11月5日の再開作業

地図移動中の本文減光、タブ/マーカーのタップ反応・haptic、Home pull強制再取得、白いOK、DreamCloudヘッダーロゴ、オフライン時のタブ表示を実装。UIプレビューの描画分離とtapアニメーション共通化も実施。型/Lint・対象回帰試験成功。実機操作の合格は未記録。

再インストールは実機ロックで最初のbuildが停止。ユーザーが解除済み。汎用iOSビルドでXcodeのApple Account未サインインと有効profile不足を確認し、ユーザーがXcode Settings→Apple Accountsへサインインしたが、既存チーム8RHW9L5LBFを持たないため再buildも署名段階で停止。従来アカウントの追加を依頼中。別チームへの切替・アプリ削除は行わず、署名成功・インストール完了とは扱わない。API health HTTP200、配信gateway54325は再起動済み。LAN接続先172.30.100.165を継続。

## 現在のフェーズ

**MVPロジック・ローカル統合の主要部分を実装済み。Figmaを基にしたUI改修と実機での仕上げ、外部サービス接続を残す段階。公開済みでも全機能完成でもない。**

[MVP_TASKS](MVP_TASKS.md) の33タスクとcp102完了条件を維持する。旧DONEは当時の条件の達成であり、その後のUI変更の実機合格を意味しない。

| 指標 | 現在の記録 |
| --- | --- |
| ステータス | DONE 27 / IMPLEMENTED 1 / IN_PROGRESS 2 / TODO 0 / BLOCKED 3 |
| 完了条件達成率 | 27/33（81.8%） |
| ステータス上の実装到達率（DONE＋IMPLEMENTED） | 28/33（84.8%） |
| 独立したコード実装達成記録 | 29/33（87.9%） |
| 統合確認 | 27/33（81.8%） |
| iPhone実機確認 | 11/33（33.3%） |
| ロジック実装 / ロジック検証 | 30/33（90.9%） / 28/33（84.8%） |
| UI仮操作 / 最終UI確認 | 23/25 / 0/25 UI関連タスク |

異なる達成定義を合算しない。件数比は作業量比ではない。詳細は [LOGIC_PROGRESS](LOGIC_PROGRESS.md)。今回の文書整備で数字は変更しない。

## 残作業の境界

[MVP_REMAINING](MVP_REMAINING.md) の固定ベースラインは **ローカル4項目→4項目、外部3項目→3項目**。

| 項目 | DONEを妨げる条件 / 次の最小作業 |
| --- | --- |
| T007-03 | Q10の本番地図・表記条件。iOS Apple Maps採用自体は決定済み。採用を議論し直さず本番素材/条件を確定する |
| T010-01 | 本体で画面ロック中の歩行・静止更新が実DBへ届くことの実機証拠 |
| T032-02 | 街内の気配、通信断、募集、運営など残る実機操作。既存成功証拠を再利用し不足だけ確認 |
| T032-03 | Q11の保証範囲と性能。初期同時利用30人は承認済み。300人の料金相談を負荷目標変更と扱わない |
| T019-E | ADP/APNs資格情報、実端末の通知許可・受信・タップ遷移 |
| T028-E | ADPと実タグによるNFC読み書き・照合。タグは手元にあるとの回答あり |
| T033-E | クラウド設定・本番運用・公開準備。契約や公開は別途判断 |

以前の推測工数はローカル3〜6時間＋不明な待ち時間。**現在の総残工数ではない**。後述の追加UI・全ページモック・MR機能を含まない。今回再見積もりはしておらず、それらの総工数は不明。残作業を追加する場合は既定条件との関係、必要性、見積もりへの影響を記録する。

## 実装と未検証の整理

| 領域 | 実装・既存証拠 | 残る区別 |
| --- | --- | --- |
| 認証・招待・プロフィール | メールOTP、招待、本人画像、街pool画像、再起動復元、アカウント例外処理。T002〜005 | 新しい夕焼けUIのキーボード等は別途実機確認 |
| 入街・気配・退出 | DB/API、更新元端末固定、再送/終了優先、端末区画化、集約。T008〜012 | 実NFCは代用。本体ロック歩行/静止の実DB成立は未確認 |
| 募集・イベント・Home | 作成/編集/終了、イベント参加取消・中止・参加者管理・通知を接続。T013〜018 | 後から変更した地図選択、ドラッグ、sheet演出の実機確認は未完 |
| チャット・通報・ブロック | 送受信/履歴/削除/通報/ブロック/解除、名前付き入街ログ。T020〜023 | 最新のキーボード追従やスクロールUXは既存DB試験だけでは保証しない |
| 運営・ステッカー | MFA、制限・停止、招待監督、登録/移設/範囲公開。T024〜027 | 運営の実機確認は認証アプリ未準備で保留。タグ書込み成功とは別 |
| 配信・清掃 | 接続ゲートウェイ、認可、共通コマンド、期限清掃。T029〜031 | ローカル統合済み。本番配備は未完 |
| Push | APNs直接送信worker、端末登録、配信待ち処理、ローカル疑似APNs試験 | 実APNsは未検証。アプリ内通知の成功と混同しない |
| UI状態カタログ | 開発専用 `/ui-preview`、製品27ルート索引、12モック状態 | 全ページのモック化は未完。索引から通常画面に移ると実データ操作 |

証拠の詳細： [TECH_VALIDATION](TECH_VALIDATION.md)、[LOCAL_FLOW_ACCEPTANCE](LOCAL_FLOW_ACCEPTANCE.md)、[NAVIGATION_ACCEPTANCE](NAVIGATION_ACCEPTANCE.md)、[RETENTION_ACCEPTANCE](RETENTION_ACCEPTANCE.md)。ユーザーが確認したログイン維持・両画像保存、イベント参加/取消と通知、チャット削除、通報/ブロック、退出後OFF維持などを不必要に最初から繰り返さない。

## アーキテクチャと実装の接続点

単一バックエンドの論理構成。Supabase Auth/PostgreSQL/Storage＋配信ゲートウェイ＋保守/Push worker。単一プロセスという意味ではない。クラウド移行前で、現在はMac上のローカル環境。

| 層 | 実装の入口・責務 |
| --- | --- |
| Router | `apps/mobile/src/app/_layout.tsx` と `(tabs)/_layout.tsx`。認証リダイレクト、sheet detent、4タブ（Home/Map+チャット/通知/Settings） |
| UI | `apps/mobile/src/components/`。描画と操作をhooksへ渡す。独自nativeぼかし/touch領域との関係に注意 |
| hooks | `src/hooks/useStreetMap.ts`、`useStreetChat`、`useChatComposer`、`usePinCreation`、`useEventDetail`、`useEventEditor`、`useNotifications`、`useAccountAccess`ほか。既存接続を再利用 |
| 共通処理 | `src/lib/native.ts`、`sessionState`、`gatewayConnection`、`commands`、`pinDraft`、`pinPlacement`、`mapNavigation`ほか |
| iOS地図 | `src/components/map/PlatformMap.ios.tsx`：react-native-maps/Apple Maps、暗色3D表示 |
| Android向け地図 | `src/components/map/PlatformMap.tsx`：MapLibreを保持。iOSと配置ドラッグ等の機能同等性は未完成、Androidビルド未検証 |
| iOS機能 | `apps/mobile/modules/presence-native/ios/`：PresenceNativeModule、PresenceEngine、ObservationCore、VisitLifecycle、APIClient、PushNotifications、StreetBackdrop、ChatTouchRegion |
| DB | `supabase/migrations/`：app_privateと公開RPC、認証/資格/更新元/期限/競合を検証。画面だけで認可しない |
| 配信 | `scripts/realtime-gateway.mjs`、関連migration035。認証・1アカウント3接続上限・強制切断。直接Realtime迂回を再開しない |
| Push | `scripts/push-worker.mjs`、migration038、[PUSH_DELIVERY](PUSH_DELIVERY.md)。APNs HTTP/2/JWT、配信待ち・再試行 |

地図・チャット・通知はDBのスナップショット取得と変更配信を接続する。UI差替えのためにDB/RPC契約や認可を変更しない。`useStreetMap` は多数の状態を統括するので、見た目修正の際に入退場や再送を混ぜて変更しない。iOS native差分はJS reloadだけでは反映されない。

### 依存関係

`package.json` と `apps/mobile/package.json`、lockfileがバージョンの正本。

- Expo ~58.0.22、React Native 0.88.1、React 19.3.0、TypeScript 6.0.3、Expo Router ~58.0.29。
- supabase-js 2.118.0、Supabase CLI 2.122.0、pg 8.16.3、ws 8.22.0、proj4 2.20.2。
- MapLibre 11.5.0、react-native-maps 1.29.11、nfc-manager 4.2.0。
- datetimepicker、masked-view、expo-blur、image-picker/manipulator、SecureStore、SVG、figma-squircle等。新規セッション開始だけを理由に更新・再インストールしない。

## 変えてはいけない仕様・重要な決定

詳細は [MVP_REQUIREMENTS](MVP_REQUIREMENTS.md)、[DECISIONS](DECISIONS.md)、[ACCEPTANCE](ACCEPTANCE.md)。

- 目的は「街の気配を感じる第六感」と現実の文化。投稿や親密な関係を義務にしない。気配のない地図に黙って縮退しない。
- 招待制・メールOTP。通常ログインで旧端末をログアウトしない。一つの滞在の更新元は一端末で、新端末ログイン時に移管しない。QR引継ぎ案は廃止。
- 新規チェックインごとにNFC。チェックイン3時間、気配10分。新しい有効な街内観測の受理で3時間延長。同じ滞在の最新気配を置換し、位置が変わるたび人数を増やさない。
- 退出・失効後に遅い応答や再送で復活させない。再起動・通信復帰時も退出要求を優先する。
- 100m区画は端末で計算。精度50m以下、鮮度最大120秒、移動時最短30秒・静止時約3分を目安とする。厳密な条件/時計補正/境界は [OBSERVATION_RULES](OBSERVATION_RULES.md)。OSによる更新時刻を保証しない。
- 受動的な気配に正確な位置・移動経路を蓄積しない。サーバーの完全匿名性は保証しない。他人に追跡用個人キーを渡さない。
- 気配7人を5＋2に見せても観測区画は同じ。表示上のみずらす。画像列は幅に合わせて表示数を算出し、残数を表示。3時間のチェックイン人数と10分の気配人数を分ける。
- 本人プロフィール画像と街pool提供画像は別。日替わり割当は日本時間0時。本人も当日画像を確認可能。取り下げ・退会時の撤去あり。
- チャット履歴30日。本人の名前/画像を使用し過去投稿も現プロフィールを表示。入街ログは名前付き。
- 募集は有効な滞在が必要、公開地点を確認し作成時位置を固定。20分・手動終了・退出で終了、編集で延長しない。
- イベント定員初期20人/1〜100人。参加者名は主催者と運営のみ。承認制・待機列・当日受付・決済は対象外。利用停止で主催イベント中止・本人の参加登録取消、解除しても復活しない。
- 運営はOTP＋TOTP/MFA必須。投稿制限は終了日時指定、利用停止は解除まで。ステッカー3箇所以上による街範囲、移設後は次の観測で最新範囲を判定し全員強制退出しない。
- 共通操作受付10分、結果最小記録は受付終了後24時間。入街の既存2分期限とは別。保存期限は [RETENTION_ACCEPTANCE](RETENTION_ACCEPTANCE.md) を参照。
- 本番契約・課金・クラウド設定・公開はユーザー判断。GitHub pushはその都度明示指示が必要。

## 追加機能・仕様未確定

[MAP_REDESIGN](frontend-redesign/MAP_REDESIGN.md) MR01〜05と [OPEN_QUESTIONS](OPEN_QUESTIONS.md) を読む。

- **ゴースト**：チェックイン人数に含め、自分の地図/画像列の気配を消し、募集を終了する方向は合意。未実装。更新/再公開等の詳細を確定してから接続する。現在の無効なUIを動作済みとしない。
- **滞在時間レベル**：現在の滞在時間を示す意図。レベル尺度・更新/公開条件は未確定、未実装。
- **メンション＋相手へのアプリ内/Push通知**：追加意図あり、未実装。既存イベント通知とは別。
- **募集ピンの当日街pool画像**：希望は決定済みだが必要なレスポンス接続が未完。本人画像で代用して完成としない。
- **入街ログ10分抑制**：同じアカウント＋街、最後に実際に記録したログから10分、という案は相談中。MAP_REDESIGN cp160も未実装と記載。`202610290001_core.sql` の入街時arrival_logs挿入と照合した。チャット全削除はこの機能の実装ではない。
- **全ページのモック表示**：ユーザー依頼済み。cp175の12状態だけで完成ではない。通常ルート索引の実操作と安全なモックを明示的に分離する。

## UIの現在地・既知の問題・技術的負債

[UI_REVIEW_STATUS](frontend-redesign/UI_REVIEW_STATUS.md) がUI進行の入口。`frontend-redesign/01〜07` は主にcp134の調査スナップショットで、後続変更をすべて表すものではない。現在の経路はRouterとMAP_REDESIGNの後続記録で確認する。

- 地図は暗色、他タブは明色。文字・部材は黒白のalphaを基本にする。コード指定のBold以上は600へ変更済み。指定画像はrepo内assetsの実体と照合して使用する。
- iOS標準の参加スイッチを維持。入街sheet、3×3の色変化dots、最短3秒演出、成功haptic/自動閉鎖等は後続改修あり。未検証を完成保証としない。
- Homeの詳細は通常画面、Mapからの詳細は半分/全画面sheet。地図で見る→Map＋対象詳細、カメラ位置補正を接続。地図選択は既存Mapを使用する。
- 最新チャットのキーボード表示時アンカー、指に追従する拡大、余白の地図操作、透明度/背景グラデーション境界は繰り返し不具合報告があった。コード修正履歴はあるが最新ビルドの一括実機確認は未完。
- ピンの直接ドラッグ、3Dカメラ追従、選択リング、タブ切替/日時入力sheetの重なりも実機で確認する。スクリーンショットの古い不具合を現存と断定しない。
- `useEventDetail` の取得失敗が通信断・削除・終了の区別を曖昧にする箇所は要確認。非通常状態カタログで実表示と復帰操作を確認する。
- [BUG_BACKLOG](BUG_BACKLOG.md) B001/B002は旧外観の記録。Home/カメラの後続改修後の再現性が未確認で、古い画面のまま修正しない。
- レイアウトはhooks/services/nativeから分離する。大規模整理のみを目的にリファクタリングしない。認可/保持期限/再送を見た目変更で弱めない。

## 最新ビルド・ローカル環境

2026-11-04 cp176：`scripts/ios-validation-release.mjs` による検証用Release成功（0 errors/4 warnings）、main.jsbundle存在、署名検証成功。同じ成果物をロック解除後のiPhoneへインストール・起動成功。**起動成功だけで全UI確認済みではない**。Personal Team、実NFC代用、bundle `jp.yumegaoka.development`、表示名「夢ヶ丘 検証用」。

成果物：`/Users/kitchenopen/Library/Developer/Xcode/DerivedData/app-bmqyqrnfvctbedgwfdjyrgbgeext/Build/Products/Release-iphoneos/app.app`。一時ログ `/tmp/yumegaoka-release-20261104.log` は消える可能性がある。アンインストールしていない。

ReleaseはMetro不要だが**ローカルAPI・配信サーバーは必要**。外出先でMacへのLAN接続がなければデータは取得できない。前回LAN IPは172.30.100.165であり現在値の保証ではない。ネットワーク変更後は実際のIPとアプリ接続先を確認する。

| ポート | 用途 |
| --- | --- |
| 54321 | ローカルSupabase API |
| 54322 | PostgreSQL |
| 54324 | ローカル確認メール/Mailpit |
| 54325 | 配信ゲートウェイ |
| 8081 | Metro（開発版のみ） |

今回read-onlyのlisten確認では54321/54322/54324にssh転送あり、54325/8081はlistenなし。API health・worker稼働は今回未確認。これは一時的な観測で、次回必ず再確認する。今回起動/停止操作なし。

再開時はroot package scriptsと `scripts/setup-local.mjs` を読む。`setup:local` / `LOCAL_API_URL` の設定を確認し、秘密を出力せず必要な接続先だけ更新する。`db:start` は既存データを維持。**`db:reset` は破壊的なので再開手順に使わない。** コード確認だけならサーバー起動不要。開発モードはMetro、native変更時のみまとめてビルド。ユーザー未指示の常駐プロセス大量起動を避ける。

### 直前のチャットリセット

ユーザーの「チャット全リセット」と確認に基づき、前セッションでローカルDBの `app_private.messages` 24件、`arrival_logs` 71件をtransactionで削除、両方0件を確認してcommitしたという実行記録を引き継ぐ。今回再削除・現件数の再照会はしていない。他のアカウント/イベント/ピンをリセットする依頼ではない。新規投稿・新規入街で再び増えるため、次セッションで自動的に再実行しない。

## 次セッションの進め方

1. Gitの差分と本書以降の更新を確認。進捗やauditをゼロから作り直さない。
2. ユーザーが選ぶ次の作業を限定する。UI確認を続けるなら、UI_REVIEW_STATUSの未確認と全ページモック不足を基準に進める。既定MVP残4項目と追加UI項目を混ぜない。
3. オフライン/送信中/結果不明/投稿制限/期限切れ/権限拒否/空状態の表示・再試行をモックで再現する。実DB削除や実際の通信断を勝手に起こすモードにしない。
4. 実機操作可能なら、最新版で重要なUIフローをまとめて確認。T010/T032の実機固有の証拠を集める。実機保留中は未検証を明示し独立作業のみ進める。
5. 外部T019/T028/T033は必要な設定をまとめて依頼。ADP未加入を理由に既存ロジックを書き直さない。

成功済みテスト/ビルドは関連変更・失敗・未解決懸念がある時のみ再実行。検証前に対象不具合と必要な証拠を決める。進捗更新には該当R/T番号、実装と仕様の差、検証/未確認、残項目増減を残す。ローカルcommit、pushは明示指示時だけ。
