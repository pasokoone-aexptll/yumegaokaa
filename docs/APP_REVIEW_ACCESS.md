# 電信出口のApp Reviewアクセス

2026-11-25。審査用サーバー・アカウント・iOS入口を配備／実装。開発署名版をiPhone 17にインストールし、本人が審査ログイン・同意・入街を実機確認。最終配布ビルドでの確認はADP加入後に行う。

## App Store Connectの審査メモ案

電信出口は、日本の街のNFCステッカーを使って入街し、街のチャットや電信PINで交流する招待制アプリです。日本の現地に行かずにご確認いただけるよう、架空のデータだけを使う審査環境をご用意しています。

1. 初回画面の「App Review ログイン」をタップし、審査情報欄のメールアドレスとパスワードを入力してください。
2. 年齢の確認が表示された場合は年齢区分を選び、規約・プライバシーポリシーをご確認ください。審査環境でも同意が必要です。
3. 地図の入街操作を開き、「審査用入口」のリングをタップしてください。NFCと位置観測は架空の入口・区画を使用します。入街後は電信PINを開いて参加し、街のチャットや通報・ブロックをお試しいただけます。
4. 退出は入街中の画面から行えます。設定から退会する場合は、審査用パスワードをもう一度入力してください。退会したアカウントは利用できなくなります。再確認用の予備アカウントも用意しています。

通常利用者はメールOTPと招待で登録します。実際の入街には対象の街・設置済みタグと端末位置情報が必要です。審査環境から一般利用者への通知は送信されません。

## Notes for Review（提出用英語案）

1. On the first screen, tap **App Review ログイン**. Enter the email address and password provided in the Sign-In Information fields. No email code or invitation is required for this account.
2. If **年齢の確認** appears, select your age range and review the terms and privacy policy to continue.
3. Open the street entry screen from the map. Tap the ring labeled **審査用入口** to enter the sample street. This review account uses a simulated NFC tag and location so you can test outside Japan. Regular accounts enter at a physical NFC tag in a supported street.
4. Inside the street you can open a sample 電信PIN, join it, use street chat, report content, and block its author. All people and content in this environment are fictitious.
5. You can leave the street from the entry screen. Account deletion is available in Settings and requires the review account password again. A spare account is available if the first one is deleted.

## 提出担当者の確認

App Store Connectの専用欄に資格と連絡先を入力する。実際の提出ビルドで上記の操作名・画面・退会を確認してから使用する。日本での対象場所を運営者が設定後、現地での実NFC・背景観測も別途検証する。実機動画は未準備。Appleは審査用アカウントと必要な機材・資料・アクセスの提供を案内している。地域制約の代替方法へのAppleの回答は未取得。[App Review Guidelines 2.1](https://developer.apple.com/app-store/review/guidelines/#app-completeness)

## 受入条件

- 新規端末で審査員の手順だけを使ってログインできる。期限切れ・再ログイン・退会後の予備経路も確認。
- 非審査アカウントからデモのAPI／データへアクセス不可。
- デモから通常ユーザーへの通知・投稿・位置共有が発生しない。
- 主要機能の成功・拒否・削除を提出版で確認し、実NFC/APNs/背景測位は別途実機確認。
- 記入済みメモ・QR・動画・操作経路と提出バイナリが一致。
