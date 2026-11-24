# Android UI再調整 — 2026-11-25

ユーザー提供画像とicon.svgを基準に、Androidのみ修正。前回移植の機能確認と外観の合格を区別する。今回はユーザーがアイコンの基準をicon.svgと明示確認。R10/R12/R19、旧33タスクの分母/DONE履歴は不変。

| 指摘 | 対応・確認 |
| --- | --- |
| アイコンの比率 | 提供SVGを原本保存し、legacy/adaptive/monochromeを再生成。adaptiveのOS切り抜きによる拡大を補正。ランチャーの図柄/余白を確認 |
| Intern + Noto Sans JP | 公式配布とSIL OFL 1.1を確認。Android nativeでIntern→Notoのfallbackとweightを登録。Androidの自作Text/TextInputに限って適用。iOS/dependency/adapter自身を変換しない3試験成功。Android 24〜28用のOFL派生互換Regular/Boldも同梱。ライセンス画面に全文追加 |
| 地図の吹き出し欠落 | Androidの画像化されたマーカーで動的寸法/MaskedViewへ依存しない、背景View＋固定寸法SVGの尻尾へ変更。背景と尻尾を実表示確認。iOSのマスク/blur輪郭は保持 |
| Homeメニューが左にはみ出す | Home（dark=false）はトリガー左端に合わせて開き、画面端へclamp。地図は右端合わせを維持。Home実表示で確認 |
| プルダウンの色 | トリガー面を黒5%・blurなしの単色へ。展開メニュー本文の可読性は既存暗色面を維持 |
| 全Android sheetの背景・余白・取っ手 | 固定灰青/白いroute下地を除去。MapLibre SurfaceViewをPixelCopyで取得しworkerでblur、白/黒の透過レイヤーで合成。地図読込後に最大2回だけ更新、detach時破棄。移動/展開時は背景座標を追従。PinSheetとDetailUIのmapSheetへ適用。DetailUIは明色レイヤー。取っ手56×4dp/白45%、上端領域16dp。PIN半画面→全画面→半画面を確認。追加指摘でfooter背景自体を撤去し、名簿が背景帯で切れず、ボタンだけが浮く構成へ変更 |
| NFC待機リングの切れ | Androidのみ初期detentを50%へ（追加指摘で65%から圧縮）、100%まで展開可。リングをnative sheet footerへ置き、スクロール領域下端の重なりを回避。下端まで背景とリングが表示されることを確認 |
| ×/戻るボタンの色 | 固定色をやめ、暗面は白14%、明面は白55%。背景のぼかしを透過させる。PIN/入街/Accountの戻るで確認 |
| 人数分母の太さ | HomeとPIN詳細の小さい分母をAndroidのみ800へ。地図の既存900は新フォントで実際のweightを反映 |

## 実表示証拠

すべてAPI35 emulator-5554。ユーザー許可済みADBで操作。実機の外観合格とはしない。

- `/tmp/android-ui25-drawer-small.png`: ランチャーの新アイコン
- `/tmp/android-ui25-menu-small.png`: Homeメニューの左合わせ・フォント
- `/tmp/android-ui25-bubble-small.png`: 地図の吹き出し背景と尻尾
- `/tmp/android-ui25-entry-final2-small.png`: 入街シート全体、リングの切れ解消
- `/tmp/android-ui25-pin-full-final-small.png` / `android-ui25-pin-half-final-small.png`: シート往復、blur/固定ボタン/取っ手/人数
- `/tmp/android-ui25-back-final-small.png`: Accountの白透過の戻るボタン

途中版の取っ手欠落、footerとの背景境界、マーカー背景欠落を検出して追加修正。途中画像を最終合格証拠にしない。

## 検証・制約

型検査、変更対象Lint成功。Android-only Babel変換3試験、既存Android UI/入街完了タイマー5試験成功。Debugビルド・上書き・通常実API画面操作成功。iOS専用ファイル/素材は未変更、iOS向けBabel変換なしを検証。共有ファイルの追加分岐はAndroidのみ有効（SheetSurface/PinSheetFooterのiOS側はpassthrough）。

Android 24〜28は互換フォント生成と分岐のコード確認のみ、端末実表示は未確認。物理Android、各OEMのランチャーマスク、背景測位/NFC/Pushは今回の外観検証には含めない。地図blurは提示時のsnapshotであり、iOS Liquid Glassの光学効果と同一ではない。ソース地図描画と白/黒透過合成という指定を満たす。継続キャプチャや地図rendererの変更は行わない。

フォント出典・ライセンス・ファイルhash・互換版生成手順は`apps/mobile/assets/licenses/ANDROID_FONTS.md`。icon.svg原本は`apps/mobile/assets/android-icon-source.svg`。変換scriptは`scripts/build-android-app-icon.cjs`。既存.env.local/クラウド/iOSビルドは変更しない。

最終arm64 Release成功（/tmp/android-ui25-release.log、2分31秒）。最新Debugは第7版（/tmp/android-ui25-debug7.log）をエミュレーターへ上書き済み。通常Releaseの本番配布は行っていない。

## 3:51〜3:53の追加画像への修正

Android限定（R12/R19）。footerの背景SheetSurfaceが下の名簿を覆うことをユーザー画像で確認。背景を除き透明な固定操作領域に変更。参加する（neutral/onDark）の面は白18%へ。既存の参加済み緑色と操作は維持。入街は初期50%/展開100%、上余白12dp/図の上14dp/間隔10dpへ詰め、固定リングを維持。

API35の実表示で、半画面の主催者アイコン全体と白透過の浮いた参加ボタン、入街本文とリングの収まりを確認。証拠 `/tmp/android-floating-pin-small.png`、`/tmp/android-floating-entry-small.png`。型/対象Lint成功。JSのみの変更で既存Metroへ反映し、native再ビルド・物理Android転送は実施していない。iOS分岐/表示は不変。

## 追加指定：単体動作とMapカプセル（2026-11-25）

ユーザーがUSB/Metro不要のPixelローカル開発者テスト版を指定。ストア提出ではない。Mapの指摘は「カプセル型のボタンになっていない」と確定。Android ModeDropdownの高さ34dpに対する半径を12→17dpへ変更し、黒5%/52×34dp/丸と矢印/開いたメニューの動作を保持。iOS専用実装は変更なし。エミュレーターのMap実表示を撮影（/tmp/android-capsule.png）、対象Lint成功。

JS同梱・既存debug署名のassembleReleaseを試みたが、PreToolUseのApp Store Compliance Guardが審査項目未確認を理由に拒否。通常クラウド/レビュー無効のローカル端末用APKを予定。フックはプロセス環境のみからAPP_STORE_GUARD_OKを読むため、コマンド内の指定は届かない。ユーザーがSettings→Hooksで一時停止したと回答後、正式なassembleReleaseを実行。JS同梱のローカルテストAPKをビルド成功し、Pixelへデータ保持で上書き成功。ストアへのアップロードはしていない。

Homeのゴースト丸はAndroid/lightだけ黒55%へ変更（以前は#9a9a9e）。Map/darkは維持。`scripts/build-android-local-test.sh` を追加し、通常クラウド/レビュー・FIELD_TRIAL・ローカル入街代替を無効にしたJS同梱APKを再現可能にした。最終ビルド16秒で成功。APKのassets/index.android.bundleは5,217,108 bytes、クラウドAPI/Gatewayを内包。PixelのADB reverse一覧を空にしてforce-stop→MainActivity起動し、保持されたアカウントのプロフィール写真設定画面まで表示を確認（05:03）。USB/Metroは不要、通信機能にはネット接続が必要。型/対象Lint成功。

「ログイン場所・街の範囲」について：エミュレーターの実DBではplacements=0、境界は経度139.70〜139.72・緯度35.725〜35.738で、拡大時の画面外。review-map controlsに本番のEntryPlacesを使った小さな境界を追加し、メニューONで範囲・NFCマーカーが表示され、OFFでは出ないことを撮影確認。以前のreview controlsはplacesVisibleを描画条件に使っていなかったため修正した。本番の表示不具合を修正済みとは扱わず、発生端末のユーザー回答待ち。クラウドに架空の場所は追加していない。

## 実機写真 IMG_1711 / IMG_1712 に基づく再修正（2026-11-25 05:35）

R03/R04/R10〜R14/R19。ユーザーの写真と原本133を比較し、前回の半径変更だけではMapの輪郭が見えないこと、NFC地点のexpo-blurがAndroidのbitmap annotation内で背景をぼかしていないこと、Homeに別の雲画像が表示されていることを確認。

- カプセル：Androidのトリガーを52×34dp・borderRadius17のViewへ変更。指定の黒5%を維持し、暗いMapだけ白20%の細い輪郭を付けた。Homeは輪郭なし。PixelのMapで表示確認。
- NFC地点：Androidのpassive markerだけMapLibreの実View Markerへ移行。Map読み込み完了後とカメラ停止後に座標を投影し、その地点のSurfaceView領域をPixelCopy→既存blurMapでぼかすMarkerBackdropを追加。背景は実地図＋黒/白opacity。bitmap annotationのrefreshではviewToBitmap nullが起きるため実Viewへ切り替えた。最終版でNFC内部の線路がぼけ、パン後にも背景更新することをエミュレーターで撮影確認。API24/25は全Surface取得後に対象範囲を切り出す互換処理（物理旧OS未確認）。iOSは従来BlurViewのまま。
- Home雲：DreamCloud.pngとDreamCloud背景.pngがAndroidの資源名assets_superassets_dreamcloudに衝突し、濃い通常ロゴが選ばれていた。Android専用のASCII名home-cloud-background.pngを追加（背景原本とバイト一致）、HomeのAndroid参照だけ差替え。背景原本はalpha最大43/255で薄さが既に入っているためopacity1を維持。位置top=width×1.07/right=-4/size=width×.62は正しい画像で原本133と照合して維持。Pixelでも雲の薄さ・位置・右側の切れ方を確認。

型検査・対象Lint成功。Debug成功後に実表示修正を反復し、最終ローカルテストassembleRelease成功（/tmp/android-photo-fixes-release.log、1分20秒）。JS同梱5,219,652 bytes。生成Android背景資源が原本PNGとバイト一致することを確認。Pixelへデータ保持で上書き成功、HomeとMapを実表示確認。ストア提出なし、USB/Metro不要を維持。NFC実スキャンは今回検証していない。

比較証拠： [Homeと原本133](evidence/android-20261125/home-cloud-final-pair.png)、[Mapカプセル](evidence/android-20261125/map-capsule-final-crop.png)、[NFC地点の背景ぼかし](evidence/android-20261125/nfc-live-marker-crop.png)、[パン後](evidence/android-20261125/nfc-after-pan-small.png)。

## IMG_1714/1715：シート・吹き出し・モード・チャット（2026-11-25 05:47）

R03/R04/R10〜R14/R19。Androidの×/チェックを28dp領域の独立した線画へ変更し、3dpの丸い線端/接合で小さな元SVGの密集を避けた。ボタンと作成ヘッダー操作列の縮小を抑止。未保存の作成画面で表示を確認し閉じた。

PinBubbleは半透明カプセル＋別三角（marginTop=-1）を廃止し、iOSと同じ一続きの輪郭を一度だけ白90%で塗る。AndroidのPIN/旧募集マーカーは更新可能な実Viewに切替え、SVGのlayout確定前の画像化による背景欠落を防ぐ。PINタップ→詳細シートを確認。

通常モードの丸はactiveに依存せず緑、ghostだけ灰色に変更。トリガー幅52→60dp（左右各4dp増）・高さ34dp維持。回帰テストで参加/未参加の両方を確認。Pixelの灰色表示はメニューでもゴーストにチェックがあることを読み取り確認し、ユーザー設定は変更していない。

チャットはAndroidの暗色gradientを下45%→60%へ拡張。HistoryBlurで地図Surfaceだけを取得してぼかし、画面40%で透明、70%で25%、下端100%の連続マスクを掛ける。カメラ停止で更新し、拡大チャットは従来の全画面ぼかし。iOS固有実装/gradientは変更なし。初期試験でbottomという標準Viewプロパティ名と衝突したためfadeBottomへ修正し、上側の地図を保持することを再撮影確認。

型検査成功、変更対象Lint成功（StreetChat.tsxのみ既存react-hooks/refsの4エラー。HEADの同ファイルを別名で検査し同じ4件であることを確認、新規増加なし）。Android UI/字体の6試験成功。Debug成功、最終JS同梱ローカルRelease成功（1分28秒、/tmp/android-sheet-chat-release.log、JS 5,220,456 bytes）。Pixelへデータ保持で上書き成功、通常Map/チャット/モードメニューの表示を確認。USB不要、ストア提出なし。

証拠：[シートアイコン](evidence/android-20261125/sheet-icons-final-small.png)、[一体吹き出し・通常モード緑・広いchat背景](evidence/android-20261125/bubble-single-final-small.png)。
