# 11/21 コード・UI整理（U34 / R19）

## 未使用部品

src内TS/TSXの相対import/requireを列挙し、.ios/.androidとindex解決を含めて部品への参照を照合。さらにapps/mobileとscriptsを名前検索。参照なしの旧PinListItem、PresenceHeader、StretchySunset、denshin/ExitDoorを削除した。現在のHome行、匿名列撤去、固定背景、OnboardingArtwork/LaunchSplashへの移行後の残存部品。原本素材、実験、レビューroute、プラットフォーム別実装は保持。全exportの到達可能性を証明した監査ではない。

## Figmaへの対応状況

29状態の過去照合はUI_REVIEW_STATUSに記録済みで、丸ごと未着手と断定できる画面は今回のコード検索では見つからない。ただし過去の確認は最新版の合格を保証しない。Home画像/本文サイズとMap匿名列の古い記載を最新指示に更新。

残っている具体差分はU35配置リングのレイヤー、U36自分のchat確定時の再出現、U37送信上限の分類。onboardingは指定3点の修正/fixture確認を行ったが、全フレーム一致は未完。写真picker初回待ち、実カメラQR、実OTP、別会員参加、運営MFA、実NFC、全画面Dynamic Type/Reduce Transparencyの確認は過去fixtureから完了にしない。

今後の整理はユーザー指摘キューと通常routeを基準とし、29画面の自主微調整を再開しない。
