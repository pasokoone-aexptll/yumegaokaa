# iPhone開発構成の推奨案 v0.1

2026-10-29。FIRST_SLICE_CONTRACTのB02。構成K01は承認済み・依存導入済み。本体の中核部分を実装し、シミュレータとPersonal Team用ビルドの既存成功記録がある。全体フェーズと残作業はMVP_TASKS、証拠はMVP_IMPLEMENTATION_AUDIT。React Native方向、MapLibre、Supabase、メールOTPは既に採用済み。

## 採用する構成K01

| 部分 | 推奨 | 理由・境界 |
| --- | --- | --- |
| アプリ基盤 | React Native＋TypeScript、Expo development build、New Architecture | iPhoneのネイティブ機能を組み込め、将来Androidへ画面とAPI処理を共有できる |
| ビルド | MacのXcodeでローカルビルド。Expo prebuild＋設定プラグイン | クラウドビルド契約を前提にしない。生成物への手修正を正本にしない |
| 地図 | @maplibre/maplibre-react-native | 採用済み。Figmaのアイコン・ラベルを描画。背景タイル提供者は別選定 |
| NFC | react-native-nfc-managerのNew Architecture対応版 | 利用者のNDEF読取と運営の書込・再読取を同じアダプターで扱う |
| 気配の背景観測 | 小さなローカルExpo Module（Swift＋Core Location） | 単調時計と測位timestamp、停止意思、直列処理を同じネイティブ側で扱う。既存試作の知見を使うが、そのまま製品扱いにしない |
| 認証・通常API | @supabase/supabase-js | 採用基盤の公式クライアント。画面から内部テーブルを直接更新しない |

K01の組合せは承認済み。アプリ全体をSwiftへ変更する案ではない。Swiftは背景観測に限定し、画面・地図表示・イベント等はReact Native。Android移植時には同じ観測インターフェースのAndroid実装が必要。

## 背景処理の選択理由

expo-location＋expo-task-managerは背景位置取得を提供し、有力な代案。最も既製品寄りにできる。一方、今回は既に壁時計変更の検出・スリープを跨ぐ単調時計・測位時点の対応・OFF優先の直列状態を具体化した。これをJSイベント受信時だけで再構成するより、Core Locationのcallbackでまとめて扱う構成を推奨する。ライブラリに背景機能がないという意味ではない。

独自モジュールには保守・iOS実機試験の負担がある。位置取得を二重起動しないため、expo-locationを同時に別の気配観測エンジンとして使わない。Mapの現在地表示も同じ位置取得窓口を通す。チェックイン外の一回限り現在地取得は公開・背景観測と別の操作にする。

境界インターフェース案：startVisitObservation、stopVisitObservation、getObservationState、applyStreetConfig。ネイティブ側で新鮮な観測・時計・区画・順序・終了意思を扱い、更新用ペイロードを生成する。背景送信をUIのReactコンポーネントの生存に依存させない。

背景の送信経路、認証トークン更新の単一管理、キー保存の共有はネイティブ／JS境界の実装設計が必要。認証更新を両側で競合させない。期限切れ資格では送信保留し、訪問期限はサーバーで守る。接続方式の不足を『Expoなら自動解決』と扱わない。ここは最初の一本の実装中に実通信で確認する対象。

## バージョンと互換性

公式MapLibre資料ではv11以降New Architectureのみ、RN 0.80以上を要件としている。Expoも新しいSDKはNew Architectureを前提とする。NFCライブラリのREADME検索結果とCHANGELOGにはv4のベータ／安定版表記の時間差があるため、検索結果だけで特定パッチ版を固定しない。

実装開始時に公開済み安定Expo SDKとそれに対応するRNを基準に、MapLibre・NFCの公開パッケージ・タグ・peer依存を照合して一組をlockfileへ固定する。常にlatestを追う運用にしない。互換性が合わなければ理由を記録して隣接安定版を比較する。混在構成のシミュレータビルドは成功。実機NFCは未確認。対応iOS下限はこの依存セットの下限と対象利用者を確認して決める。

## 最初の接続順

1. RN/Expo開発ビルドを実機起動。
2. MapLibreの地図とFigmaに沿う仮の気配表示を接続。仮表示は開発用とし、実人数と偽らない。
3. NFC読取・書込・再読取・取消を実タグ確認。
4. 観測モジュールとDB/APIを接続しT01〜T16を実行。
5. リリース相当の構成でもロック中動作を確認。開発サーバー接続時だけの成功で完了にしない。

この順序を基に本体実装を開始済み。アプリ生成・依存導入・ローカルDB作成まで実施。クラウドは未作成。地図タイル、署名／配布、公開予算は別判断。デモタイルをそのまま本番提供元と決めない。

## 一次資料（2026-10-29）

- [Expoローカルビルド](https://docs.expo.dev/guides/local-app-development/)
- [Expoローカルネイティブモジュール](https://docs.expo.dev/modules/get-started/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo New Architecture](https://docs.expo.dev/guides/new-architecture/)
- [MapLibreセットアップ](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/)
- [NFCライブラリ](https://github.com/revtel/react-native-nfc-manager)、[変更履歴](https://github.com/revtel/react-native-nfc-manager/blob/main/CHANGELOG.md)

## 初回の実装結果

Expo 58.0.21、RN 0.88.0、React 19.3.0、MapLibre 11.5.0、NFC manager 4.2.0をlockfileへ固定。Expo互換チェック、型/Lint、Releaseシミュレータビルドに合格。Swift nativeの認証actor、Core Location、Keychain、背景送信、画面の単調時計を接続。詳細な証拠と限界はTECH_VALIDATION。実機署名はPersonal TeamのNFC権限制限で未完。
