# 気配の背景観測：iPhone検証アプリ

製品コードではなく、Apple Core Locationの挙動と気配状態のモデルを調べる隔離した試作。製品のReact Native採用方向は変更しない。

## 準備・起動

1. `PresenceProbe.xcodeproj` をXcodeで開く。
2. Target「PresenceProbe」→ Signing & Capabilities → 自分のTeamを選ぶ。識別子が使えなければ自分用のBundle Identifierへ変更する。
3. iPhoneをMacに接続し信頼する。必要ならiPhoneでDeveloper Modeを有効化する。
4. 実行先としてiPhoneを選び、Run。デバッガ接続の影響を避ける本試験では、インストール後いったんXcodeから停止し、iPhoneのホーム画面からアプリを起動する。
5. 説明を読み「使用中の位置情報を許可」。必要に応じ「背景の許可を追加で要求」。システムが追加ダイアログを出さない場合は設定で許可状態を確認する。許可状態と正確／おおよそを記録する。
6. 「検証開始」を押す。これはNFCを代用する試験操作。製品のチェックイン導線ではない。
7. 最初の観測が受理されてから画面をロックし、20〜30分、数百m歩く。強制終了はしない。終了時にアプリへ戻り「停止」を押す。

## 確認するもの

- 背景で受理された件数、区画変化、最大観測間隔（停止までの末尾の空白を含む）。
- 10分以上の観測空白が出るか。同じ区画に留まる場合も別試験する。
- 権限・省電力・端末OS・試験時間・電池開始終了。電池表示は粗いので、同時間の非実行時と比較する。
- 手動停止後に取得が続かないか。アプリ強制終了時、再起動時は別の試験として記録する。
- サーバーとの通信、BLE、地図、NFC、実際の街多角形、複数端末は未実装。

## この試作の制約

- 100mの近似ローカル区画、精度100m以内、観測の古さ120秒以内、開始点から2kmの円を試験用に使う。製品仕様として決まった値ではない。
- Core Locationを開始したまま、距離フィルタ50m・精度100mで観測する。端末内の位置取得は継続的なAPIであり、「間欠送信だから端末で測位していない」わけではない。電池を測定するための比較基準。
- `pausesLocationUpdatesAutomatically=false` を実験値にしている。省電力性は未検証。定刻の更新を保証しない。
- 位置座標と区画の対応はメモリ内だけ。ネットワーク送信・ファイル保存・座標ログ出力はしない。観測記録は時刻・区画ラベル・精度・前面背景・間隔のみ最大300件。停止後に消去でき、プロセス終了で失われる。
- 区画ラベルの変化はこの検証中だけ追える。生データを送らなくても行動の手がかりになるため外部に共有しない。スクリーンショットを共有するときも時刻等に注意する。
- 秘密トークンと状態はローカルモデル。実サーバーの認証・トランザクション・ネットワーク障害への証明ではない。
- 背景の更新が来なければ画面の残り時間だけで観測を作らない。端末が停止しても実サーバーで失効することは、別途バックエンドで検証する。

## モデルテスト

リポジトリルートから：

```sh
mkdir -p /tmp/yumegaoka-probe-module-cache
swiftc -module-cache-path /tmp/yumegaoka-probe-module-cache experiments/presence-ios/PresenceProbe/PresenceState.swift experiments/presence-ios/Tests/main.swift -o /tmp/yumegaoka-presence-tests
/tmp/yumegaoka-presence-tests
```

iPhone向け未署名ビルド：

```sh
xcodebuild -project experiments/presence-ios/PresenceProbe.xcodeproj -scheme PresenceProbe -configuration Debug -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath /tmp/yumegaoka-probe-build CODE_SIGNING_ALLOWED=NO build
```

実機実行には自分のApple Accountによる署名が必要。シミュレータの成功を背景実機成功と扱わない。
