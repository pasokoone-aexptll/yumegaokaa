# yumegaoka

街の気配を感じる第六感。仕様の入口は [docs/README.md](docs/README.md)。

現在はiPhone向けMVP全体を実装中。中核フローを再利用し、画面・募集・イベント・チャット・運営を接続しています。完了状況と未確認事項は [MVP_TASKS](docs/MVP_TASKS.md) が正本です。

## 開発

Node.js 22以降、Xcode、CocoaPods、Docker互換ランタイムを使用。

```sh
npm ci
npm --prefix apps/mobile ci
npm run db:start
npm run setup:local
npm run mobile
```

別のターミナルで `npm run db:maintenance` を起動し、開発中の期限清掃・退会後のAuth/画像清掃・取り下げた街pool画像の物理清掃・通知の疑似配信を継続する。単発確認は `npm run db:maintenance:once`。ローカルAPIだけに接続し、特権キーを端末設定へ渡さない。Macやプロセスを止めた後は再起動が必要。

iPhoneはMacと同じLANに接続。`apps/mobile/.env.local` は公開用キーだけを持ち、Git対象外。クラウド鍵やサービスロール鍵をアプリへ入れない。

```sh
cd apps/mobile
npx expo prebuild --platform ios
npx expo run:ios --device
```

当面のPersonal Team開発は `.env.local` に `YUMEGAOKA_LOCAL_ENTRY=1` と `APPLE_TEAM_ID` を設定し、prebuild後にDebug実機ビルドを使う。NFC権限を除外し、ローカルAPI接続時だけ「開発用タグで入街」ボタンを表示する。その先のDB・気配・退出は本物の処理。NFC付き実機ビルドはADP加入後に確認する。開発中の設定・署名条件は [実装進捗](docs/IMPLEMENTATION_PROGRESS.md) を参照。

メールOTPはローカルMailpit（http://127.0.0.1:54324）で確認。最初にコード送信した後、次のコマンドでローカル利用資格を登録する。本番の招待運用を代用するものではない。

```sh
npm run local:invite -- tester@example.test
```

`supabase/seed.sql` は池袋の架空の開発用範囲・タグを生成する。設置済みステッカーや実際の街の範囲ではない。現在の仮範囲は池袋なので、範囲外で試すと気配は作られず、街外確認で退出する。現地試験前に試験場所に合う公開範囲を準備する。開発ビルドのアカウント画面から空のテスト用NFCタグへ書き込める。既存データのあるタグは上書きしない。運営画面の書込→再読取→設置確認→公開と交換処理はローカルDBへ接続済み。Personal Teamでは物理NFC部分を代用するため、実タグの成功とは扱わない。

## 確認

```sh
npm run test:db
node --test tests/presence.test.mjs
node scripts/http-smoke.mjs
node scripts/otp-smoke.mjs
npm run typecheck
npm --prefix apps/mobile run lint
npm run test:native
npm run test:lifecycle-http
```

DB試験はローカルSupabase専用。`supabase db reset` はローカルデータを初期化するため、手動確認中のデータが必要な場合は実行しない。

## Gitで変更を見る

ソース・仕様書・テスト・migrationをローカルGitで管理します。環境変数、秘密鍵、node_modules、生成したiOSプロジェクト、ビルド・試験ログは対象外です。リモートへの公開はまだ行っていません。

```sh
git log --oneline --decorate
git show --stat HEAD
git diff
```

最初のコミットは監査後の開発途中のスナップショットです。全機能完成を意味しません。以降は機能・修正単位で差分を記録します。

通知ワーカーはローカルの疑似配信のみ。`simulated_at`へ記録し、実Pushの`delivered_at`は変更しない。実APNs接続はADP/配信設定後の別タスク。通知本文・位置・参加者一覧をワーカーログへ出さない。

## ライセンス

夢ヶ丘の独自コードはMIT Licenseです。独自ロゴ・素材は権利を留保し、第三者の著作物にはそれぞれの条件が適用されます。[全文と適用範囲](./LICENSE)
