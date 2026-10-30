# T031：ローカル主要フローの統合証拠

固定完了条件：ローカル実DBで招待→登録→閲覧→入街→気配→募集/チャット→イベント参加/変更通知→退出、運営登録/対応を一巡する。実NFC/Pushのみ明示adapter代用可。

同一テストですべてを再実行せず、同じ実装の役割別操作証拠を接続する。共通経路を変更した箇所だけ追加確認する。実機固有の成立性はT010/T032、外部依存はT019/T028/T033に残る。

| フロー | 実画面・実DBの証拠 | 境界 |
| --- | --- | --- |
| 招待→登録→プロフィール→街pool→Map | cp50/60、testInvitationOnboarding/testPoolRegistrationFromPending。cp69/70本人画像/街画像と再起動をユーザー実機確認 | 本番メール配信/旧端末方針はT005 |
| 閲覧→入街→気配→退出 | testLoginEntryRestartExit、cp77/96/106/115/117。native観測→API→最新1件、ヘッダーとMap表示、別端末・退出待ち・通信回復後OFF | NFC入力は開発adapter。ロック歩行はT010 |
| 募集作成→地図/詳細→編集/終了 | cp46/93、testRecruitmentAndChatExpansion。公開条件/期限はT014の実DB証拠 | 集合位置は投稿時だけ取得 |
| チャット→履歴→削除→通報/ブロック | cp44/47/70/86/111/112。実機送信/削除/通報/解除確認。2実Authクライアントと空白回復 | cp128で新構成のRN画面が別参加者の実DB新着を再操作なしで表示 |
| オフ会作成→参加→Home→主催者編集→通知→詳細→取消 | cp44/69/74/81、testEventCreateJoinCancel/testHostEditRosterNotifications、ユーザー実機確認。cp109地図ピン描画 | 実PushはT019。アプリ内通知は実DB |
| 運営MFA→通報対応・参加者制限 | cp47/74/88/89/105/112/126、理由付き監査と停止後非復活 | cp127で投稿制限解除・滞在維持・理由付き監査も確認。cp130で一般参加取消し/解除後非復活も確認 |
| 運営ステッカー登録→照合→設置→範囲公開/移設 | cp113/114、testOperatorStickerPreparation/testOperatorAreaPublication | 読書のみfake、MFA/DB/公開条件は実処理 |

画面一覧/Figma対応はNAVIGATION_ACCEPTANCE。認可・3接続・迂回防止はLIMIT_ACCEPTANCE、保存削除はRETENTION_ACCEPTANCE。これらを再試験せず既存結果を利用する。未決の製品判断をこの表で採用済みに変更しない。

## cp128の補完確認と判定

`testGatewayLiveChat`（/tmp/yumegaoka-gateway128.xcresult、7.034秒）で、表示済みRN Mapへ別参加者のメッセージを実DB投入し、画面遷移/手動再読込なしで表示確認。入力は専用fixture、表示は本体HTTP/API。5秒のポーリングも有効なため、この画面試験単独でWebSocket配送だけを証明しない。ゲートウェイ単体/実Auth/実アプリ共通接続・再接続のcp101/103/104/111と合わせ、新構成の画面接続を確認。fixtureはfinally削除。

以上で固定T031の役割別主要フローを満たしDONE。各依存タスク全体がDONEであることを条件に追加しない。cp131でT005の退会/旧端末方針、T024の一般参加者停止時登録、T030の退会関連保持も解消。T007の最終地図/表記、実機/外部条件は各タスクに残る。アプリ製品コードの変更なし、同一Release124を使用。
