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

トップ、問い合わせ・削除依頼、運営者情報を掲載。privacy/termsは正文未確定のため準備中案内のみ。アプリの同意対象URLとして有効化しない。正文はdocsの草案とLEGAL_PUBLICATION_CHECKLISTを解消してから掲載する。

Cloudflareのhello CNAMEは82672453f5fbb748.vercel-dns-017.com、DNS only。MX等メール関連は変更しない。
