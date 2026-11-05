# Yumegaoka 汎用UIアイコン（レビュー用）

2026-11-05。22用途 / 22静的SVG。アプリ未統合。

[24px・28px一覧](preview.png) / [実寸HTML](preview.html) / [SVGフォルダ](svg/) / [機械可読対応表](manifest.json)

## 対応表

| # | 用途 | SVG | 判断 |
| --- | --- | --- | --- |
| 1 | 戻る | [chevron-left.svg](svg/chevron-left.svg) | 指定された意味に対応する独立図柄。 |
| 2 | 次へ | [chevron-right.svg](svg/chevron-right.svg) | 指定された意味に対応する独立図柄。 |
| 3 | 再読み込み | [refresh.svg](svg/refresh.svg) | 指定された意味に対応する独立図柄。 |
| 4 | カレンダー | [calendar.svg](svg/calendar.svg) | 指定された意味に対応する独立図柄。 |
| 5 | 地図上の場所 | [map-pin.svg](svg/map-pin.svg) | 汎用の場所表示。CreatePIN・Navi・アプリ固有の募集ピンとは別。 |
| 6 | 人数・グループ | [users.svg](svg/users.svg) | 複数人物で人数を示す。単独プロフィールと区別。 |
| 7 | 人物・プロフィール | [user.svg](svg/user.svg) | 指定された意味に対応する独立図柄。 |
| 8 | 人物追加 | [user-plus.svg](svg/user-plus.svg) | 人物に追加記号を付け、プロフィールと区別。 |
| 9 | 編集 | [pencil.svg](svg/pencil.svg) | 指定された意味に対応する独立図柄。 |
| 10 | 通報・報告 | [flag.svg](svg/flag.svg) | 指定された意味に対応する独立図柄。 |
| 11 | 写真・ギャラリー | [image.svg](svg/image.svg) | 指定された意味に対応する独立図柄。 |
| 12 | 通知 | [bell.svg](svg/bell.svg) | 指定された意味に対応する独立図柄。 |
| 13 | ブロック・制限 | [hand.svg](svg/hand.svg) | 指定された意味に対応する独立図柄。 |
| 14 | アカウント保護 | [shield-check.svg](svg/shield-check.svg) | 指定された意味に対応する独立図柄。 |
| 15 | 接続状態 | [wifi.svg](svg/wifi.svg) | 指定された意味に対応する独立図柄。 |
| 16 | ツール・運営機能 | [wrench.svg](svg/wrench.svg) | 指定された意味に対応する独立図柄。 |
| 17 | 時刻 | [clock.svg](svg/clock.svg) | 指定された意味に対応する独立図柄。 |
| 18 | 確定 | [check.svg](svg/check.svg) | 確定する操作。選択状態用の円を付けない。 |
| 19 | 選択済み | [circle-check.svg](svg/circle-check.svg) | 選択済み状態。未選択のcircleと外形を揃える。円は意味の一部で、ボタン背景ではない。 |
| 20 | 未選択 | [circle.svg](svg/circle.svg) | 未選択状態。circle-checkと同寸法。 |
| 21 | 閉じる・解除 | [x.svg](svg/x.svg) | 指定された意味に対応する独立図柄。 |
| 22 | 削除 | [trash.svg](svg/trash.svg) | 指定された意味に対応する独立図柄。 |

## 作成範囲と判断

未作成・統合した用途はなし。22用途それぞれを納品。タブ8個、DreamCloud、街・気配・NFC固有図柄、CreatePIN、Navi、到着プラグ、気配の星印は対象外。

冒頭の「静的とアニメーション両方」に対し、後段の具体的なモバイル条件「静止SVG」「不要なホバーアニメーションは作らない」を優先した。新規22種には動きを実装していない。検査画像のhover行でも同じ形を保つ。

元66種の立体的な多階調表現と、今回の単色・背景なし指定は一致しない。今回の明示条件を優先し、立体レイヤー・陰影・グラデーション・背景プレートは省略。共通座標・中心位置・丸み・線端・図柄の密度を参考にした単色UI版であり、元66種と同一の立体スタイルを再現したとは扱わない。

全SVGは24×24、viewBox="0 -3 31 31"。線幅は座標系上2.2（24px時約1.70px、28px時約1.99px）、手のみ縮尺を相殺する線幅を設定。currentColorで単色再着色可能。背景、文字、OSアイコン、外部参照、スクリプト、SVGアニメーション、フィルターなし。将来React Nativeで読む際はSVG対応の描画部品からcolorを渡す。iOS/Android実機での表示は未検証。

## エンジンと再生成

元リポジトリは変更せず、作業用コピーに定義を追加。src/engine.js、scripts/check.mjs、scripts/export.mjsは元と同一。src/icons.jsには参照用66種と新規22種、ギャラリーは88種（列数2/4/11）。参照66種は比較用で、納品SVGには含めない。コピー元の著作権表記とLICENSEを保持。

```sh
node icons/yumegaoka-ui/scripts/build.mjs
node icons/yumegaoka-ui/scripts/check.mjs --only chevron-left,chevron-right,refresh,calendar,map-pin,users,user,user-plus,pencil,flag,image,bell,hand,shield-check,wifi,wrench,clock,check,circle-check,circle,x,trash --with 日历,时钟,用户 --out icons/yumegaoka-ui/check-out
```

既存export.mjsの黒色パレット・restで描画後、未使用のdefsのみを削除。新規図形の色はパレットの派生色を使わずcurrentColorを使用。ブラウザの通常の文字色を継承する。preview.htmlでは黒・白・青を確認できる。

## 検証記録

- scripts/check.mjs: exit 0、No script errors。rest/hover/frames/24px/28px/全7パレット画像を生成。
- rest、size-24、size-28、palettesを目視確認。参照のカレンダー・時計・人物と並べて外形サイズを比較。新規セット内の線幅、欠け、識別性を確認。
- 納品SVGを直接埋め込んだpreview.pngで22種・24px/28px・白/青の再着色を目視確認。checkのパレット操作は新規currentColorには作用しないため、色確認はこの別プレビューで実施。
- build.mjsで22 SVGのcurrentColor使用と、外部参照・文字・スクリプト・フィルター等がないことを検査。
- 関連R19（画面）、R02（将来の端末互換性）。今回は素材レビューのみで、機能仕様・アプリコードの変更なし。React Native組込み、iOS/Android実機、最終UI承認は未確認。
- MVP33タスク・DONE・残量は変更なし。この素材の完成をアプリ統合・実機合格へ加算しない。
