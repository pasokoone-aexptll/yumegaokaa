# ストア審査対策 — 2026-11-25

判定：**提出不可（未確認と未実装あり）**。Codexへのツール導入成功はアプリの審査適合を意味しない。

## 導入と実行

ユーザーの明示依頼により、[app-store-compliance](https://github.com/mjmirza/app-store-compliance) v2.5.1、取得commit `ea7008b0362fc01e34528ba8d7d52dd99dafcde5`の `scripts/install.sh --tool codex` を実行。`Install verified.`、登録コマンドによる提出停止／通常コマンドの無出力を確認。

- ガード：`~/.codex/hooks/app-store-compliance-guard.sh`
- スキルと参照資料：`~/.agents/skills/app-store-compliance/`
- 登録：`~/.codex/hooks.json`
- 再実行：リポジトリ直下で `npm run compliance:check`
- 削除：`bash ~/.agents/skills/app-store-compliance/scripts/install.sh --tool codex uninstall`

自動実行の信頼承認は未確認。[Codex公式手順](https://learn.chatgpt.com/docs/hooks)に従い、デスクトップでは Settings → Hooks／Review hooks、CLIでは `/hooks` で新しいフックをレビューする。設定の信頼状態をスクリプトで書き換えない。このチャットではインストール済みガードを明示実行済み。スキルの自動発見は次のターン以降。

インストール直後：critical=2 / high=13 / medium=4。準備状況ファイルを追加した再実行：critical=8 / high=12 / medium=4、exit 2。重大件数の増加は未確認6項目の提出防止を追加したためで、不具合の増加ではない。監査中に別作業のコミットも進んでいるため、HIGHの減少を今回の修正成果に数えない。

ガードの鮮度表示：

> Rule pack. v2.5.1. Its 113 dated sources were verified between 2026-07-13 and 2026-11-23 (newest 2 days ago).

2出典は検証から60日以上経過。法規・期日は適用地域と一次資料で再確認する。重大2件は下記の誤検出だが、未確認ゲートを迂回してCLEARにはしない。生出力は今回 `/tmp/yumegaoka-compliance-final.txt`。再現は上記npmコマンド。

## 実際の修正・残件（R03/R15/R17/R18/R19、T024/T031/T032/T033）

| 重要度・ID | 根拠・現状 | 対応／状態 |
| --- | --- | --- |
| 提出阻止 C01 Privacy policy（Apple 5.1.1(i)、Play User Data） | account.tsxの「利用規約とプライバシー」はlicenses.tsxのライセンス一覧へ遷移。公開ポリシーと連絡先なし | 運営者名は未定。dreamcloud.shを使用、support@dreamcloud.shの受信転送は設定済み（受信テスト待ち）。PRIVACY_POLICY_DRAFT.mdを準備。ポリシー公開・アプリへのリンク・ストア設定は外部待ち |
| 提出阻止 C02 Deletion（Apple 5.1.1(v)） | 旧037はmessages.author_idだけをnull化し本文を保持。Appleは共有されたUGCも削除対象と説明 | ユーザーが本文削除へ変更を承認。057で今後の退会時にchat本文をnull化＋削除時刻、PIN本文を「削除済み」に置換＋閉鎖。ローカル反映・DB試験済み。057クラウド配備と合成退会ROLLBACK確認済み。実Auth／Storage最終削除・実機は未完 |
| 提出阻止 C02残余 | 過去に匿名化済みのchatは元作者を追えない。通報証拠、旧募集・イベント等には別の保存内容がある | 一括削除は未実行。過去データ棚卸し、通報保持の必要性／根拠、削除完了時刻の案内を決める。今回の修正だけで全アカウント削除適合とはしない |
| 高 C03 UGC（Apple 1.2） | 通報・ブロック・運営削除は実装済み。投稿前の不適切コンテンツfilterと公開連絡先の根拠を確認できない | chat/PIN/プロフィール画像/pool画像の対象と、拒否・保留・運営確認の方式を選定。外部判定サービスへの画像送信は未承認。運営対応体制も準備する |
| 高 C04 Reviewer access（Apple 2.1） | OTP→招待QR、街・NFCで機能が制限される。開発fixtureは審査用アクセスの証拠にならない | デモアカウント／QR、地域制限機能へのレビュー手順と必要機材、稼働バックエンドを審査メモへ。実際の提出版で検証待ち |
| 高 C05 Privacy declarations（Apple 5.1.2／App Privacy） | メール、ID、画像、投稿、参加、区画等を扱う。生GPSを送らないことは位置データ非収集と同義でない | SDKとRelease通信を含むデータ一覧→App Privacy／Data Safetyを照合。PrivacyInfo.xcprivacyの存在・構文合格のみでは完了にならない |
| 中 C06 Submission metadata（Apple 2.3） | App Store Connect／Play Consoleは未閲覧 | ADP有効性・契約・年齢区分・配信地域・スクリーンショット・輸出申告を確認。掲載情報未取得のためmetadata-audit未実施 |

一次資料：[Apple審査ルール](https://developer.apple.com/app-store/review/guidelines/)、[アカウント削除とUGC](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)、[App Privacy](https://developer.apple.com/app-store/app-privacy-details/)。原ツールの推奨事項を一律にAppleの必須条件と解釈しない。例えばガイドライン1.2の本文は通報へのtimely responseを要求しており、ツールの「一律24時間」をそのまま必須と断定しない。

## 自動検出の仕分け

| ID（スキャナーの重要度） | 評価・次の確認 |
| --- | --- |
| APPLE-2.1-STAGING-BACKEND（critical） | app.config.ts:9のlocalhostは検証ReleaseをローカルURLへ限定する判定。これだけで本番のlocalhost接続とは言えず誤検出。提出バイナリの接続先検証は別途必要 |
| APPLE-5.1.1-NO-ACCOUNT-DELETION（critical） | account→withdraw→useWithdrawal→withdraw_confirmは存在。「画面なし」は誤検出。本文保持は別の実問題で057にて部分修正 |
| APPLE-5.1.1-MISSING-PRIVACY-POLICY／GOOGLE-MISSING-PRIVACY-POLICY（high） | 確認済み不足。C01 |
| RN-OTA-UNDECLARED（初回high） | package-lockの間接依存。iOS Expo.plistとAndroid ManifestではUpdates無効。依存の存在だけでOTA運用中とはしない |
| GOOGLE-PAYMENTS-DONATION-LINK（high） | package-lock.jsonのBabel funding URL。アプリ内寄付導線の証拠ではなく誤検出 |
| BOTH-UNSAFE-DEEPLINK（両OS high） | 独自schemeあり。Universal/App Linksへの移行はドメイン準備が必要。独自schemeだけでストア違反とは断定せず、リンク入力検証・OTPトークン流出経路を点検 |
| APPLE-EXPORT-COMPLIANCE-MISSING（high） | Info.plistにキーなし。暗号方式を棚卸し、ASCで回答または適切な宣言を追加。未確認のままfalseを設定しない |
| GOOGLE-DATASAFETY-MISMATCH（high） | Gradle plugin行の文字列検出は広告SDKの証拠にならない。Data Safety照合自体は必要 |
| ANDROID-INSECURE-BACKUP（high） | allowBackup=true。SecureStore使用は確認。最終manifestの除外規則とバックアップ対象を調査して修正する |
| ANDROID-OVERLAY-TAPJACKING（high） | debugOptimizedだけでなくmainにもSYSTEM_ALERT_WINDOWがある。提出成果物での必要性と除去方法を確認。検出だけで悪性とは断定しない |
| ANDROID-RUNTIME-PERMISSIONS（high） | import行だけでは欠如を証明しない。拒否・再許可・背景観測を実機確認 |
| ANDROID-R8-OPTIMIZATION-MISSING（high） | 提出ビルドのGradle property、最終AAB、公式の適用条件を確認 |
| WEB-TRACKING-TECHNOLOGIES（high） | lockfile由来。現行配信対象はモバイル。Web追跡を行う証拠として採用しない |
| APPLE-ACCESSIBILITY-COLORCONTRAST（medium） | RGB定義だけで不適合とは断定できない。実画面で評価 |
| APPLE-2.3-AGE-RATING-2026（medium） | ASC未確認。2027-01-12期限のShared Location／Dating and Relationships回答も確認 |
| ANDROID-RESTORE-CREDENTIALS-REQUIRED（medium） | 適用期日・対象条件の一次資料確認待ち。今回未実装 |
| GOOGLE-12-TESTER-RULE（medium） | Playのアカウント種別／作成時期を確認して適用判定 |

90日以内のApple共通項目で本アプリに関係し得るもの：2027-01-12の年齢区分追加質問。[Apple公式](https://developer.apple.com/news/?id=yxkh08us)で確認済み。気配の区画共有を含めShared Locationの回答を検討する。初回日本のみ・個人登録をユーザー確認済み。EU・米国・中国等へ配信を広げる場合は原データから追加確認する。

## 検証と限界

- `node --test tests/withdrawal-content.test.mjs`：成功。ローカルDBでmigrationをtransaction内に読み込み、再認証なし拒否、本人本文消去、他人本文維持、PIN閉鎖、再送を検証して全変更ROLLBACK。実Authメール送信や実機操作の証拠ではない。
- `node scripts/apply-local-migration.mjs 202611250057_withdrawal_content_deletion.sql`：ローカル反映成功。11/25に057のみクラウド配備、配備済み関数の合成退会ROLLBACK試験も成功。
- mobile typecheck：成功。変更したwithdraw.tsxのeslint：成功。
- mobile全体lint：10 errors / 1 warning。未変更のreview-onboarding、StreetChat、ReceiveInvitation、useDelayedRefreshStatus等のReact hooks指摘。今回の変更で解消したと扱わない。
- PrivacyInfo.xcprivacyの配布元validator：構文検証成功。SDK／実データとの整合・アーカイブ内容は未確認。
- ネイティブビルド・端末更新・公開・GitHubアカウント操作は実施していない。

旧33件の履歴・分母は変更なし：実装29/33（87.9%）、統合27/33（81.8%）、iPhone11/33（33.3%）、DONE27/33（81.8%）、BLOCKED3/33（9.1%）。実機不要のDB試験は実機分子へ加算しない。残量の前回→今回：今回初めてC01〜C06を切り出して測定、全体工数の減少は未計測。C02の今後の本文削除のみローカル実装／DB検証へ進んだ。新しい別製品機能ではなく既存R03/R15/R17とT033の公開条件の不足解消。追加工数は外部情報・保存方針の確定後に算定する。

## 2026-11-25 提出優先順の確定

[APP_STORE_SUBMISSION_PLAN](APP_STORE_SUBMISSION_PLAN.md)を追加。ADPは11月26日申込予定、dreamcloud.shを公式サイトに使用。supportアドレスの受信転送は設定済み、実受信とsupport名義の送信は未確認。ローカルの退会データ読取専用集計は7分類0件、後続のクラウド点検・バックアップ再実行成功・R2の7日期限確認はPRODUCTION_RETENTION_REVIEW参照。サイトの土台はhello.dreamcloud.shに公開済み、規約正文は未公開。

## 11月25日 提出設定と資料の追加

C04/C05/C06・R03/R07/R15/R17/R18・T033：[APP_STORE_BUILD](APP_STORE_BUILD.md)、[APP_REVIEW_ACCESS](APP_REVIEW_ACCESS.md)、[APP_STORE_PRIVACY_EVIDENCE](APP_STORE_PRIVACY_EVIDENCE.md)を追加。試験用設定がstoreモードに混入した場合と未設定を停止。通常開発モードは維持。提出可能判定は変わらず、公開・配備・実機・Apple了承は未実施。年齢は13〜17歳も含めたい意向、具体条件は相談中。

## 13〜17歳の保護者同意に関する提出前条件

本人申告チェック方式を採用。保護者の返信待ちなし、画像・現地合流は維持。採用は法的充足や審査了承を意味しない。TEEN_SAFETY_DISCUSSIONのAGE01〜09（法務、公開文面、年齢判定、記録／撤回、既存利用者、サーバー検査、実機、年齢質問票、UGC）を未完として管理する。年齢3択と申告のアプリ／DB接続を実装し、ローカルROLLBACK試験済み。記録は退会時削除で承認済み。公開文面・法務・配備・実機は未完。既定OFF、storeモードでは有効化が必須。
