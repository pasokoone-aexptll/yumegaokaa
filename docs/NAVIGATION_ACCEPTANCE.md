# T006：画面・導線の受入対応

基準はMVP_TASKSの固定完了条件（R19）。画面の骨格と往復の証拠を集約する。各機能の認可・データ・実機完成を、この表だけで証明しない。cp118で現行ルートと呼出元を照合。過去の操作結果はTECH_VALIDATIONの該当cpを参照する。

| 画面・導線 | 現行実装（apps/mobile/src以下） | 操作証拠 |
| --- | --- | --- |
| Home / Map / Settings、初期Map | app/(tabs)/_layout.tsx、home.tsx、index.tsx、settings.tsx | cp43/66、testMVPNavigation。順序Home/Map/Settings、中央Map、ラベルなしの3アイコン |
| メールOTP→招待→名前→街pool→Map | app/_layout.tsx、invitations.tsx、profile.tsx、street-icons.tsx | cp50/60 testInvitationOnboarding、testPoolRegistrationFromPending、cp69実機ログイン/画像 |
| 資格停止→利用制限画面 | app/access.tsx、app/_layout.tsx | testSuspendedAccountGate、cp94。ログインと入街は別 |
| Mapトグル→説明→読取/登録→成功/取消 | components/StreetEntrySheet.tsx、hooks/useStreetMap.ts | cp77/96/115/117。成功/拒否/別端末/通信断退出を確認 |
| Map/Home→作成→募集/オフ会切替→地点選択→作成へ戻る | app/pins/create.tsx、location.tsx | cp43/46、testMVPNavigation/testEventCreateJoinCancel。タイトル保持と地点往復 |
| Home/地図ピン→募集詳細→編集/終了 | app/recruitments/[id].tsx、components/StreetMapMarkers.tsx | cp46 testRecruitmentAndChatExpansion、cp93の詳細接続 |
| Home/地図ピン→イベント詳細→参加/取消 | app/events/[id].tsx、components/StreetMapMarkers.tsx | cp44/69/81、testEventCreateJoinCancel。ユーザーのiPhone参加/取消確認 |
| イベント詳細→編集/参加者一覧 | app/events/edit/[id].tsx、events/[id].tsx | cp69/74、testHostEditRosterNotifications、testOperatorReportedEventRoster |
| お知らせ→イベント詳細→参加取消→Home | app/notifications.tsx | cp69実機確認、testHostEditRosterNotifications |
| チャット通常→拡大→Map、投稿操作→通報 | components/StreetChat.tsx、app/report.tsx | cp44/46/47/70、testRecruitmentAndChatExpansion/testPeerReportBlockUnblock |
| 募集/イベント詳細→通報→戻る | app/report.tsx | cp112 testPinReportEntrypoints、実DB保存照合 |
| Settings→プロフィール/街画像→戻る | app/profile.tsx、street-icons.tsx | cp43/69/70、testProfilePhotoPersistence/testStreetIconPhotoSelection |
| Settings→招待/ブロック/通知→戻る | app/invitations.tsx、blocks.tsx、notifications.tsx | cp43/47/70、testInviteIssueRevoke/testPeerReportBlockUnblock |
| Settings→アカウント管理→退会→戻る、接続状態 | app/account.tsx、withdraw.tsx、(tabs)/index.tsx | cp118 testAccountNestedNavigation。メール変更・退会実行は対象外、T005に残る |
| Settings→運営MFA→招待監督/参加者/通報対応 | app/admin.tsx、members.tsx、moderation.tsx | cp74/88/89/105、testOperatorResolvePeerReport/testOperatorMemberDateSelection/testOperatorInvitePagination |
| 運営→ステッカー一覧→登録/詳細→書込/照合/設置→戻る | app/stickers/index.tsx、[id].tsx | cp113 testOperatorStickerPreparation、途中離脱/再開。NFC入力はfake |
| ステッカー→範囲プレビュー/公開→交換/移設詳細 | app/stickers/area.tsx、[id].tsx | 既存testOperatorAreaPublication（MVP_TASKSの公開UI証拠）、cp114 API競合確認 |

## Figmaとの対応と限界

- 76/修正版：3タブ、街ヘッダー、Map、チャット、現在地/追加ボタン。ヘッダーは後続合意の幅可変pool列＋人数（cp106）。気配とチェックインの人数は別。
- 77/79：作成シートから全画面地点選択へ往復（cp43）。78：募集作成シート（cp46）。81：Home参加予定/募集一覧（cp44/69）。
- 82〜84：説明/待機/登録/成功の円形演出（cp77）、今回の通信断はcp117。
- 提供されていない設定・運営のFigmaを存在するものとして扱わない。各画面は既定機能の導線で構成。
- Mapの素材/カウントダウン表記判断はT007/Q10。Home背景グリッド等の既存軽微差分はBUG_BACKLOG。各機能の未決仕様、実NFC、iPhone全体確認は対応タスクに残す。
