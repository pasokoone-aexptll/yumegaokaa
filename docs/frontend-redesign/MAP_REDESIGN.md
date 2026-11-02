# Map再設計の実装差分と後工程

更新：2026-11-02。R03〜R19/R21。01〜07は45c089e時点の調査記録。本書はその後のユーザー提供Figma（iPhone 17 - 101/102）に基づく変更。実機確認済み・最終UI完成とは扱わない。

## 今回の合意とUI接続

| 部位 | 現在の接続・変更 | 実装場所 |
| --- | --- | --- |
| 池袋ロゴ＋赤い人数 | 提供画像とchecked_in_count。気配数とは別。取得前は—、取得失敗時は最終値に* | MapHeader、(tabs)/index.tsx |
| 参加トグル | 既存の説明→NFC/開発導線、OFF→退出。ゴーストと混同しない | useStreetMap、StreetEntrySheet |
| API雲ロゴ | 表示しない | MapHeader |
| 気配画像列 | 有効な気配の街pool画像、画面幅とアイコン幅から個数計算＋残り人数。0件では列なし | PresenceHeader、presenceHeader |
| 地図上の気配 | 既存区画・人数・割当・失効を維持、吹き出しを「ここにN人の気配」 | StreetMapMarkers |
| イベント | 提供pin.pngへ置換。日時・題名と詳細への遷移を維持 | EventCloudPin、StreetMapMarkers |
| 募集 | 現在の名前・題名・地点・詳細接続を維持。当日pool画像の接続は後工程 | StreetMapMarkers |
| 操作ボタン | ピン作成、現在地へ戻る。位置公開とは別 | (tabs)/index.tsx、MapAsset |
| チャット | 本人画像・名前・日時・本文・長押し操作を維持。本文・名前の領域から始めたドラッグ中だけ拡大、離すと縮小。空白からの地図操作を通す。履歴・閲覧意図はリセットしない | StreetChat、useStreetChat.endHistoryDrag |
| 送信状態 | 最新指示：送信中は本文を薄く仮表示、サーバー確認後は通常濃度。未確認/復元失敗/投稿制限/通信エラーは入力欄上のインライン表示。再取得・結果確認・取消操作を維持。自動Modalなし | useChatComposer、MapFeedback、StreetChat |
| 4タブ | Home／Map＋街チャット／お知らせ／Settings。旧/notificationsリンクは/inboxへ移す | (tabs)/_layout、inbox、NotificationsScreen |
| 角丸 | 新規パネルはfigma-squircle 1.1.0でcornerSmoothing=0.6。円形アイコン・OS標準Switch/AlertはOS描画 | SmoothSurface |

通常画面は添付101、通信エラーダイアログは添付102として解釈（依頼文の画像番号と逆だが内容で対応）。エラーの英語本文はサンプルでありコピーしない。地図は最新指示でiOS=Apple Maps、Android=MapLibreへ分離。MapLibreのOpenFreeMap Dark＋Libertyの3D建物定義（dark-3d.json）はAndroid向けに保持。iOSはreact-native-mapsの標準MapKit provider・dark・showsBuildings・pitch55を使用。詳細な建物/施設の描画はApple提供データに依存。DB/APIは変更しない。

素材はDownloads/assetsの15ファイルをapps/mobile/assets/figma-mapへ複製。SVGはMapAssetから表示。ダイアログの人物素材は未提供。池袋ロゴは追加提供のikebukuro.png（279×177px）へ差替え。人数マークはusericon.svg。人物画像を別素材で捏造しない。

## 後で要件を詰める追加機能（今回実装しない）

| ID | 決定済みの方向 | 残る詳細・影響 |
| --- | --- | --- |
| MR01 ゴースト | チェックイン人数には含む。自身の気配を地図・ヘッダー画像列から消す。退出とは別。募集は終了 | 背景測位・3時間延長・再公開・再起動・通信断・切替競合の仕様とDB/APIが必要。現UIの選択欄は無効。既存トグルOFFの終了処理を流用して偽装しない |
| MR02 滞在時間レベル | 現在の街での滞在時間をチャットで示す | 時間→レベルの尺度、更新、過去発言の表示、退出/ゴースト時、公開範囲を後日決定。経験値や投稿数のレベルではない |
| MR03 メンション | 名前を指定して投稿、青い表示、相手のお知らせ＋Push | 本人IDの解決、名前変更・ブロック・通報・頻度制限・通知payloadの詳細。既存APNsの仕組みと接続するが今回未実装 |
| MR04 募集画像 | 募集者の当日の街pool画像 | 現行募集レスポンスには割当画像なし。API・失効/取り下げ時の扱いを接続するまで本人画像や無関係なpool画像で代用しない |
| MR05 背景地図 | 最新指示でiOS=Apple Maps、Android=MapLibre | PlatformMap.ios.tsxとPlatformMap.tsxを分離。Androidの実ビルドは将来。提供元の本番運用条件はQ10に残す |

追加機能は既存33タスクの固定完了条件へ黙って加えない。MR01〜04の実装工数は詳細未確定につき不明。MR05の表示実装は追加指示で着手済み。現在のUI作業はロジックのDONEや実機確認数を増やさない。

## 検証と未確認

型チェック・Lint・チャットドラッグ終了時の履歴保持を対象検証。ドラッグ終了後の実画面のスクロール位置、SVG素材のネイティブ描画、狭い画面・文字拡大・キーボード・ダイアログとシートの競合は実画面確認が必要。最終Figma一致・実機成功とは記録しない。検証結果はTECH_VALIDATION cp135。

## 追加UI操作（cp137）
- 拡大・縮小と背景ぼかしを240msのアニメーションにする。履歴リセット処理は追加しない。
- 文字のchevronは提供chevron.right.svgへ置換（下向きは90度回転）。
- 地図・ヘッダー・チャット履歴・入力欄周辺・タブ操作でキーボードを閉じる。入力欄自体のタッチは除外する。
- 最新から48pt超離れた場合、または未読新着がある場合に「最新へ」を履歴下部に重ねる。smoothing60%の角丸で、押すとスクロールして最新追従へ戻る。
- 地図元URL：https://tiles.openfreemap.org/styles/dark 、https://tiles.openfreemap.org/styles/liberty 。スタイルの出典/ライセンスはassets/mapsへ保持。元の地図帰属表示は消さない。

## cp138：ドラッグ中の位置維持
拡大時のScrollView自身のリサイズをやめ、最大高さのviewportを下端固定し、親のクリップ領域だけ240msで広げる。同じcontentOffsetなら投稿の画面座標は拡大率に依存しない。scrollToによるドラッグ補正は加えず、ネイティブの指追従を維持。入力部/状態表示の実測高さを除外してviewportを算出。短い履歴は下寄せ。実機の追従感は確認待ち。

cp139：縮小時にも先頭へ到達できるよう、固定viewportと縮小表示窓の高さの差を履歴の上paddingに確保。余白は画面高/利用可能高/入力部の実測から計算し、拡大アニメーション中は変えない。

## cp140：実機スクリーンショットとの外観比較
ユーザーの9:11スクリーンショットをFigma101と比較。青灰色の不透明パネル、背景ぼかし不足、最新への右寄せ、気配0件時の右側操作部の詰まり、文字の濃さ/行間が差分。最新へは左右中央のオーバーレイ。操作面は黒/白alpha＋BlurViewへ変更し、チャットはぼかし＋下端ほど濃い黒グラデーション。文字も白alphaで表現。意味色（人数の赤・参加の緑・素材）は保持。
- SmoothSurfaceのSVG輪郭はsmoothing60%。背景BlurViewはiOS continuous角丸でクリップするためFigmaの60%と完全な数値同一ではない。実画面で境界を確認する必要がある。
- 気配0件でも48ptの列領域を確保（架空画像は置かない）。地図は初期zoom17へ近づける。MapLibreの建物/道路/施設情報はFigma背景と別データであり同一描画を保証しない。
- 指追従の固定viewportと先頭padding、API/実データは変更しない。実機スクショの人数0/退出状態/投稿とFigmaサンプル20人/入街状態/仮投稿の差はデザイン欠落として捏造しない。

## cp141：Apple Maps・端のぼかし・操作サイズ
- Map/LocationPicker/街範囲プレビュー/全マーカーを共通PlatformMapの型へ接続。MetroがiOS専用実装を選ぶ。Android/defaultは既存MapLibreを保持。react-native.config.jsでreact-native-mapsのAndroid自動リンクを無効化し、Google Mapsへ意図せず移行しない。
- iOSの経緯度は[lng,lat]からMapKitのlongitude/latitudeへ変換。カメラのzoomはaltitudeへ変換。初回/詳細地点/現在地の移動を共通flyToへ維持。街範囲Polygonの穴も維持。利用者の現在地レイヤーは自動公開しない。
- progressive blurはcp143で帯分割を廃止。iOSはStreetBackdropのUIVisualEffectView本体に連続alpha画像マスクを適用し地図側0→端側1へ合成する（cp145）。ぼかし半径そのものの連続変更ではない。私有APIは使わない。実機の合成結果/性能は確認待ち。
- cp146で拡大時のMap全面blurを復帰。チャット/入力/ロゴより背面に置き、地図とヘッダーをぼかす。空白タッチを遮断する透明Viewは除去。方眼なし。履歴末尾padding64→4。先頭の画面高由来paddingと固定viewportは維持。
- 右の2ボタンは46×46pt。cp144で両SVGの可視path境界に基づく正方形viewBoxを使い、26ptの表示枠内で図形の中心・サイズを揃える。原本素材は保持。

## cp142：投稿のフェードと非モーダル状態表示
- ChatFadeでチャット上端40ptの透明度を0→1へ変える。背景色を被せるのでなく、投稿/画像そのものにalpha maskを適用する。固定viewport・先頭余白・ドラッグの座標は維持。
- 送信開始時はpendingTextを薄いローカル行へ表示し、入力欄の重複表示は隠す。サーバーのid付き結果を得て初めて通常濃度へ。取得一覧が追いつくまでは確認済みechoを保持し、同じサーバーIDを取得したら置換。本文一致だけで統合しない。
- 確認前の仮表示は「自分・送信中/結果未確認」と区別。通信断で通常濃度へ昇格しない。取消が既に完了していた場合もサーバーIDを扱う。未確定処理の永続化/再送/取消契約は既存commandsを維持。
- 不明な結果の仮表示と、別経路で先に届いた投稿はID確定まで同一と推測しない。確認後はIDで重複を除く。モーダルで受信内容を隠さず、入力欄上で結果確認/取消/再取得を提供。
- 通常の送信・状態通知はAlertを出さない。長押しの削除/ブロック/通報などユーザーが起こした選択メニューは維持する。アプリ全体の全Alertを一律に廃止したものではない。

## cp143：キーボード追従・拡大時のマスク・連続ぼかし
- R13/R14/R21関連。キーボード回避はuseKeyboardOverlapで画面ルートの実測下端とkeyboard screenYの重なりを求める。cp145で事前計測を保持し、非同期再計測を待たず入力欄と履歴をnative-driverのtranslateYでまとめて移動する。タブバー分を二重加算しない。閉じたら重なりを0に戻す。
- ルートの高さは固定したまま計測し、移動後の子ビューを再計測して縮め続けない。キーボードが高い場合は履歴表示高を利用可能領域に収める。
- ChatFadeは拡大中も固定高さ。上端のグラデーションだけをクリップ境界に沿って動かす。下側の白マスク領域を保ち、入力欄・最新へ・透かしは投稿のマスク外へ分離。履歴の先頭余白とスクロール位置は拡大率で変更しない。
- ProgressiveBlurは20帯を単一ぼかし＋連続alphaへ変更。入力面はcp145でiOSのStreetBackdrop（マスクなしsystemMaterialDark）へ変更。背後のcomposerベタ塗りは除去する。
- 型/Lintとキーボード重なり・履歴保持テスト成功。実機のキーボードアニメーション、拡大時の下端、ぼかしの滑らかさは確認待ち。API・DB変更なし。

## cp144：操作アイコンの中央揃え・ロゴの重なり
- Downloads/assetsのCreatePIN.svgとNavi.svgは取り込み済み原本と一致。正方形キャンバス内に非対称な余白があるため、MapAssetのcentered指定時だけpathの境界＋均等余白のviewBoxへ置換。円46pt、SVG枠26pt、図形の最大寸法約20.8ptで共通化。
- DreamCloudロゴはcp148の指示により黒gradient/blurより前、投稿より背面。最新へ操作はzIndex=2。ロゴ原本のfill-opacity=0.24を維持し、親opacity=0.35の二重減衰を除去。
- 操作とデータ接続は変更しない。実機の光学的バランスは確認待ち。

## cp145：実機で残ったキーボード・背景・ぼかし不具合
- 前回の実機報告で未解消を確認。iOSのUIVisualEffectViewは祖先へのmaskが不適合のため、ProgressiveBlur.iosからStreetBackdropを使用。effect.maskへ直接alpha画像を持つUIImageViewを設定し、寸法変更ごとに再設定（cp147でsub-layer依存を除去）。親alphaは1。段階帯/私有フィルターなし。これは連続合成であり、位置ごとのGaussian半径変更ではない。
- 黒gradientと背景blurを拡大するhistoryから分離。キーボード上の利用可能高で制限した画面高55%の背景として固定し、スクロール拡大で伸縮・切断しない。
- 入力欄は同じnative部品のsolidモードを角丸内に置く。投稿マスクや半透明親の内側へぼかしを入れない。ロゴはcp148で背景より前・投稿より背面へ変更。
- キーボードイベント時の非同期measure待ちを除去。事前計測したルート＋初期計測前の画面高/下部safe area/標準タブ高によるfallbackで即座に移動量を決定し、native-driverで入力欄と履歴を同時移動。didShow/didHideでも最終位置を再確認する。
- 根拠：https://developer.apple.com/documentation/uikit/uivisualeffectview/ （祖先maskとalpha制約）。実機での最終的な操作感・ぼかし外観の確認は別途必要。

## cp146：本文からのスクロール・フォーカス背景・入力時の末尾維持
- R15/R19/R21。iOSのChatTouchRegion(surface)はhitTestの結果が内側の明示したChatTouchRegion（名前/本文/履歴取得）を含む場合だけ受理。それ以外はnilを返し、地図へ通す。本文から開始したタッチはUIScrollViewが保持するため、指が枠外へ動いても継続。行全幅や履歴paddingは開始対象にしない。長押しメニューは維持。
- 親Animated/Viewはbox-none。空白を押した後からスクロール無効化する方式ではなく、最初のタッチ対象選定時に振り分ける。Androidの同等native判定は移植時の未検証事項で、現段階で成立を保証しない。
- Map背景のsolid blurをチャットの背面に置き、expandedに合わせてUIKit effectを240msで切替。親alphaを変えずに実装。本文・入力・ロゴは手前。これはMap画面領域（地図・ヘッダー）への効果で、別階層のタブバーは対象外。
- chatGeometryはキーボード高でScrollViewの高さ/paddingを変えない。キーボード高は親の可視範囲の制限と全体移動だけへ反映。ScrollViewの自動content/keyboard insetを無効化し二重回避を避ける。フェード開始位置は可視範囲へ追従。
- テストはviewport/topPadding/末尾offsetがキーボード前後で不変、向き/入力部高さ変更時の再計算、従来の履歴維持・キーボード移動の計4件。実機での地図ピンチ、本文ドラッグ、最新投稿を表示した入力開始は未確認。

## cp147：17:04実機写真とFigma101の寸法・面構成比較
比較基準：実機1206×2622を3で、Figma1608×3496を4で割った共通402×874pt。以下は実装変更であり、変更後の実機外観確認とは区別する。

| 差分 | 修正 |
| --- | --- |
| タブが端へ広がる（実機の先頭中心約50pt、Figma約78pt） | 横paddingを幅の8.5%、タブ高42＋safe area、素材32ptへ。4画面の遷移は維持 |
| 入力面が暗く、送信領域の独立した明るい面がない | SmoothSurfaceへbackdropを追加し、native blur→白alpha面→入力の順に修正。送信幅63pt/白alpha面/黒alpha矢印。入力18pt、ヒント14pt |
| チャット下端が黒すぎる | 黒gradient末尾alpha .78→.46。入力欄自体は白alpha、外側composerはcp148で透明。色つきベタ塗りは追加しない |
| ヘッダー・履歴背後の地図文字が鮮明に残る | 上部blur領域145→190pt。nativeのmaskはUIImageView＋描画済みalpha画像へ、中間alpha .25→.65。UIKitのmask複製でsub-layer treeに依存しない |
| 行のアイコン/横位置/書体 | アイコン34→32pt、gap10→8pt、author14/line18、本文16/line22＋上2pt、行padding7pt |
| 入街ログが通常投稿と同じ本人画像で表示される | 白い接続アイコン＋日時、本文内に本人名。名前や事実は省略しない。「DreamCloudAPI」のデバッグ表現は持ち込まない |
| 公開設定と参加スイッチの寸法 | 公開設定52×32pt、参加面82×46pt、人数icon18×20pt |
| 縮小時の履歴開始位置 | 画面高36%→35%。keyboardで内部viewport/paddingを変えない原則を維持 |

人数0/退出状態と見本20人/参加状態、画像列・募集・イベント・気配の有無、地図の地域、投稿内容はデータ差。架空データを入れて見た目を埋めない。「最新へ」は実際に過去位置を見ている場合だけ表示する既存条件を保持。方眼は削除指示を維持し復帰させない。レベル・メンションは引き続き後工程。

## cp148：入街素材・文字透明度・入力面・参加スイッチ
- ユーザー17:37/17:39画像に対応。ArrivalIconはDownloads/assets/plug.svgをそのまま取り込み、32pt円の背景を白10%（8桁HEXでは丸めて#FFFFFF1A）とする。
- iOSの名前と時刻はSF Rounded（RNのui-rounded）。時刻は白38%、横の名前は白30%・bold、本文は白60%。入街本文中の本人名は白70%で区別する。日本語字形はシステムのフォールバックに従う。
- 入力欄の外側composerの帯は透明。欄自体はnative blur＋白15%の面、角丸16pt/smoothing60%（cp150で再調整）、右の送信面を維持。説明のchevronは素材alphaと親alphaを合わせ約40%とし、説明文字に揃える。
- ロゴは背景より前、チャット本文より背面。投稿・送信状態・スクロール・キーボードのロジックは変更しない。
- ParticipationSwitchはcp149で独自track/thumbアニメーションを撤回。iOS標準Switchを、固定寸法を与えない中央揃えの内側Viewに配置。参加面82×46ptと既存active/onToggleを維持。OS標準の外観と操作感を使う。
- 型/Lint成功。JS/素材のみの変更につきネイティブ再ビルドなし。実機での外観確認は未実施。

## cp149：標準スイッチ復帰・読み込み応答・通知とダイアログ
- ユーザー指摘により独自参加スイッチを撤回し、標準Switchへ復帰。thumb/trackの色指定も外してOS標準描画へ任せる。中央配置の実機外観は未確認。
- 人数はiOS ui-rounded/bold。入力欄の角丸は14ptへ。
- 再読み込みActionとチャットの再読み込みは返却Promiseの間ActivityIndicatorを表示し、二重押下を防ぐ。通常の5秒ポーリングでは新たなspinnerを表示しない。
- Mapの通信エラーは指定dialog background.pngを使ったフェード表示のダイアログへ。OKで閉じても元のエラー/接続状態を成功に変更しない。チャットの未確定送信/再送/投稿制限は従来の操作面を維持し、破壊操作を自動で承認しない。
- 入街・観測の状態通知は画像列の下にMapStatusBannerとして表示。登場220ms、進捗7秒、退場220ms。OKは即時非表示。状態が変われば新しい通知を表示。実際の状態文字列と必要な再入街操作を保持し、画像内のサンプル通知文を架空の状態として表示しない。
- 通知左側は追加提供されたgirl viewing.pngを使用。縦横比を保ち、54×64pt枠でバナー下端へ配置。

## cp150：取得エラーの通知位置とダイアログ寸法
- チャット取得エラーはuseStreetChat.readErrorとして送信エラーと分離。StreetChatから親Mapへ既存reloadとともに通知し、画像列下のMapStatusBannerに表示。取得処理を別hookで二重起動しない。送信未確定・投稿制限等の操作面は変更しない。
- 取得エラーのアクションは再読み込み。Promise待機中はspinnerとdisabledを表示。成功でエラーが消えるとバナーも消える。失敗時は同じ場所で再試行可能。再試行導線を残すため取得エラーはautoDismiss=false、通常状態通知の7秒自動消去は維持。
- 通知OKは14pt・iOS SF Rounded。通信エラーダイアログはカード角丸36pt、ボタン角丸24pt/幅42%/文字16pt SF Roundedへ。ボタン背後にlight BlurView intensity85を置き、画像を透かしてぼかす。入力角丸16pt。
- 型/Lint成功。実機外観とぼかしの最終確認は未実施。JSのみにつき再ビルド不要。

## cp151：標準入街シートと3×3ドット
- 最新の訂正によりドットは9×9ではなく3×3（9個）。Downloads/assetsのDreamCloud monoLogo/monoText/check.svgを取り込む。legacy/yumegaoka/app/src/components/rain-cloud.tsx、features/profile-card.tsxの列別周期とstrokeDashoffsetの演出を参考に、新しいEntryAnimationを分離実装。
- explainは破線円とロゴ、scanning/checkingはロゴと文字が上下へ分かれ、ドットが列別周期・行別遅延で下へ流れる。外周は1200ms周期で回転。successは650msで円周を描き、続く300msでcheck.svgと同じpathを描く。演出から成功や滞在状態を変更しない。成功は既存checkin応答に従う。
- 開発用入街、共有説明、キャンセル、成功後の地図へを保持。スワイプによる閉じ操作も既存closeへ接続。読み取り後に不要な「離さないで」の表示はしない。
- 型/Lint・Debugビルド・iPhone転送成功。最終外観、標準シートのスワイプ操作、Core NFCの実読取は未確認。

## cp152：初期高さ・ロゴ・最低3秒の演出
- cp151のonShow後のdetent変更が上昇後縮小の原因。専用street-entryルートを追加し、既存native-stackの標準formSheetを表示前から57%・一段のdetent/OS標準角丸/標準grabber（cp157で調整）で設定。prepareEntrySheetは呼ばない。旧native関数は互換用に未使用で残す。
- 標準formSheetに白背景とlight BlurViewを組み合わせる。元Mapの背景blurは固定し25/defaultへ弱める。OS別の最終質感は未確認。
- entrySheetStateはMapが所有する状態と既存scan/exitを渡すメモリ接続。戻るtransitionEndで既存close、元状態nullでrouteを閉じる。DB状態は演出側で変更しない。
- 上部ロゴは黒24%の表示用SVGへ。円は全状態共通300pt上限。開発ボタンは重ねて配置し、円の上下移動を避ける。処理中の青い雲はlegacyのdream.png、待機は提供monoLogo、文字はmonoText。二重opacityを除去。
- useEntryPresentationで処理開始から最低3秒のchecking表示を保持。通信・入街処理は遅らせない。失敗/取消/nullは即時反映しタイマー破棄。成功表示には実成功が必要。処理が3秒を超えた場合に追加3秒は待たない。
- 地図へボタンを外し標準シートの下スワイプで閉じる。背景共有の説明は保持。型/Lint・表示タイミング3テスト成功。JS変更なので再ビルドなし。初期高さ・スワイプ・外観は実機未確認。

## cp153：Figma106と22:20実機の比率
- 実機1206×2622、Figma1004×2180を幅比で比較。Figmaの円背景は約76%幅、実機は約70%。EntryAnimationのSVG背景半径156/viewBox320の余白を考慮し、外枠をwidth×0.76/0.975へ。画面高による制限と300pt上限を廃止。
- シートの一律36pt角丸指定を削除。react-native-screensの未指定時のUISheetPresentationControllerAutomaticDimensionを使用し、iPhoneのシステム角丸に任せる。独自の下端クリップや表示後の高さ変更は加えない。
- 初期detent55%→53.5%、下padding18→12pt。円拡大と合わせて下側の空きを減らし、上部ロゴと円・説明の位置を原本へ寄せる。3秒の演出・入街ロジックは維持。
- 作業開始時に既に削除されていた追加の背景共有説明行は変更せず保持。型/Lint確認、実機の最終角丸・高さは未確認。

## cp154：濃さ・固定ドット・成功触覚と自動閉じ
- 円背景の幅比を76%→79%へ拡大、背景#f1f1f1/待機線#dedede/青線#007aff。ロゴ素材の色は維持。状態見出しは#555・weight600、処理中見出し#2875e5。
- ドットのtranslateYを廃止し固定3×3へ。列別周期/行別遅延のopacity 0.2〜1で下へ流れる濃淡を表現。
- チェックのpath順を左端→下の折れ目→右上へ反転。strokeDashoffsetの描画方向を修正。
- 成功表示への切替でUI専用entrySuccessHaptic（UINotificationFeedbackGenerator.success）を呼ぶ。成功表示から3秒で既存closeを呼び標準シートを下へdismiss。手動閉じでタイマー解除、状態がsuccess以外なら閉じない。既存の処理演出最低3秒とは別のタイマー。
- 通常通知は自動消去とOKの両方で220msの下方向18pt＋fade。再読み込みバナーはエラー解消まで維持する既存方針。
- 型/Lint・自動閉じの3テスト成功。触覚追加のためDebugビルド実施。触覚と外観は実機未確認。

## cp155：legacyのドット濃淡へ合わせる
- legacy/rain-cloudの列位相0.08/0.62/0.31、周期1390/1810/1570ms、行位相差0.18を再利用。progress[0,.16,.52,1]→opacity[.15,1,.15,.15]で短い明滅に戻し、sin波の長い明るさによる縦列の同時点灯感を解消する。位置は固定。
- 円背景幅82%、状態見出し17.92pt/補足と開発操作13.44pt（1.12倍）。リング・チェック・ドット・操作/処理中文字の青は#00ADF2。提供されたPNGロゴの色は維持。
- 型/Lintで確認。3秒/触覚/DB/通信の変更なし。JSのみで再ビルドなし。実機の明滅感と拡大後の収まりは未確認。

## cp156：入街シートの高さを拡大
- ユーザー承認により初期detentを53.5%から60%へ拡大。拡大済みの円と1.12倍の説明文字のため縦余白を増やす。表示後の高さ変更はせず、標準角丸・スワイプ・タイマーは維持。実機の最終的な収まりは未確認。

## cp157：57%と透ける白背景
- 初期detent57%。シート下地の白は#FFFFFFEDから#FFFFFF66へ、light blurは維持。円背景は#FFFFFFAA、青い円周/チェックは#00ADF2を維持。
- 処理中ロゴは今回提供のDownloads/assets/DreamCloud.pngへ差替え。原本をそのままコピーし、既存素材は削除しない。待機モノクロと文字素材は維持。
- JS/素材のみ。実機の透け具合は未確認。
