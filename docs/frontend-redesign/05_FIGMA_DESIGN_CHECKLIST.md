調査日：2026-11-01。対象コード：`45c089e`（本調査で製品コード変更なし）。
これは**現行実装の観察記録**であり、新しい製品仕様・デザイン案ではない。実装済みはソース上の接続の存在を意味し、全状態の実機成功を意味しない。検証事実の正本は[TECH_VALIDATION](../TECH_VALIDATION.md)、進捗は[MVP_TASKS](../MVP_TASKS.md)。

# 05 Figma設計チェックリスト

チェックは**デザインに含めたか**のための空欄。実装/検証のDONEとは無関係。画面の最終構成はユーザーが決め、下記操作面をまとめたり別の見せ方にしても、02のデータ・操作・権限差を落とさない。

## 画面・段階

- [ ] [S001](02_SCREEN_SPECIFICATIONS.md#s001) Map — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S002](02_SCREEN_SPECIFICATIONS.md#s002) Homeピン一覧 — 有効会員・未入街可。
- [ ] [S003](02_SCREEN_SPECIFICATIONS.md#s003) Settings — 有効会員。
- [ ] [S004](02_SCREEN_SPECIFICATIONS.md#s004) プロフィール — 会員・名前未設定も可。
- [ ] [S005](02_SCREEN_SPECIFICATIONS.md#s005) 街アイコン — 会員・初回提供前も可。
- [ ] [S006](02_SCREEN_SPECIFICATIONS.md#s006) 招待 — 認証済み未登録は受領のみ。会員は発行と受領フォーム。
- [ ] [S007](02_SCREEN_SPECIFICATIONS.md#s007) お知らせ — 有効会員。
- [ ] [S008](02_SCREEN_SPECIFICATIONS.md#s008) ブロック設定 — 有効会員。
- [ ] [S009](02_SCREEN_SPECIFICATIONS.md#s009) アカウント管理 — 認証済み会員。
- [ ] [S010](02_SCREEN_SPECIFICATIONS.md#s010) 退会 — 認証済み会員。
- [ ] [S011](02_SCREEN_SPECIFICATIONS.md#s011) イベント詳細 — 会員。名簿は主催者またはMFA運営。
- [ ] [S012](02_SCREEN_SPECIFICATIONS.md#s012) イベント編集 — mine=true、DBでも主催認可。
- [ ] [S013](02_SCREEN_SPECIFICATIONS.md#s013) 募集詳細・題名編集 — 会員。mineのみ編集。
- [ ] [S014](02_SCREEN_SPECIFICATIONS.md#s014) 運営入口・ダッシュボード — 入口は全員、機能はoperatorかつAAL2。
- [ ] [S015](02_SCREEN_SPECIFICATIONS.md#s015) 運営参加者一覧 — 運営＋MFA（API認可）。
- [ ] [S016](02_SCREEN_SPECIFICATIONS.md#s016) 運営通報対応 — 運営＋MFA。
- [ ] [S017](02_SCREEN_SPECIFICATIONS.md#s017) 利用資格・再ログイン案内 — suspended/withdrawn/expired。
- [ ] [S018](02_SCREEN_SPECIFICATIONS.md#s018) ピン作成 — 会員。募集は当該端末の有効入街が必要。
- [ ] [S019](02_SCREEN_SPECIFICATIONS.md#s019) 通報フォーム — 会員、route kind/idをAPIで検証。
- [ ] [S020](02_SCREEN_SPECIFICATIONS.md#s020) ステッカー一覧・新規登録 — 運営＋MFA。
- [ ] [S021](02_SCREEN_SPECIFICATIONS.md#s021) ステッカー詳細 — 運営＋MFA。
- [ ] [S022](02_SCREEN_SPECIFICATIONS.md#s022) 街範囲・設置管理 — 運営＋MFA。
- [ ] [S023](02_SCREEN_SPECIFICATIONS.md#s023) 地点選択route — 会員。
- [ ] [S024](02_SCREEN_SPECIFICATIONS.md#s024) メールOTP・送信前 — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S025](02_SCREEN_SPECIFICATIONS.md#s025) メールOTP・コード入力 — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S026](02_SCREEN_SPECIFICATIONS.md#s026) 入街・共有説明 — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S027](02_SCREEN_SPECIFICATIONS.md#s027) 入街・読取待ち — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S028](02_SCREEN_SPECIFICATIONS.md#s028) 街チャット・縮小 — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S029](02_SCREEN_SPECIFICATIONS.md#s029) 街チャット・拡大 — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S030](02_SCREEN_SPECIFICATIONS.md#s030) アカウント・接続状態Modal — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S031](02_SCREEN_SPECIFICATIONS.md#s031) 招待コード受領フォーム — 認証済み未登録は受領のみ。会員は発行と受領フォーム。
- [ ] [S032](02_SCREEN_SPECIFICATIONS.md#s032) 招待発行・共有フォーム — 認証済み未登録は受領のみ。会員は発行と受領フォーム。
- [ ] [S033](02_SCREEN_SPECIFICATIONS.md#s033) メール変更・新旧確認 — 認証済み会員。
- [ ] [S034](02_SCREEN_SPECIFICATIONS.md#s034) 退会・再認証フォーム — 認証済み会員。
- [ ] [S035](02_SCREEN_SPECIFICATIONS.md#s035) イベント参加者一覧 — 会員。名簿は主催者またはMFA運営。
- [ ] [S036](02_SCREEN_SPECIFICATIONS.md#s036) イベント編集・地点Modal — mine=true、DBでも主催認可。
- [ ] [S037](02_SCREEN_SPECIFICATIONS.md#s037) 日時選択sheet（共通） — 会員。募集は当該端末の有効入街が必要。
- [ ] [S038](02_SCREEN_SPECIFICATIONS.md#s038) 運営TOTP登録 — 入口は全員、機能はoperatorかつAAL2。
- [ ] [S039](02_SCREEN_SPECIFICATIONS.md#s039) 運営TOTP追加認証 — 入口は全員、機能はoperatorかつAAL2。
- [ ] [S040](02_SCREEN_SPECIFICATIONS.md#s040) 会員制限操作フォーム — 運営＋MFA（API認可）。
- [ ] [S041](02_SCREEN_SPECIFICATIONS.md#s041) 募集ピン作成タブ — 会員。募集は当該端末の有効入街が必要。
- [ ] [S042](02_SCREEN_SPECIFICATIONS.md#s042) オフ会通知作成タブ — 会員。募集は当該端末の有効入街が必要。
- [ ] [S043](02_SCREEN_SPECIFICATIONS.md#s043) 募集・公開地点確認 — 会員。募集は当該端末の有効入街が必要。
- [ ] [S044](02_SCREEN_SPECIFICATIONS.md#s044) OS写真選択 — 会員・名前未設定も可。
- [ ] [S045](02_SCREEN_SPECIFICATIONS.md#s045) OS招待共有 — 認証済み未登録は受領のみ。会員は発行と受領フォーム。
- [ ] [S046](02_SCREEN_SPECIFICATIONS.md#s046) OS通知許可 — 有効会員。
- [ ] [S047](02_SCREEN_SPECIFICATIONS.md#s047) 通報受付完了 — 会員、route kind/idをAPIで検証。
- [ ] [S048](02_SCREEN_SPECIFICATIONS.md#s048) ステッカー新規入力 — 運営＋MFA。
- [ ] [S049](02_SCREEN_SPECIFICATIONS.md#s049) 新規ステッカー地点Modal — 運営＋MFA。
- [ ] [S050](02_SCREEN_SPECIFICATIONS.md#s050) ステッカー編集フォーム — 運営＋MFA。
- [ ] [S051](02_SCREEN_SPECIFICATIONS.md#s051) ステッカー・書込待ち — 運営＋MFA。
- [ ] [S052](02_SCREEN_SPECIFICATIONS.md#s052) ステッカー・照合待ち — 運営＋MFA。
- [ ] [S053](02_SCREEN_SPECIFICATIONS.md#s053) ステッカー・設置確認待ち — 運営＋MFA。
- [ ] [S054](02_SCREEN_SPECIFICATIONS.md#s054) ステッカー編集地点Modal — 運営＋MFA。
- [ ] [S055](02_SCREEN_SPECIFICATIONS.md#s055) ステッカー移設地点Modal — 運営＋MFA。
- [ ] [S056](02_SCREEN_SPECIFICATIONS.md#s056) 入街・サーバー記録待ち — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S057](02_SCREEN_SPECIFICATIONS.md#s057) 入街完了 — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S058](02_SCREEN_SPECIFICATIONS.md#s058) OS画像切り抜き — 会員・名前未設定も可。
- [ ] [S059](02_SCREEN_SPECIFICATIONS.md#s059) OS位置情報許可 — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S060](02_SCREEN_SPECIFICATIONS.md#s060) OS NFC読書セッション — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S061](02_SCREEN_SPECIFICATIONS.md#s061) OSローカルネットワーク許可（開発環境） — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [S062](02_SCREEN_SPECIFICATIONS.md#s062) ステッカー・公開待ち — 運営＋MFA。
- [ ] [S063](02_SCREEN_SPECIFICATIONS.md#s063) ステッカー・公開済み — 運営＋MFA。
- [ ] [D001](02_SCREEN_SPECIFICATIONS.md#d001) 街pool取り下げ — 会員・初回提供前も可。
- [ ] [D002](02_SCREEN_SPECIFICATIONS.md#d002) 退会最終確認 — 認証済み会員。
- [ ] [D003](02_SCREEN_SPECIFICATIONS.md#d003) イベント中止確認 — 会員。名簿は主催者またはMFA運営。
- [ ] [D004](02_SCREEN_SPECIFICATIONS.md#d004) イベント最新内容へ置換 — mine=true、DBでも主催認可。
- [ ] [D005](02_SCREEN_SPECIFICATIONS.md#d005) 募集題名を最新へ置換 — 会員。mineのみ編集。
- [ ] [D006](02_SCREEN_SPECIFICATIONS.md#d006) 会員停止/解除 — 運営＋MFA（API認可）。
- [ ] [D007](02_SCREEN_SPECIFICATIONS.md#d007) 運営の投稿削除 — 運営＋MFA。
- [ ] [D008](02_SCREEN_SPECIFICATIONS.md#d008) ステッカー書込 — 運営＋MFA。
- [ ] [D009](02_SCREEN_SPECIFICATIONS.md#d009) ステッカー登録取消 — 運営＋MFA。
- [ ] [D010](02_SCREEN_SPECIFICATIONS.md#d010) 街範囲公開 — 運営＋MFA。
- [ ] [D011](02_SCREEN_SPECIFICATIONS.md#d011) ステッカー交換 — 運営＋MFA。
- [ ] [D012](02_SCREEN_SPECIFICATIONS.md#d012) ステッカー移設 — 運営＋MFA。
- [ ] [D013](02_SCREEN_SPECIFICATIONS.md#d013) ステッカー停止 — 運営＋MFA。
- [ ] [D014](02_SCREEN_SPECIFICATIONS.md#d014) チャット長押しメニュー — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [D015](02_SCREEN_SPECIFICATIONS.md#d015) 開発用タグ上書き確認 — 有効会員。未入街可。未認証はS024、準備中はspinner。
- [ ] [D016](02_SCREEN_SPECIFICATIONS.md#d016) 開発用タグ書込結果 — 有効会員。未入街可。未認証はS024、準備中はspinner。

## 共通部品

- [ ] Home/Map/Settingsタブ、選択/非選択、戻る、modal close。
- [ ] ボタン：通常/実行不可/送信中。二重操作抑止とcancelの意味を混同しない。
- [ ] 入力：未入力/入力中/文字数・形式エラー/送信本文固定/競合時の旧入力。
- [ ] 一覧：初回読み込み/0件/過去・続きを取得/旧一覧＋通信エラー/再試行。
- [ ] 本人画像、街pool画像、未設定fallback。2種類を同一プロフィールと誤認させない。
- [ ] 写真選択・正方形切抜き・保存中・失敗・提供取り下げ。OS所有部分との境界。
- [ ] 日時選択・未設定・キャンセル・確定。日付を省略した時刻だけで日を誤認させない。
- [ ] 地点選択・未選択・選択済み・決定/取消。公開地点と現在地へ戻る操作を区別。
- [ ] 地図の気配：0/1/6/7→5+2/多人数、幅可変のヘッダー/+残数、失効fade。
- [ ] イベントピンの開催前/開催中/終了除外、募集ピンの20分/手動終了/退出終了。
- [ ] 通報/ブロック/削除等の長押しメニュー。本人/他人/入街ログ/削除済みの差。
- [ ] Alertの破壊的操作・キャンセル。OS sheetにアプリ独自画面を重ねる制約。

## 非表示にすると機能の意味が変わる情報

- [ ] チェックイン人数と有効気配人数は別。古い気配なし＝現地に誰もいない、とはしない。
- [ ] 入街時の背景共有とOFF停止の意思確認。勝手な再参加・位置公開を作らない。
- [ ] 募集の精密位置の明示公開。通常の気配は端末区画化であり別扱い。
- [ ] pool提供画像が街で共有され毎日午前0時に割り当てられること、本人画像との違い。
- [ ] 参加ボタンは街へのチェックインと別。主催者と参加者も別。
- [ ] 名簿は主催者/運営のみ。一般には人数、自分の参加状態。
- [ ] 退出待ち/結果不明と成功の区別。ローディングを成功演出で置き換えない。
- [ ] 投稿制限の終了日時・利用停止・退会・メールを失った時の復旧範囲。
- [ ] 退会は取り消せない。消去/匿名化/保存期限の既存契約を維持。
- [ ] 運営MFAの秘密キー・確認コードを一般画面やログへ露出させない。
- [ ] ステッカーの書込/照合/設置/公開は別段階。交換と移設で旧タグ停止時点が違う。

## デザイン前に参照する制約

[06](06_GAPS_AND_CONSTRAINTS.md)のG01〜G12。地図の提供条件/カウントダウンQ10は仕様未確定、ADP/実Push/実NFCは外部未検証。現行仮UIの説明文やエラーの生文字列まで忠実に残す要求ではない。必要な意味と操作を残し、最終の視覚表現はFigmaで定める。
