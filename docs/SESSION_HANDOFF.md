
## 2026-11-25 ストア審査対策

Codex用app-store-complianceを導入・自己検証・手動実行済み。自動フックはSettings → Hooksの信頼承認をユーザーが行う必要あり。ユーザー承認の退会本文削除を057へ実装、ローカルDB試験・適用成功。クラウド配備／実機は未実施。公開連絡先は未定、ポリシー草案と未確認提出防止を準備。再実行は `npm run compliance:check`。詳細と残件は[APP_STORE_COMPLIANCE](APP_STORE_COMPLIANCE.md)。旧33件の達成記録は不変。

<!-- 2026-11-22 U47/U48: 冒頭/QR展開/スキャナ/プロフィール/完了まで元動画を視覚比較。Simulator操作で雲消失とゲージ重なりも検出修正。TECH_VALIDATION U48参照。実カメラ・OTP・実機は未検証。 -->
# セッション引き継ぎ — 2026-11-05

2026-11-19追記：電信PINのQ-DP01〜06はユーザーが推奨案をすべて承認。DENSHIN_PIN_SPECに本文反映しDP01実装を開始。旧有効データがある場合の移行判断は配備前に確認。

## 現在の再開点（2026-11-24・Android移植）

ユーザーがiOS UI完成を明示。`5f9e895..1709cce`のAndroid移植を自律サイクルで開始。現在の作業と残件は[ANDROID_UI_PORT](frontend-redesign/ANDROID_UI_PORT.md)。旧iOSキューの記録は以下に保持し、Androidの確認済み根拠へ流用しない。

Android移植は共通操作部品・Map/PIN・keyboard・QR権限・運営画面・アイコンまで実装。API35 emulatorの対象UI検証とRelease成功。PIN半画面の固定操作はAndroid native footerへ接続し、展開/折りたたみ後の表示を第16版で確認。ローカル実接続でOTP/プロフィール写真保存/PIN作成・編集を確認。Expo stopObserving予約名衝突を修正しDebug成功。Home/設定/本人チャット送信・再訪/通知詳細も実データ確認、修正後Releaseビルド成功。最終Release再起動、相手チャット受信/PIN参加・名簿も確認済み。運営MFA/自分の検証招待取消も実API確認済み。UI移植と利用可能なエミュレーター確認を完了。実カメラ受付/物理Androidの製品受入は未確認。最終照合はANDROID_UI_PORT末尾。旧33件は不変。詳細と未確認はANDROID_UI_PORT/TECH_VALIDATION末尾。

### 2026-11-25 Androidアイコン173/174（最新）

06:47のユーザー指定SVGへAndroidアイコンのみ更新。通常173、Adaptive用角なし173、monochromeは174の図柄alpha。生成スクリプト更新、4PNG/alpha確認、ローカルRelease成功、Pixel上書き・アプリ情報の円形表示確認済み。テーマ配色はOS任せ、iOSは未変更。ANDROID_UI_REFINEMENT_20261125末尾参照。

### 2026-11-25 シートボタン上端の切れ（前回）

05:53の再指摘で、線画ではなくheader.marginTop=-12/content.paddingTop=10による2dpのはみ出しが原因と確認。Androidの負marginを除去しpaddingTop=0へ変更、Pixelの無効チェックと×が円形に描画されることを確認。対象Lint/ローカルRelease成功、Pixel単体動作版を再更新済み。詳細はANDROID_UI_REFINEMENT_20261125末尾。

### 2026-11-25 シート等5点の再調整（前回）

IMG_1714/1715を受け、Androidの×/チェック線画、吹き出し一体描画、通常モードの緑（active依存除去）、カプセル左右各4dp増、チャット下60%の連続ぼかしを実装。型/対象6試験/Debug/JS同梱ローカルRelease成功、Pixel上書き済み。StreetChat Lintは変更前から4件のrefsエラーがあり今回増加なし。実画面でPINタップ、作成シート、Map/モードを確認。詳細と証拠はANDROID_UI_REFINEMENT_20261125末尾。

### 2026-11-25 実機写真による再修正（前回）

IMG_1711/1712で確認したMapカプセル輪郭、NFC地点の実背景ぼかし、Home雲の画像名衝突を修正。雲はAndroid資源名の衝突で通常ロゴに化けていたため固有ASCII名へ変更し、元画像のalphaと配置を保持。NFC地点はAndroid実View Marker＋PixelCopy/blurMapへ変更。型/Lint/Debug/最終ローカルRelease成功、エミュレーターでパン後のぼかし確認、Pixelへ単体動作版を上書きしHome/Map確認済み。原本との比較画像と詳細はANDROID_UI_REFINEMENT_20261125末尾。

### 2026-11-25 Pixel単体動作版（前回）

ユーザー指定により、ストア提出なしのローカルテストAPKをJS同梱でビルドしPixelへ上書き済み。ADB reverseを全て外してコールド起動し、保持されたアカウントのプロフィール写真設定画面を確認。USB/Metro不要（オンライン機能はネット接続が必要）。Mapのボタンをカプセル半径17dp、Homeのゴースト丸を黒55%へ変更。場所表示はエミュレーターDBのplacements=0を確認し、fixtureではON/OFF描画正常。本番バグ解消とはせず、発生端末の回答待ち。詳しくはANDROID_UI_REFINEMENT_20261125末尾。ビルドスクリプトはscripts/build-android-local-test.sh。ユーザーが一時停止した審査フックは再有効化可能。

### 2026-11-25 原本33枚との反復照合・Pixel開発版更新

Downloads/figmaaaaaaaaの全33枚とAndroidを撮影比較し、シート背景切れ、作成画面の欠け/高さ、スイッチ、Pool、運営レイアウトを修正。追加指定のedge-to-edgeを実装しPixel 6aへDebug上書き・welcome起動確認済み。USB＋Metro8083が必要。型/対象Lint/11試験/Debug成功。完全な画素一致・全実機フロー合格とは扱わない。長時間deeplink/Hot Reload後のOOM原因は未確認。3ボタンの明暗指定はSystemUIで反映確認済み。33状態の比較と修正対象の再撮影を完了。[比較台帳](frontend-redesign/ANDROID_FIGMA_COMPARISON_20261125.md)に撮影根拠と残りを記録。iOSの表示仕様は維持。

### 2026-11-25 Android限定の外観修正

ユーザーが添付画像で指摘したアイコン比率/Intern+Noto Sans JP/吹き出し欠落/Homeメニュー位置/シート全体/ボタン透過色/人数分母を修正。最新の正本は[ANDROID_UI_REFINEMENT_20261125](frontend-redesign/ANDROID_UI_REFINEMENT_20261125.md)。前回の移植確認を外観のユーザー合格と混同しない。iOS専用素材/ファイルは未変更。Android API35の実表示確認、型/対象Lint/8試験/Debug/Release成功。エミュレーターへ新Debug反映済み、実機は未確認。3:51の追加指摘でfooter背景帯を撤去し参加ボタンを白18%、入街を50%高へ圧縮。JS変更をMetro反映・実表示確認済み（詳細は同再調整台帳）。

### 以前のiOSキュー記録

U46：オンボーディングの元動画再照合を進行。keyboard時の上側構図保持/CTAと補助リンクの重なり解消、認証3+3間隔、メール文字/青吹き出し、プロフィール背景等を修正。型/ReleaseとSimulator入力/認証fixture/写真設定確認済み。現在review-onboarding招待画面。全フレーム一致と実機は未完。招待はQRのみ維持とユーザー確定。TECH_VALIDATION末尾に詳細。

iPhone最新：U49（11/22・人物列重なり/人数太字/Maps帰属/トグルから試験入街、U46〜48も含む）を上書き済み。Release/インストール成功、起動は端末ロックで未確認。FIELD_TRIALは本人限定試験タグ経由で池袋入街、実GPS観測は通常処理。Simulator /tmp/u49-pin.png・u49-chat.pngで配置確認。型/入街8テスト成功。現地検証はユーザー実施待ち。

U44：21時指定のchat/Mapタブ色、通知同幅、吹き出し90%/曲線/右端欠けを修正しSimulator確認。iPhone17へU33〜44を含む最新版を上書きインストール済み。詳細TECH_VALIDATION末尾。

U40：PINドラッグ復旧をSimulator/ユーザー確認済み。U41通常PIN外縁blur/80%白吹き出し/統合影をSimulator確認、U43通知アイコン左端整列も確認。U42キーボード背後#242321延長は実装済み、software keyboard表示の確認待ち。実機未更新。

U38/U39：PIN新規作成3文字以上と通知左右余白修正を実装、Simulator確認済み。実機は未更新。詳細TECH_VALIDATION先頭。

U19〜37の今回指定修正を保存。iPhoneはeb13334（U19〜32）を11/21上書き・起動済み。SimulatorはU36まで、最後はreview-chat fixture。U33扉clip退場/Native戻る/ゼロから数字演出を確認。U34未使用旧部品4件削除、CODE_UI_AUDIT_20261121参照。U35リングをnative preview内の背面/下へ、仮置きと確定位置一致を確認。U36送信中→receipt→一覧を同じkeyで更新、本人profile/decoded画像を共有、fixture録画確認。U37制限エラー分類は型/単体試験のみ（Simulator/iPhone未収録）。実クラウドchat送信・実OTP・実GPS追従は未確認。全29画面/動画の完全一致は未宣言。最新キューの項目別記録参照。

11/21 継続：PID87983レビュー版でHome両方空・指定SVG中央、参加/mention素材の分離、NFC地点の薄いmaterialとタップ非遷移を確認。証拠は/tmp/home-empty-20261121.png、notice-kinds-20261121.png、nfc-material-20261121.png。NativeToggle固定64×36をmatchContentsへ変更しPID89432で作成欄の余白を確認。現在はレビュー版がSimulatorに入り、Mapへ戻っている。実機未更新。詳細TECH_VALIDATION末尾。

11/21 最新ユーザー指定のHome/Map/PIN/通知を修正中。ユーザーが入力を閉じたと回答したため通常版PID84800へ更新済み。Home空セクション非表示/ghost視認、PIN作成中央揃えとカプセルをSimulator確認。ロゴfill:noneの白塗り回帰と入れ子maskの文字消失を修正し、PID86627で文字/輪郭/透過を確認。最終16pt行paddingはまだSimulator未反映。両方空/NFC素材/通知種別の最終照合は未完。TECH_VALIDATION末尾参照。

11/21：診断導入後30分の実API失敗ログは0件で、元の失敗原因は依然未確定。失敗時も固定頻度で自動取得する実装を改善し、ReadRetryでチャット5→10→20→最大30秒、Map10→20→40→最大60秒の待機を適用。成功時リセット、手動チャット更新/履歴追加/操作後のMap更新は待機を迂回。Realtime通知やqueued refreshも自動取得の待機を迂回しない。scripts/test-read-retry.cjsで待機境界/手動迂回/上限/回復/読取間独立を確認、既存遅延表示テスト/型検査/通常Release成功。ユーザーのPIN入力保護のためSimulatorへ未インストール、実回線での改善確認は未完。

11/21 通信復旧検証：PID79454で50秒のSimulator限定読取失敗→会話/PIN保持・Alertなし→小さな待機文→回復消去を確認。Homeの即時エラー文も30秒待機へ修正し型検査/Release成功。PID80537でHome初期表示後、ユーザーのPIN入力「ああ」を観測したため画面操作/再起動停止。入力を破棄しない。試験の失敗期間は60秒で終了済み。Home長時間表示は未確認。

11/21 通信UX承認後：自動取得のrefreshErrorをAlertから分離、チャット取得の反復toastを撤去。30秒継続時のみ予約領域に小さな状態表示、回復で消去。型検査/遅延状態テスト/通常Release成功、PID78027でMap/チャット正常表示確認。続いてチャット操作失敗をreadErrorからactionErrorへ分離し入力欄側へ表示（型検査成功、最後の分離はSimulator未反映）。実回線断の復旧確認は未完。LaunchSplashの足縁/投影修正は別件の未commitとして保持。

11/21：ユーザー指摘の反復toast/通信Alertを優先調査。チャットはiOSで5秒周期、showReadFailureが常にtrue。地図は10秒周期の複数取得を1つのcatchで扱い、refreshErrorを操作errorと合成してAlertへ渡す。取得失敗の分類を失っており、画像時点の真因は未確定。APIClientへ端末内の失敗診断（操作名、HTTP status/短いエラーコード、URLエラー番号）を追加。本文/URL/認証情報/個人識別子は記録しない。通常Release成功、PID76449で地図/チャット取得を確認。log stream観測中に失敗ログなし。診断導入は再発の解消を意味しない。表示方針・再試行頻度・API制限は未変更。 ユーザーへのUX提案は未承認。スプラッシュ足縁/影の未commit修正は検証済みだが、通信調査を優先して保持。前push session3215は長時間応答なしでCtrl-C終了130、remote追跡はdbfacc7のまま。

22:34：元動画の扉上端近傍の輪郭を20fpsで測定し、左端固定・約250msで加速して全開となることを確認。旧白ワイプは床までの幅2.8倍を504msで等速移動するため扉だけは約180msで全開だった。ワイプへ50msごとの原本幅比0/.14/.32/.57/.85/1のkeyframeを追加し、床まで702msで展開。型検査/通常Release成功。PID69554、録画 `/tmp/launch-opening-2234.mp4`、連続画像 `/tmp/launch-opening-frames.jpg` で細い開口→人物→床を確認。最初の可視幅23/294px（約8%）、前録画72/294pxから改善。全フレームの一致や初期描画遅延の完全解消は未宣言。実データ変更・実機転送なし。

22:30：LaunchSplashを初回onLayout後の2フレーム待機で開始。既存100ms待機/1800ms演出/Reduce Motion条件は保持。型検査・通常Release成功。録画 `/tmp/launch-current-2228.mp4` と `/tmp/launch-layout-2230.mp4` の同じ走査線で最初の緑幅が78px→46pxへ減り、細い開口の描画が改善。ただし元動画は別解像度で7pxから観測され、最初のフレーム差は残る。録画には再起動操作も含むためPID68533の全区間一致とはしない。Map復帰まで録画確認、実データ変更なし。

22:26：完了演出を初回onLayout後の2フレーム待機で開始し、描画前に進行する時間を抑制。自動遷移の計時もlayout後へ。型検査/通常Release成功、PID67182の起動完了後の録画 `/tmp/welcome-layout-warm.mp4` を60fps走査線で計測。開口0.433秒/保持2.217秒/閉口0.617秒（元動画0.450/2.200/0.633秒）。以前の開口0.383秒から改善し各差は約1フレーム。起動直後の最初の録画はルート初期化が重なり対象演出を含まないため測定対象外。全フレームの形状一致の保証ではない。実データ変更/実機転送なし。

22:22：通知詳細の旧画像の文字欠落を再検証。確認版PID65569で「了解しました」と戻る矢印が正常描画され、欠落は再現せず。`/tmp/notice-detail-current-2221.png`。表示コード変更なし、実既読更新なし。通常Release再ビルド成功、Simulatorを通常版へ復元済み。

22:14：PIN作成ラベルを原本141/142の18pt/line24へ（詳細の募集モード16ptは維持）。型検査/通常Release成功、PID63523で半高→定員→人数展開→×即破棄→Map確認。保存/公開/実機転送なし。

22:12：StreetLogin見出しの即時置換を150ms消去→300ms出現へ。型検査/確認版Release成功、PID61686の録画で元動画の旧見出し→新見出し→入力欄の順序を確認。`/tmp/onboarding-heading-transition.mp4`。通常Release再ビルド成功・Simulatorへ通常版再インストール済み。認証送信/実機転送なし。

21:56：Block検索欄の説明前gap24→14pt・下padding16→12pt・クリア右16ptへ。原本163への下部配置修正、型検査/通常Release成功、PID60001で確認。メール入力のクリアも確認し検証文字は消去済み。送信/ブロック/実機転送なし。

21:52：Profile編集を原本157へ合わせ、写真枠5pt・Change Photo19pt・名前16pt・クリア右16ptへ。型検査/通常Release成功、PID58675の編集表示確認、`/tmp/profile-input-spacing-final.png`。保存/実機転送なし。

21:49：Settings/Profileのピンクを白下地＋半透明色へ共通化。原本155/157の背景RGBA255,206,221と通常版PID57614の同領域が一致。型検査/通常Release成功、Settings→Profileを目視確認。`/tmp/account-header-pink-final.png`。現在通常版Profile、保存/実機転送なし。

21:45：Settings本人画像左21pt/外径106pt/枠5pt・メール左135ptへ原本155に合わせて修正。型検査/通常Release成功、PID55758で設定表示確認。`/tmp/settings-identity-alignment.png`。通常版Settings、保存/実機転送なし。

21:42：通常版PID52799で他者募集PINの半高/全高/…標準Menu/閉鎖→Mapを確認。本文24pt維持・主催者別枠・空名簿非表示・blur背景が継続。参加/通報/ブロック実行なし。新しいコード修正なし。写真遅延の単体再現は確認済みだが未解消。

21:34：MapChat行をFigma132の約45ptへ（上下4→1.5pt）、角丸アバター/入街円32→35pt、本文まで8→9pt。型検査/通常Release成功。PID52799で最新会話/入街ログの横位置、入力欄との間隔を確認、`/tmp/mapchat-row-spacing-final.png`。通常版Map、投稿/入街状態変更なし。

21:31：ユーザーのウインドウ再表示後、UIKit単体PickerProbe PID50079で初期化229.1ms/表示完了3832.0msを計測。RN/本体画面なしでも同程度の遅延を再現。実機原因まで証明しない。写真選択なし、検証アプリ終了→通常版Home PID51188へ復帰をAX確認。Home招待チケットを原本に合わせ案内14pt/残数12pt・カプセル高さ28ptへ修正、型検査/通常Release成功、`/tmp/home-ticket-type-final.png`で確認。

21:26：写真遅延の独立UIKit検証アプリをexperiments/photo-picker-iosへ追加。ビルド/Simulator起動PID50079、ボタン表示のスクリーンショット確認済み。まだボタン実行/時間比較なし。Device HubがcgWindowNotFoundで操作不能になり、ユーザーにiPhone 18 Proウインドウの表示をasync依頼中。検証アプリは写真を保存/送信しない。本体変更なし。

21:22：写真遅延の対象はPhotosUIServiceでなくPhotoPicker.appex（PID48632）。再表示時も初期化後2.853秒のログ空白、10秒sampleでmain93.3%runloop待機。`/tmp/yumegaoka-photopicker.log` と `.sample.txt`。原因は未確定、次はhost/extension間scene受け渡し。通常版PID48212、写真を選ばず閉じてProfile編集。コード変更なし。

21:18：通知一覧の補助本文を原本152に合わせ14pt/500へ（詳細16pt/600は維持）。型検査/確認版Release成功、PID47613の `/tmp/notices-type-final.png` で照合。通常版Release成功、Simulatorへ上書き・起動済み。

21:14：ProfileSetupの@人物badgeを38→56pt、提供user-fillを74ptで円内クリップ。塗り/線の二重半透明を黒＋全体opacityへ変更し、@の透過を白下地で防止。型検査/確認版Release成功、PID46101で人物の均一な塗りと配置をSimulator確認。通常版Releaseも成功しSimulatorへ上書き・起動済み。写真選択処理は変更なし。

21:04：ProfileSetup photo/poolボタン文字18→22pt、name18pt維持。型検査/確認版Release成功、PID42310で写真ステップ確認。次の差分：@右下人物badgeが原本約55ptに対し現38ptで小さい。通常版復帰ビルド成功、Simulatorへ上書き・起動済み。

20:59：Welcome本人画像を扉左端44ptでクリップし、元動画49.5秒の扉内からの出現へ調整。中央到達1.5275秒、最終位置維持。型検査/通常Release成功。PID40917、`/tmp/welcome-avatar-door.mp4` 2.15/2.7/7.5秒で途中/中央/最終を確認。最新通常版をSimulatorへ反映、実機転送なし。

20:57：招待ゲージを末尾8目盛りの透明度変化へ。PID39248でQR/History/チケット→戻るHome確認。ゴーストエラー文言変更の承認を受け「現在地を取得できません」へ修正、ghost/public回帰成功、通常Release成功、最新版をSimulatorへ反映。実機転送なし。

最新：停止後のdidFailWithErrorが状態を上書きする経路へenabled guard追加、通常Releaseコンパイル成功。抽出した実コールバックの停止/観測/再停止回帰テスト成功、ガード除去で失敗することも確認。OS側の通知タイミング再現は未確認。DerivedDataはこの最新版、SimulatorはPID35609の直前版のまま。ゴースト中の測位失敗文言は承認後20:57に修正済み。20:53に実PIN詳細→編集→人数欄展開→×を確認し、現在SimulatorはMap。保存/削除なし。

20:45：Welcome開閉を60fps走査線で実測しkeyframe調整。原本0.450/保持2.200/閉0.633秒、現通常版PID35609は0.383/2.217/0.617秒。録画 `/tmp/welcome-door-timed.mp4`、解析 `/tmp/measure-welcome-timed.py`。開口0.067秒残差あり、遷移中の初期フレーム影響を含む。型検査/Release成功。通常版、実機転送なし。

20:41：Welcomeの扉/床の方向・幅連動を修正。白矩形ワイプ撤去、右端固定scaleXと45度床投影。型検査/通常Release成功。PID34404、`/tmp/welcome-door-width-ready.mp4` の1.4/2.5秒で細い開口→全幅と人物を確認。全フレームのタイミング一致は未確認。通常版を維持、実機転送なし。

20:27：Welcome人物の遅延出現を元動画49.0/49.25秒へ合わせて分離。型検査/通常Release成功。PID31420、録画 `/tmp/welcome-figure-delay.mp4` で扉のみ→人物/本人画像を確認。当時残っていた扉の開く方向・床の連動は20:41に修正。

20:23：完了画面の最終静止配置を元動画54秒の比率へ調整（画像外径/左寄り中心/枠、本文28pt）。通常版PID29705の /welcome 7秒時点を `/tmp/welcome-final-normal.png` に取得、Home自動遷移も確認。型検査/Release成功。実データ変更なし。

20:20：元動画50/54秒の本人画像を比較し、完了演出の小さい画像を81→約100pt、中心を45pt上へ修正、拡大中に最終位置へ下降。確認版PID27676/録画 `/tmp/welcome-motion-20261120.mp4` で確認。通常Releaseを再ビルドしPID28458でMap起動、DerivedData app.appも通常版へ復帰済み。型検査成功。

20:18：共通部品/証拠の再監査。移行計画の旧「長押し/気配fallback未確認」を現在の…Menu/実描画証拠へ訂正。UI_REVIEW_STATUSに旧画像の適用範囲と未確認の全フレーム/アクセシビリティを明示。表示コード変更なし、再ビルドなし。

20:14：写真一覧の一時非アニメーション版でも3269.9ms。通常3551.6msから約282msしか短縮せず不採用。Swift原本復元、通常版退避から再インストールしPID26147で起動確認。DerivedDataのapp.appは一時比較版なので再利用禁止。通常版は `/tmp/yumegaoka-before-picker-animation-probe.app`。遅延は未解決、同じ比較の再試行不要。

20:10：RollingNumberの10→9で空の十の位が残る中央ずれを修正。通常版PID24823で作成画面12→11→10→9と中央配置、×即破棄を確認。型検査/Release成功。現在Map、データ保存なし。

20:06：Account/City poolの日本語操作行2つをFigmaの標準ウェイトへ修正。型検査/Release成功、通常版PID23385で両画面の表示・往復を確認。現在City pool。写真一覧が開くまでの遅延は未解決。

20:03：共通戻るボタンの図柄のみ36→32pt（可視高さ約19pt）へ。外円/タップ領域維持。通常版PID22488でAccount表示と戻るを確認、型検査/Release成功。現在Settings。

19:59：通知一覧/詳細の保存画像と原本を再照合。通常版起動時の偽「ゴーストに切替」toastを修正（resumeによる状態復元完了まで比較しない）。型検査/Release成功、PID21162の起動〜実Mapで切替toastなしを確認。現在通常版。

19:56：未確認だった気配の画像なし分岐をreview-map?scene=presence（本番StreetMapMarkers＋liveCells）で検証。白い提供人物アイコン3人/白枠/吹き出しをPID19506で確認済み。通常版へ戻しPID20042で実Map表示を確認。確認専用データのAPI送信なし。

19:51：Map募集看板の透明余白による吹き出しとの隙間を補正。通常Release PID18166で実PIN2件の先端と看板の重なり、Home→Map詳細→閉じるを確認。型検査成功。写真遅延は未解決、全29画面の完全一致は未宣言。

19:44：追加計測PID14846。present→次main25.7ms、completion3603.7ms、直後coordinator=nil。内訳未確定。依存ソース復元済み・ログ32557終了。通常版復帰ビルド成功、PID15849で起動済み（計測コードなし）。19:47にHomeから実PINを開き半高→全高を再確認。本文サイズ維持、0人の現地/予定欄非表示、主催者別枠、glass背景を確認。写真遅延は未解決。

19:40：通常版PID13530へ復帰済み。写真起動中の12秒sampleは/tmp/yumegaoka-picker-main-thread.sample.txt。メイン標本の約93%がrunloop待機（前後を含む）、アプリCPU占有の証拠なし。写真未選択で閉じた。次はpresentationの準備待ちと遷移を区別。

19:38：PHPicker対照PID12813もpresent区間3559ms（旧3552ms）で改善せず。初期化のみ24msへ短縮。単純なPicker置換は不採用、切抜き保持。依存ソース復元済み・ログ92614停止。通常版ビルド進行中。次はpresentation/システム遷移待ちの要因確認。

19:35：写真Picker計測版PID11835をSimulatorへ導入。初期化236.7ms、present開始→完了3551.6ms。遅延は主にpresent区間。NSLog付き依存ソースは/tmp/yumegaoka-ImagePickerModule-original.swiftから復元済み（インストールバイナリは計測版のまま）。ログsession23594は停止済み。次は一時的なPHPicker対照で表示時間を比較し、最後に通常版へ復帰する。写真選択/保存は行わない。

19:33：通常版PID10493でChange Photoの写真一覧起動を2回確認。再度でもツール開始1142ms時点は元画面、後続で一覧表示。写真未選択でキャンセル済み。厳密な表示時間・原因の計測は未完。allowsEditing:trueが旧UIImagePickerを選ぶこと、通信/変換は選択後なのはコード確認済み。ネイティブ起動の区間計測が次の切り分け。

最新変更：PIN詳細の本文サイズ固定、空の現地/予定セクション非表示、他者PINヘッダーの「…」標準Menuへ通報/ブロックを移動。型検査/Release成功。19:30にSimulatorで空一覧非表示、拡大時本文維持、同径メニューボタン、標準Menu→ブロック確認→戻るを確認。通報確認→戻るも確認。通常版PID10493へ復帰済み。Home→Map実PIN→拡大→閉じる、実データ0人の現地/予定非表示を確認。旧長押しメニューの通報タップ依頼は置換により終了。

ユーザーは起床し、登録コード下のゲージを再送待ち時間と回答。全29画面と登録動画の差分を自律修正する依頼。意味変更は確認し、独立作業は止めない。細部ごとのiPhone再インストールは不要。現行4tabs・提供SVG・標準Sheet/実UIGlassEffectを維持する。

- 再開：Device Hubの表示取得は復旧。確認版PID98065で長押しメニュー表示とブロック→確認→戻るを検証済み。通報のみAX項目消失/座標入力エラーのため、ユーザーへタップして確認Alertで止めるよう依頼中。現在メニューを表示したまま待機。通常版ビルドsession70600はexit0で完了、未インストール。検証後に反映する。
- 最新：通常PINの通報/ブロックは投稿者画像の標準長押しメニューへ移すと承認。PinAuthorMenuを実装し、確認版PID95354で本文行が消え、画像/本文/作者が表示されることを確認。型検査/Release成功。Device Hub cgWindowNotFoundで実長押しは未確認。現在Simulatorは確認版。通常版バックアップ `/tmp/yumegaoka-final-normal.app` は今回メニュー/気配fallback置換前。
- 直近の合意：未使用QR削除で発行枠返却、登録済みは返却せず相手停止。街ロゴ下は10分観測で消さず入街中全員の匿名Pool画像列を常設。NFCマーカーは表示専用。
- 055/056をローカルとクラウドへ適用済み。055は未使用revokedを枠計算から除外、056は全滞在の匿名画像集約をヘッダーへ追加。地図セルの10分条件/名前/座標非公開は維持。専用DB試験成功。Simulatorで実QR発行/残数/再表示と入街者画像を確認。
- Home/Map/チャット/toast/招待QR/History、PINの標準sheet余白/固定編集、設定/Profile/Pool/通知/Blocks/Account/運営Formを照合・修正。Map背景のPIN半高→全高→半高でglassが維持されることを再確認。
- 登録/ログインを分離し6桁で自動認証、プロフィール画像も必須。元動画のドット書体・扉/人物/影・GIF・こたつ・プロフィール登録・完了演出を修正。実Authの成功前に画面を進めない。確認fixtureは実APIへ送信しない。
- 画面別の到達状況は `frontend-redesign/UI_REVIEW_STATUS.md`。最新画像/録画は `/tmp/yumegaoka-final-figma-20261120/`。UI_REVIEWなしの通常版をSimulatorへ上書き・起動済み（最新PID92780、再送ゲージ・Pool背景・PIN文字サイズ・Block空状態配置修正を含む）。Home招待→戻る→Settings、確認メニュー非表示、Home/Mapのモード表示整合、実PINへのMap移動・詳細開閉を確認。実機は今回追加変更を転送しない。
- 確認版PID89950で半高24pt/全高18ptの切り替えとglass復帰、登録コード最終余白、招待受取素材位置を確認。通常版PID91691へ戻し、Map起動→Settingsと確認メニュー非表示を確認済み。
- 後続の通常版PID92780でBlock空状態の素材上端を原本227ptへ合わせ、説明文との間隔も修正。23-block-empty-final.png。Device Hubのウインドウ取得が一時失敗し、simctlアプリリンク/画像で確認。
- Q-UI01は再送待ち時間と回答済み。緑ゲージを既存の再送可能時刻へ接続。Simulator確認版PID83444でゲージ減少・再送可能・リセットを確認。その他の視覚照合を継続する。全29画面完全一致・実メール/カメラ/NFC/運営MFA/実会員参加の成功は未宣言。
- TypeScript、対象認証/初期設定/QR/ヘッダー14試験成功。Native Simulator Release成功。通常版のMapドラッグを確認。後続のSimulator限定プローブPID87070でNFCマーカーの単一直接タップを2ズーム状態で確認し、カメラ移動/地図イベントとも発生しない。本番と同じ部品だが実クラウド地点の座標ではない。現在地ボタンはSimulatorの位置未取得で標準Alertを表示。既定33タスクと固定残量は変更しない。

前段の証拠：PIN×即破棄、Home＋→Map作成、UISwitch外周上下左右4pt、City Login下から表示/Tokyo/rounded非常口/リング→クラウド成功は `/tmp/yumegaoka-ui-final-20261120/flows.mp4` 等。自己PIN作成/参加通知は054、ローカル/クラウド適用とDB検証済み。過去のPIDや当時の「DB変更なし」は当該段階の履歴。

052（招待残数）はユーザーがローカル・クラウドへの適用を明示承認し、両方へ適用済み。既存の発行上限や利用者データは変更せず、invite_listにremaining/issuer_nameを追加。Homeのチケットに実残数を表示する。051も両方適用済み。

最新は電信PINのクラウド反映/Simulator起動と、iOS Native UI方針の初回監査依頼。確認への回答「電信PINの反映・起動は進める」に従い、Supabase yumegaoka-fieldの旧有効募集/イベント0件を読取確認後049を適用。Renderの36261daがLive（dep-dbvbv3ek1f9s73c3p7kg）。c449960のクラウド接続ReleaseをiPhone 18 Pro/iOS27.0 Simulatorへ導入、ユーザーがログイン済み。未入街のPIN作成、募集/定員変更、位置選択往復を確認。見出し/操作ボタンと本文欄の重なりはScrollView同一座標内への配置で修正し、Simulatorで閉じる→確認、定員展開12→13を確認。保存/参加一巡は未確認。初回監査はコード変更なし。その後実装が承認され、現在はSwiftUI操作部品・PIN重なり修正・SVG素材・QR招待・通知詳細へ着手済み。[IOS_NATIVE_UI_PLAN](frontend-redesign/IOS_NATIVE_UI_PLAN.md)に32 TSXルート/レイアウトの監査と6段階の移行計画。UI実装は承認済み。既存4タブを維持しNativeTabsは採用しない。提供superassets・Figma29画面・動画に沿い標準Sheet/SwiftUIへ移行、既存hooks/API維持。Home/チャット/ベルは既存ユーザー製アイコンを維持、時計/ゴミ箱は新UIに追加しない。招待削除は登録済み招待先の利用停止も伴う。050をローカル/クラウド適用、DB専用データで検証。既存利用者を停止する実操作は行っていない。051の入街回数/名前検索ブロックもユーザーが永続適用を明示承認しローカル/クラウドへ適用済み。既存アカウントも今後の入街から1回目で開始。旧33タスクの達成率と固定残量は変更なし。電信PIN仕様は[DENSHIN_PIN_SPEC](DENSHIN_PIN_SPEC.md)。実機・実Push確認は未完。


## 現在の作業制約（2026-11-05・最新）

[DELIVERY_PLAN](DELIVERY_PLAN.md)が現在の作業台帳。ユーザーは追加4機能の完成、今回の開発データ全初期化、開発用運営アカウント作成、ゴースト適用/iPhone更新、Android対応を許可。旧リセット禁止・iPhone更新停止・iPhoneのみの範囲は今回の指示で置換。コード/素材/文書は保持。自律サイクルで1件ずつ実装・対象確認・commitを行い、外部判断だけ確認する。本番配備は構成点検と費用比較後。既存originへの通常GitHub pushは許可済み。

MR01①〜⑦とMR02〜04推奨仕様は承認済み。月額案を比較する。日本語未確定文字の下線修正も対象。過去の禁止/未着手記録は当時の履歴であり、現在の作業範囲はDELIVERY_PLANを優先。

## 最初に読むこと

この資料は長期チャットなしで再開するための入口。[README](README.md) → 本書 → 作業対象の仕様・コードを読む。11月5日にUI操作改善と整理、期限切れ署名の更新・iPhone再インストールを依頼され、UIコードを更新した。変更・検証はUI_REVIEW_STATUSとTECH_VALIDATIONの11月5日記録を参照。DBリセット・チャット再削除は改めて依頼がない限り行わない。既存originへの通常GitHub pushは許可済み。

監査時のコード基準は `2ab1d9b`（Update mobile UI and architecture docs）。開始時の作業ツリーはclean。今回の監査は進捗資料・仕様と、Router、Mapのプラットフォーム分岐、入街/気配hook、Swift接続、配信スクリプト、入街ログSQLを照合したもの。全コードの再レビューや全機能の再実行ではない。既存試験の証拠と今回確認した事実を区別する。

最新ユーザー指示が優先。過去の「UIは後工程」は、11月2〜3日にユーザーが依頼したUI改修を禁止する意味ではない。ただし未承認の新機能をUIサンプルから推測して追加しない。

## 11月5日の再開作業

地図移動中の本文減光、タブ/マーカーのタップ反応・haptic、Home pull強制再取得、白いOK、DreamCloudヘッダーロゴ、オフライン時のタブ表示を実装。UIプレビューの描画分離とtapアニメーション共通化も実施。型/Lint・対象回帰試験成功。実機操作の合格は未記録。

再インストールは実機ロックと署名アカウント不足を解消後、ユーザー指定のyoxanoaxioアカウントで既存チーム8RHW9L5LBFの署名を更新。Releaseビルド・codesign検証・iPhoneへの上書きインストール成功。profile期限は2026-11-12 09:52:45 JST。初回起動は端末の信頼確認で拒否されたが、ユーザーの信頼確認後にdevicectl起動成功。アプリ削除なし。最新UIの操作合格は別途未確認。API health HTTP200、配信gateway54325は再起動済み。LAN接続先172.30.100.165を継続。

## 11月5日・後続のUI依頼

オフラインの人数badge非表示/ロゴ拡幅、Homeの未参加「街のイベント」追加と専用reload削除、マーカーの接触時hapticを実装。タブ以外の汎用アイコンをicons/yumegaoka-uiから移植し、親項目への接触でも部品アニメーションが始まる。元の素材から生成するscripts/build-mobile-icons.mjs、IconPressable/UIIconで管理。タブ・ブランドロゴ・街固有イラスト・装飾は保持。

ユーザーが指定したローカルiphone-validation@example.testに運営資格を付与済み。MFA要件は維持。型/Lint・Home/接触/オフライン表示の対象試験成功。Releaseビルド・署名検証・上書きインストール成功（/tmp/yumegaoka-icons-20261105-build.log）。iPhoneロックで起動確認は保留、解除を依頼中。新しいUIの操作感/実機描画合格とはまだ扱わない。既定MVP進捗・固定残量は変更なし。

## 直近の起動クラッシュ修正

アイコン移植版3deb629で起動直後SIGABRTを実機再現。SVGのfeBlend mode=overlayがRN native非対応。モバイル生成をscreenへ変換し、全フレームのnative mode検査を追加、修正前失敗/修正後成功。修正版ReleaseをiPhoneへ上書き済み（/tmp/yumegaoka-icon-crash-fix-build.log）。ユーザーのロック解除後、実機consoleで30秒間終了しないことと監視終了後のprocess生存（PID3451）を確認。起動直後クラッシュの解消を確認済み。各画面の外観/操作感は別途未確認。詳細はTECH_VALIDATION。

## 最新のサイズ調整

11月5日のユーザー指摘で汎用アイコンを元サイズの約75%拡大（48pt上限、元から大きい図柄は据置き）へ更新。タブは最新指示で32ptへ戻した。型/Lint/Releaseビルド・署名検証・iPhone上書き成功。最新版の起動確認は端末ロックで未完。外観のユーザー確認は未完。SVGフィルターのクラッシュ修正は維持。

## イベント編集のMap配置（11月5日・最新）

旧LocationPicker Modalを撤去し、開催場所変更から共通Map配置へ遷移、完了後は編集画面へ戻る。eventEditDraftが入力/旧revisionを1往復だけ保持し、pinPlacementが作成/編集の戻り先を区別する。保存までDBは変更しない。セッション変更で両方を破棄。型/Lint/配置とセッション分離試験成功。Releaseビルド・署名検証・iPhone上書き成功。端末ロックで今回の版の起動確認は未完、実機往復も未確認。

## 最新のbadge・夕焼け・素材整理

人数badgeを指定された2組の縦グラデーションへ。Home/アカウントの夕焼けはpull量に応じて伸縮し、通常高さは維持。汎用アイコンは1.75倍/48pt上限、タブ32pt維持。mapAssets.tsは退役し、現役ロゴ/タブはbrandAndTabAssets.ts、汎用アイコンはcomponents/icons/frames.json。素材はassetsのbrand/tabs/backgrounds/illustrationsに整理、旧素材と開始時mapAssetsはdocs/reference/figma-map-legacyに保持。型/Lint/参照と伸縮境界試験成功、実機の見た目は未確認。

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
- 本人プロフィール画像と街pool提供画像は別。日替わり割当は日本時間0時。本人も当日画像を確認可能。画像差替え・退会時に旧画像を撤去し、City poolの単独取り下げUIは11月20日の指定で撤去済み。
- チャット履歴30日。本人の名前/画像を使用し過去投稿も現プロフィールを表示。入街ログは名前付き。
- 募集は有効な滞在が必要、公開地点を確認し作成時位置を固定。20分・手動終了・退出で終了、編集で延長しない。
- イベント定員初期20人/1〜100人。参加者名は主催者と運営のみ。承認制・待機列・当日受付・決済は対象外。利用停止で主催イベント中止・本人の参加登録取消、解除しても復活しない。
- 運営はOTP＋TOTP/MFA必須。投稿制限は終了日時指定、利用停止は解除まで。ステッカー3箇所以上による街範囲、移設後は次の観測で最新範囲を判定し全員強制退出しない。
- 共通操作受付10分、結果最小記録は受付終了後24時間。入街の既存2分期限とは別。保存期限は [RETENTION_ACCEPTANCE](RETENTION_ACCEPTANCE.md) を参照。
- 本番契約・課金・クラウド設定・公開はユーザー判断。既存originへの通常pushは11月5日の指示で許可済み。

## 追加機能と残る確認

ゴースト、投稿時の滞在レベル、ID指定メンション、募集者の当日pool画像は実装・接続済み。メンションは街チャットの投稿者名をタップして指定する。実Pushの端末受信と現地での両端末一巡は別途確認が必要。[作業台帳 C01〜C05・C08・C10](DELIVERY_PLAN.md)

- 同じアカウント・同じ街で、最後に表示した入街ログから10分未満の再入街はログだけを省略する。10分ちょうどで再表示し、入街・人数・滞在時間は通常どおり更新する。クラウドDBに移行047を適用済み。
- **全ページのモック表示**：ユーザー依頼済み。cp175の12状態だけで完成ではない。通常ルート索引の実操作と安全なモックを明示的に分離する。

## UIの現在地・既知の問題・技術的負債

[UI_REVIEW_STATUS](frontend-redesign/UI_REVIEW_STATUS.md) がUI進行の入口。`frontend-redesign/01〜07` は主にcp134の調査スナップショットで、後続変更をすべて表すものではない。現在の経路はRouterとMAP_REDESIGNの後続記録で確認する。

- 地図は暗色、他タブは明色。文字・部材は黒白のalphaを基本にする。SF Roundedを基本とし、街人数・募集作者名等は最新Figma指定に応じた太さを使用。指定画像はrepo内assetsの実体と照合して使用する。
- iOS標準の参加スイッチを維持。入街sheet、3×3の色変化dots、最短3秒演出、成功haptic/自動閉鎖等は後続改修あり。未検証を完成保証としない。
- HomeのPIN詳細もMapへ移動して半分/全画面sheetを開く。地図で見る→Map＋対象詳細、カメラ位置補正を接続。地図選択は既存Mapを使用する。
- 最新チャットのキーボード表示時アンカー、指に追従する拡大、余白の地図操作、透明度/背景グラデーション境界は繰り返し不具合報告があった。コード修正履歴はあるが最新ビルドの一括実機確認は未完。
- ピンの直接ドラッグ、3Dカメラ追従、選択リング、タブ切替/日時入力sheetの重なりも実機で確認する。スクリーンショットの古い不具合を現存と断定しない。
- `useEventDetail` の取得失敗が通信断・削除・終了の区別を曖昧にする箇所は要確認。非通常状態カタログで実表示と復帰操作を確認する。
- [BUG_BACKLOG](BUG_BACKLOG.md) B001/B002は旧外観の記録。Home/カメラの後続改修後の再現性が未確認で、古い画面のまま修正しない。
- レイアウトはhooks/services/nativeから分離する。大規模整理のみを目的にリファクタリングしない。認可/保持期限/再送を見た目変更で弱めない。

## 最新ビルド・ローカル環境

2026-11-05：669b890のUI修正を含むReleaseを同じ成果物パスへビルドし、署名検証・iPhone上書きインストール・信頼確認後の起動成功。profile期限2026-11-12 09:52:45 JST。最新UIの操作一巡は未確認。

前回記録・2026-11-04 cp176：`scripts/ios-validation-release.mjs` による検証用Release成功（0 errors/4 warnings）、main.jsbundle存在、署名検証成功。同じ成果物をロック解除後のiPhoneへインストール・起動成功。**起動成功だけで全UI確認済みではない**。Personal Team、実NFC代用、bundle `jp.yumegaoka.development`、表示名「夢ヶ丘 検証用」。

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

成功済みテスト/ビルドは関連変更・失敗・未解決懸念がある時のみ再実行。検証前に対象不具合と必要な証拠を決める。進捗更新には該当R/T番号、実装と仕様の差、検証/未確認、残項目増減を残す。ローカルcommitで保存し、既存originへの通常pushは許可済み。

## 11月5日 ヘッダー背景の配置回帰修正（R19）

ユーザーの実機画像でAccountの背景が右端/下端まで届かず、名前・タイトルの背景が灰色になる回帰を確認。StretchySunsetの画像直接の百分率指定を廃止し、四辺0の背景専用Animated.View内で画像を全面表示する。親のpaddingと画像の割合寸法を分離。Homeも同じ修正を適用。型/Lint・関連4試験成功。前回の数式試験は実レイアウトの保証ではなかった。今回も実機の外観合格は未確認。アイコンサイズ・タブ・MVP進捗は不変。

## 11月5日 伸縮背景の暗色overlay（R19）

ユーザー指摘の上端で暗色overlayが切れる問題を修正。Home/Accountの固定overlayをStretchySunsetの背景専用Animated.View内へ移し、画像と同じ変換を共有する。既存の濃さ（Home #00000020、Account #00000026）は維持。型/Lint・関連4試験成功（overlayが画像と同じ伸縮枠内にあることを追加確認）。実機外観合格は未確認。MVP進捗不変。

## 11月5日 池袋ロゴ素材差し替え（R19）

ユーザー指定Downloads/assets/ikebukuro.png（224×166）をapps/mobile/assets/brand/ikebukuro.pngへそのままコピー。MapHeaderは既存参照とcontain表示を維持し、新しい縦横比を保持。他のDownloads素材は対象外。実機外観合格は未確認。

## MR01実装の次回再開点

039_ghost_mode.sqlは未適用。Swift/TSの変更はコードのみ。型/Lint・coordinatorの限定試験・Swift構文解析成功。実DB統合/ネイティブ全体ビルド/実機は未実施。利用中DBとiPhoneを変更しない制約を継続。次回導入はmigrationとnative bridgeの両方が必要。MR02以降へは新しいユーザー指示なしで進まない。

## ログアウト後の背景（11月5日）

MR02〜04も進める依頼の直後、ユーザーが待機を指示しログアウト後UIの修正を優先。StreetLoginの夕焼けをStretchySunsetへ統一し、スクロール時に画像と暗色overlayを一緒に伸縮させる。メール入力/確認コード入力の両状態へ適用。iPhoneと利用中DBを更新しない制約は継続。MR02〜04は未着手。

## 現在のiPhone版（11月5日・一回更新許可後）

「一回更新して」によりe0bb1e1＋17b6f4aのStreetLogin修正を上書き済み。ゴースト79234d6は実機未収録・039もDB未適用。開発HEADにはゴースト実装を保持しているため、次回ビルド時に実機との差分へ注意。今回限りの許可であり、以降のiPhone更新は再び明示指示待ち。

11/21 U22継続：PID48655 review-chatで新着追加5→6、画像と本文表示・末尾スクロールを確認。録画/tmp/u22-reveal.mp4は操作前に停止したためアニメーション証拠にしない。AvatarのsessionState購読を追加したコードは最新ビルド未収録、型検査と最終ビルドが必要。U26は最新指示で「位置を確認する」文字/横アイコン1.2倍、ユーザー画像1.3倍に置換。全体1.1倍は取りやめ。現在ユーザーが確認再開を許可済み。

2026-11-22 U49追補（R04〜R09）：実機拒否後、ユーザーが本人アカウントはomyと明示。前回確認したgrantはyumeg用であり対象確認が不足していた。cloudでomyのUUIDを照合し、試験タグ14fd…の既存許可1件をomyへ付け替え。期限2026-11-26 17:08:43 UTCを維持。通常NFC/測位/入街ロジックの変更なし、再ビルド不要。実機からの再試行は未確認。

2026-11-22 U50：iPhone診断版を上書き・起動済み。omyの実測位→observe_visit→outside自動退出を03:03:10 JSTに確認。ユーザー現在地も枠外。枠内の公開気配生成はまだ未確認。Maps40%と地点/境界の表示設定を入街から独立（初期ON/明示OFF保持）を同梱。ローカル診断は座標なしの単一上書きファイル。TECH_VALIDATION U50参照。

2026-11-22：ユーザー指定iPhone SE（第3世代）へ7708446をReleaseビルドしインストール成功。署名検証成功。起動はSecurity（署名/entitlement/端末信頼）で拒否、端末側の開発者App信頼確認待ち。/tmp/yumegaoka-se-build.log。SE画面の実操作は未確認。

2026-11-22：指定iPhone 13へ最新版7708446のアプリを署名更新してReleaseビルド・インストール成功。初回は端末ロックでdestination待機失敗、ユーザー操作後に解消。codesign検証成功。起動はSecurity拒否で端末側信頼確認待ち、実操作未確認。ログ/tmp/yumegaoka-iphone13-build.log。

2026-11-22：ユーザー明示依頼でxio/おらおらへ本人限定現地試験grantを追加。既存omy保持のためfield_trial_grant主キーを(tag_id,account_id)へ変更、guard関数と通常NFC認可は維持。3アカウントのvalid=trueを確認。期限は既存と同じ2026-11-27 02:08 JST。bootstrap SQLも複合主キーへ追従。各端末の入街操作は未確認、再インストール不要。

2026-11-23 U51（R10/R12/R19）：Map尾は文字数補正を維持し全体0.9倍（3文字58.5%、7文字以上90%）。気配42ptアイコンを20pt送り、2人0/4pt・3人5/0/8ptの段差へ。吹き出し下の余白7ptを除去。型検査/Simulator Release成功、/tmp/u51-presence.pngで3人の配置を確認（写真なしfixture）。実機未更新。

2026-11-23 U51実機反映：ユーザーの更新依頼で32425baを本人iPhone17へReleaseビルド・署名検証・上書きインストール成功。起動は端末Lockedで未確認。ログ/tmp/yumegaoka-iphone17-build.log。SE/13は今回未更新。

2026-11-24 U52（R02/R19）：ユーザー提供Frame 741.svgを招待QR中央へ組み込み、元SVGのfill=noneを保持。実招待payload/誤り訂正H/周辺QR生成は維持。原本assets/invite-mark.svgと実行用inviteMark.jsonを一致テスト。Apple Visionで生成QRの正しいpayload復号を確認。表示名を電信出口へ変更（Expo設定・生成native設定）。icons/yumegaoka.icon原本をiOSソースへ複製、Icon Composerの素材/レイヤーを維持。iOSコンパイルで新アイコン出力とCFBundleDisplayName=電信出口を確認。実機未更新。

2026-11-24 U52実機反映：8f6bc2eをiPhone17へReleaseビルド・署名検証・インストール成功。ビルド済みCFBundleDisplayName=電信出口を確認。新Icon Composer素材/招待中央SVGを含む。起動確認は端末Lockedで未完。

2026-11-24 U52アイコン再差替え（R19）：ユーザーが更新したicons/yumegaoka.icon（Exclude.png、背景グラデーション）をassets/iosと生成iOSへ同期。iPhone17 Releaseビルド・署名検証・上書きインストール・起動成功。ホーム画面上の外観は未確認。

2026-11-25：公開規約・ポリシー・サポート／削除案内草案を整備。LEGAL_PUBLICATION_CHECKLISTが公開前残件の入口。年齢申告記録は退会時削除、保護者否認／撤回は関係確認後に停止・削除案内でユーザー確定。氏名・住所は請求時回答で確定。コードや058配備は変更なし。公開サイトは後続の11/25記録を参照。旧33タスクの達成率は据え置き。

2026-11-25：hello.dreamcloud.shをVercelへ公開（sites/dreamcloud-hello）。サイト表記DreamCloud、氏名・住所は請求時回答でユーザー確定。Git自動配備は承認後解除、手動配備。privacy/termsは準備中案内のみ、058へ登録不可。クラウド056まで・清掃5周期成功、バックアップrun45323128200を承認後再実行しsuccess。R2 lifecycle現況は読取資格不足で未確認。詳細PRODUCTION_RETENTION_REVIEW。旧33タスク達成率は据置き。

2026-11-25追補：057を単独でクラウド配備済み。配備済み関数の合成退会ROLLBACK試験成功。R2 daily/の7日削除EnabledをCloudflare UIで確認。058未配備。Auth soft deleteは識別情報が残り、members/複数表/field_trial_grant外部キーが最終削除を阻むため修正設計が必要。通報証拠の退会時原則削除、問い合わせ90日・無料の2判断とRenderログインを質問中。PRODUCTION_RETENTION_REVIEW参照。

2026-11-25：通報退会時原則削除・問い合わせ完了後90日削除・無料をユーザー確定。059をクラウド配備、修正workerを配備専用branch9fa778cへpush。ローカルからクラウドに修正workerを実行して合成Auth/Storage/member/job各0件を確認。058未適用。Renderは11/25 06:04 JSTに9fa778cを手動配備しLive。常時workerによる別の合成アカウント消去と再試行回復を確認済み。Supabase Free・東京、Render Hobby・Oregonも確認。正文2026-11-25-v1を正式公開済み。一般公開前に既存試験利用者にも年齢申告・必要な保護者同意・規約同意を求める方針をユーザー承認。licenses.tsxへ実URLを接続。後続で058/060配備・既存会員同意画面を実装。iPhone Release成功、上書き承認を受けインストール済み。初回起動はLocked。解除後、ユーザーがリンク閲覧・同意保存・通常画面復帰を実機確認。Render gateway f77707b Live。サイトは添付のレイアウトと出口.svg／電信出口icon.svg原本へ差替え。

## 2026-11-25 年齢確認UIとサイトのリンク妨害修正（R03/R19）

ユーザー画像に合わせ、年齢確認を灰色背景・白い角丸の3択・右チェック・規約リンク行・ネイティブ同意スイッチ・横並び青ボタンへ変更。13〜17歳の保護者同意項目、未選択／未同意の進行拒否、保存中無効化、ログアウト・退会導線を保持。小画面はスクロールとボタン折返しに対応。既存の同意記録や版は変更せず再同意を強制しない。型チェック・iPhone Releaseビルド・署名検証・iPhone17上書き成功。新UIの実機外観確認は未完。同意済み本人の記録を消して再表示させる操作はしていない。

サイトのSVG透明領域がフッター操作を遮る不具合に対し、exit画像pointer-events:none/z-index:0、footerをposition:relative/z-index:2へ変更。Vercel dpl_ghorn1YjE9ydPzDANwPdh8CU2MDP公開済み。ブラウザでcomputed styleと運営者情報・プライバシー・問い合わせ3リンクのクリック遷移を確認。SVG原本と配置は維持。旧33件達成率は不変。

## 2026-11-25 同意UIの非保存プレビュー（R03/R19）

ユーザー依頼により、現地確認ビルドの設定→データと謝辞・利用規約とプライバシー→年齢確認画面をプレビューを追加。consent-previewはEXPO_PUBLIC_FIELD_TRIAL=1のときだけ開け、通常提出版ではホームへ戻す。同じRegistrationDeclarationFormを使い、年齢／スイッチは画面内stateのみ。保存と退会のcallbackは説明Alertのみ、ログアウトは閉じるへ置換。registration_policyの読取のみで、consent_accept／退会APIや同意記録の変更なし。通常の同意強制・サーバー認可は不変。型チェック・iPhone Releaseビルド・署名検証・iPhone17上書き成功。端末でのプレビュー表示確認は未完。

サイトのsupport/operator/privacy/termsのヘッダー・フッターをユーザー提供の電信出口ロゴに統一。運営者DreamCloudの本文表記は保持。Vercel dpl_3SSJtwzjCKMM3s5CL9bHumo56psJ公開、問い合わせページのロゴをブラウザ確認。

11/25追加指示：サイト全ページにIntern/Noto Sans JPの可変TTFとOFLライセンスを同梱。欧文→Intern、日本語→Noto Sans JPのfallback。指定のトップ見出しはKHドットを保持。運営者本文のDreamCloudは変更なし。

11/25追加（R19）：本文用Intern/Noto Sans JPに加え、文書見出しにNoto Serif JP 900・横幅72%を適用（参考画像のフォントそのものと断定しない）。Google Fonts公式TTF/OFLを同梱。Apple公式ホームのSVGをassets/apple.svgへ保存し、U+F8FF特殊文字をCSS maskへ置換。本番hello.dreamcloud.shでSVG配信・りんご表示・問い合わせの太い明朝見出しをブラウザ確認。Windows/Android実機での表示は未確認。確認画像は/private/tmp/denshin-apple-svg.jpg、/private/tmp/denshin-support-mincho.jpg。
