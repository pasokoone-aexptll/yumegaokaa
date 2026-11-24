# DreamCloud 公開サイト

公開先：https://hello.dreamcloud.sh

ビルド不要の静的HTML/CSS。public/だけを配備する。アプリの環境変数、DB資格、内部資料は含めない。独自の解析タグ・フォーム・Cookie・外部フォントは追加していない。ホスティング側のアクセス記録は別途確認対象。

## 手動配備

このディレクトリで実行する（リポジトリルートから配備しない）。Git連携はユーザー承認で解除済み。

```sh
npx vercel@66.6.0 link --project dreamcloud-hello --scope gochisoukengai-3762s-projects
npx vercel@66.6.0 deploy --prod --scope gochisoukengai-3762s-projects
```

.vercel/はGit対象外。既存プロジェクトにリンクし、新しい同名プロジェクトを作らない。

## 内容と公開の境界

トップ、問い合わせ・削除依頼、運営者情報を掲載。privacy/termsは2026-11-25-v1を正式に先行公開済み。docs/TERMS_OF_SERVICE_DRAFT.mdとPRIVACY_POLICY_DRAFT.mdはファイル名を維持した正文の控え。既存試験利用者を含む同意取得は別工程で、掲載を同意取得と扱わない。

Cloudflareのhello CNAMEは82672453f5fbb748.vercel-dns-017.com、DNS only。MX等メール関連は変更しない。

## 2026-11-25 添付デザインへの差替え

トップは添付PC／iPhoneデザインを参照。public/assets/exit.svgとwordmark.svgはユーザー提供の出口.svg／電信出口icon.svg原本をそのままコピー。KHドットフォントのOFLを同梱。ストアURL未発行のためボタンは無効で公開準備中と表示。実URL取得後にリンクへ変更する。法務ページのURL・本文は維持。最終Vercel配備 dpl_3u1w8LEmPMCwN5TCFnYVep1Pt45m。

本文フォントはInternとNoto Sans JPの可変TTFをassetsへ同梱し、fonts.cssを全ページで読込。OFL著作権表示も同梱。トップの指定見出しのみKHドットを保持。support/operator/privacy/termsのヘッダーとフッターも電信出口ロゴ。

見出しはGoogle Fonts公式のNoto Serif JP（wght 900、横幅72%）をOFLと同梱。https://github.com/google/fonts/tree/main/ofl/notoserifjp 。Appleマークは2026-11-25取得のhttps://www.apple.com/公式ナビゲーション内SVGを無改変で保存しCSS maskで白く表示。Apple専用文字U+F8FFは使用しない。
