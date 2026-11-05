# Yumegaoka — 26用途のUIアイコン

2026-11-05。レビュー用アイコンプロジェクト。2026-11-05にモバイルの汎用UIへ移植（下記参照）。

[動くギャラリー](index.html) / [24px・28px一覧](preview.html) / [一覧PNG](preview.png) / [静的SVG](svg/)

26用途すべてを作成。内訳は新規定義17種、既存Kubai定義の再利用9種。新しい別案を増やさず、意味が一致する既存図柄はそのまま利用した。ソースには既存66定義＋今回の26登録を保持し、ギャラリーには納品26種と比較用4種（フォルダ・メール・ダウンロード・時計）を表示する。静的SVGは納品26種のみ。

## 対応表

| # | 用途 | SVGファイル | 動き | 再利用・用途の判断 |
| --- | --- | --- | --- | --- |
| 1 | 戻る | [chevron-left.svg](svg/chevron-left.svg) | 左向きの立体シェブロンが左にスライド | 指定された用途の独立図柄。 |
| 2 | 次へ | [chevron-right.svg](svg/chevron-right.svg) | 右向きの立体シェブロンが右にスライド | 指定された用途の独立図柄。 |
| 3 | 再読み込み | [refresh.svg](svg/refresh.svg) | ダイヤルの矢印が時計回りに半回転 | 指定された用途の独立図柄。 |
| 4 | カレンダー | [calendar.svg](svg/calendar.svg) | 紙のカレンダーが翌日にめくれる | 既存「日历」を再利用。指定された用途の独立図柄。 |
| 5 | 地図上の場所 | [map-pin.svg](svg/map-pin.svg) | 場所ピンが持ち上がる | 既存「定位」を再利用。場所表示。作成操作の画鋲とは別。 |
| 6 | 人数・グループ | [users.svg](svg/users.svg) | 二人の人物模型が左右に開く | 複数人を表し、単独プロフィールと区別。 |
| 7 | 人物・プロフィール | [user.svg](svg/user.svg) | 人物が顔を上げる | 既存「用户」を再利用。指定された用途の独立図柄。 |
| 8 | 人物追加 | [user-plus.svg](svg/user-plus.svg) | 人物追加の＋部品が押し込まれる | 人物に追加記号を付ける。 |
| 9 | 編集 | [pencil.svg](svg/pencil.svg) | 鉛筆が線を書く | 既存「编辑」を再利用。指定された用途の独立図柄。 |
| 10 | 通報・報告 | [flag.svg](svg/flag.svg) | 旗の布が風ではためく | 指定された用途の独立図柄。 |
| 11 | 写真・ギャラリー | [image.svg](svg/image.svg) | 写真を扇状に開く | 既存「照片」を再利用。指定された用途の独立図柄。 |
| 12 | 通知 | [bell.svg](svg/bell.svg) | ベルが揺れ、舌が遅れて動く | 既存「通知」を再利用。指定された用途の独立図柄。 |
| 13 | ブロック・制限 | [hand.svg](svg/hand.svg) | 手のひらをこちらに向けて制止する | 指定された用途の独立図柄。 |
| 14 | アカウント保護 | [shield-check.svg](svg/shield-check.svg) | 盾が手前に出る | 既存「盾牌」を再利用。指定された用途の独立図柄。 |
| 15 | 接続状態 | [wifi.svg](svg/wifi.svg) | 電波の弧が外側へ広がる | 指定された用途の独立図柄。 |
| 16 | ツール・運営機能 | [wrench.svg](svg/wrench.svg) | レンチを回す | 指定された用途の独立図柄。 |
| 17 | 時刻 | [clock.svg](svg/clock.svg) | 時計が25分進む | 既存「时钟」を再利用。指定された用途の独立図柄。 |
| 18 | 確定 | [check.svg](svg/check.svg) | チェック形の立体部品を押す | 確定操作。円を付けず選択状態と区別。 |
| 19 | 選択済み | [circle-check.svg](svg/circle-check.svg) | 選択円内のチェックを押す | 選択済み。circleと同じ外形・色で対にする。 |
| 20 | 未選択 | [circle.svg](svg/circle.svg) | 空の円形部品を押す | 未選択。circle-checkからチェックだけを除いた状態。 |
| 21 | 閉じる・解除 | [x.svg](svg/x.svg) | X形の立体部品を押す | 指定された用途の独立図柄。 |
| 22 | 削除 | [trash.svg](svg/trash.svg) | ごみ箱の蓋が開く | 既存「回收站」を再利用。指定された用途の独立図柄。 |
| 23 | CreatePIN | [create-pin.svg](svg/create-pin.svg) | 画鋲を押し込む | 作成操作。既存CreatePINの画鋲という意味を保持。 |
| 24 | Navi | [navi.svg](svg/navi.svg) | 方向針が揺れて元の方向に収束 | 既存Naviの方向矢印を保持。 |
| 25 | 到着 | [arrival-plug.svg](svg/arrival-plug.svg) | 二極端子が接続先へ差し込まれる | 既存plugの二極プラグを保持。NFC固有図柄とは別。 |
| 26 | 気配 | [presence-star.svg](svg/presence-star.svg) | 四尖の星が輝きながら四分の一回転 | 現行画面の✦を四尖のSVG図形にする。五芒星のお気に入りと区別。 |

## レビュー方法

index.htmlをブラウザで開くと、各図柄へのポインター移動・キーボードフォーカスで動く。タッチではタップで状態を切り替えられる。上部の色パレットで7配色を比較でき、デモスイッチで一巡できる。OSで動きを減らす設定が有効な場合は終点へ直接切り替わる。

静的版は「彩色」パレットの静止状態を24pxで書き出した。色は書き出し時に確定済みで、前回取り消したcurrentColorの単色セットではない。納品SVGとアニメーションの図柄は同じ定義から生成される。SVGは影の余白を含む正方形キャンバス、ギャラリーは元エンジンのキャンバスなので、同じCSS幅でも見かけの余白に差がある。preview.html/PNGは実際の納品SVGを24pxと28pxで表示したもの。

アニメーション版はブラウザ用SVG＋JavaScript。React Native向けには下記のフレーム生成・UIIconで移植済み。静的SVGもグラデーション・マスク・フィルターを含むため、実際のRN/Expo描画環境におけるiOS/Androidの表示一致は統合時に確認する。OSのアイコンAPIは利用しない。カレンダーの日付は元定義と同様に実行日の数字で、納品時は5日。日付文字のフォント差もネイティブ確認対象。

## 検証

- 元のsrc/engine.js、scripts/check.mjs、scripts/export.mjsを変更せず再利用。バイト一致を確認。
- check.mjsは通常配色・黄色指定ともexit 0 / No script errors。
- [静止](review/rest.png)、[終点](review/hover.png)、[途中6フレーム](review/frames.png)、[24px](review/size-24.png)、[28px](review/size-28.png)、[全7パレット](review/palettes.png)、[黄色](review/yellow-rest.png)を確認。
- 画鋲は軸の輪郭を前側部品で覆う順番へ調整。Wi-Fiの弧は隙間を広げた。左右シェブロンと選択円の対はそれぞれ同色に揃えた。
- 静的26 SVGをXML解析し、内部参照の解決、24px寸法、script/style/animate/data属性が残っていないことを確認。
- 実際の納品SVGの24px/28px一覧を明暗背景で目視確認。
- 素材レビュー時はRN未統合。現在は下記の移植を完了し、iOS/Android実機の外観・ユーザーによる意味と最終UIの承認は未確認。ブラウザ検査を実機合格とは扱わない。

未作成・用途統合はなし。タブ8種・DreamCloud・指定26種以外の街/NFC固有図柄には触れていない。素材レビュー時にはアプリを変更せず、今回の移植でも元のkubai-iconsリポジトリは変更していない。関連R19/R02の素材レビューであり、MVP33タスク・DONE・残量の変更なし。

## 再生成

```sh
node icons/yumegaoka-ui/scripts/build.mjs
node icons/yumegaoka-ui/scripts/check.mjs --out icons/yumegaoka-ui/check-out
node icons/yumegaoka-ui/scripts/check.mjs --accent '#F59E0B' --out icons/yumegaoka-ui/check-yellow
```

NodeとChromeが必要。buildはSVGとpreview.htmlを生成する。preview.pngはpreview.htmlのブラウザキャプチャ。動くギャラリーは30セル、列数は3/6/10。

LICENSEとコピー元の著作権表記を保持。この納品はYumegaoka用のプロジェクトであり、元のスキルや既存サンプルを独立したアイコンライブラリとして再配布するものではない。SKILL.md/PROMPT.mdは含めない。

## モバイル移植（2026-11-05）

`node scripts/build-mobile-icons.mjs`（リポジトリroot）で元engine/exportを変更せず13段階×26用途のSVGを生成。`apps/mobile/src/components/icons/frames.json` とLICENSEを同梱し、UIIconが元の部品の変形を再生する。アイコンの親IconPressableがonPressInを伝達するため、隣のテキスト/項目全体も同じ反応を起こす。解析結果をキャッシュし、非操作中はタイマーを回さない。Reduce Motion有効時は静止表示。DetailIconの旧SF SymbolsとMapAssetの汎用SVGをこの表示へ接続済み。タブ・ブランドロゴ・街固有イラスト・装飾は保持。

生成SVGのXML/内部参照/使用要素がreact-native-svgで対応すること、型/Lintを確認。端末の見た目・動きのユーザー確認は未完。ブラウザレビュー時の成功と区別する。

モバイル互換性：react-native-svg 15.16.0 FabricはfeBlendのoverlayを受け取るとabortするため、モバイル生成物のみscreenへ置換。光沢はブラウザ版と完全同一ではない。原本は変更せず形/動きを維持し、tests/mobile-icon-filters.test.mjsで全フレームのmodeをnative対応値と照合する。
