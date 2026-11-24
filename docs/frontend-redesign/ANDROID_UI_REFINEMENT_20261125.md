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
