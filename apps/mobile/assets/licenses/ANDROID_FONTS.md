# Android font assets — 2026-11-25

Androidのみ。iOSのシステムフォント/SwiftUI指定を変更しない。

- Intern: https://github.com/bvvst/intern (fonts/variable/Intern[opsz,wght].ttf)
- Noto Sans JP: https://github.com/google/fonts/tree/main/ofl/notosansjp
- 両方SIL Open Font License 1.1。元のライセンス/著作権表示をassets/licensesへ保存し、Androidのライセンス画面にも全文を同梱。
- API29以上はAndroid CustomFallbackBuilderでIntern→Noto Sans JP→システムfallback。wght 100〜900を登録。
- API24〜28はOFLの派生フォントDenshin Android Compat（Regular/Bold）。Internを優先し、日本語グリフをNotoから結合。予約名を製品フォント名へ使わず、同じOFLで配布。元の著作権者は上記ライセンスに記載。日本語の縦書きはアプリの対象外であり、互換生成時にvhea/vmtxを除外。
- 再生成: fonttools/brotliを用意して `python scripts/build-android-legacy-fonts.py`。アプリ依存へPythonは追加しない。
- BabelのAndroid callerに限り、自作srcのText/TextInputをAndroidTypographyへ変換。iOS/dependencies/adapter自身は変換しない。独自OnboardingDot指定は優先して保持。

## 保存ファイル SHA-256

- DenshinAndroidCompat-Bold.ttf: `5c08d413988ac00272c7e5eb769f7817d06b4fe812ceda2249c0551c73bb0842`
- DenshinAndroidCompat.ttf: `f52f1618ce880c0a12cf80ad856e99ffa28fbe80fed70846c4a457af27959f8a`
- Intern.ttf: `de12ee460ab00ff684acb35e5f625fcd3030a2da6678b34d28cb9886f19e88ed`
- NotoSansJP.ttf: `c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f`
