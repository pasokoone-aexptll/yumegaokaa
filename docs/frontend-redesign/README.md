調査日：2026-11-01。対象コード：`45c089e`（本調査で製品コード変更なし）。
これは**現行実装の観察記録**であり、新しい製品仕様・デザイン案ではない。実装済みはソース上の接続の存在を意味し、全状態の実機成功を意味しない。検証事実の正本は[TECH_VALIDATION](../TECH_VALIDATION.md)、進捗は[MVP_TASKS](../MVP_TASKS.md)。

# フロントエンド再設計のための現行実装資料

Figma設計前は01→03→05、個別項目の詳細は02、実装接続は04/07、未実装・制約は06を読む。

1. [全画面一覧](01_SCREEN_INVENTORY.md)
2. [画面別詳細仕様](02_SCREEN_SPECIFICATIONS.md)
3. [画面遷移・ユーザーフロー](03_NAVIGATION_AND_USER_FLOWS.md)
4. [部品・ロジック・データ接続](04_COMPONENT_AND_LOGIC_MAP.md)
5. [Figma設計チェックリスト](05_FIGMA_DESIGN_CHECKLIST.md)
6. [差分・未実装・技術制約](06_GAPS_AND_CONSTRAINTS.md)
7. [ソース照合索引](07_SOURCE_COVERAGE.md)

調査単位：23 route / 2 layout、40条件付き操作面、16ダイアログ＝79画面ID。14 UI部品ファイル（16 export）、21 hooksファイル（22 hook、lib内usePinDraftを含めると23）、20 libファイル。画面数はOS画面/フォーム/段階を分けた数であり、Routerのページ数ではない。

関連R03〜R19/R21/R22。製品の要件・MVP_TASKSの完了条件は変更しない。新規デザインを提案/実装していない。コード変更なし、文書整備と依頼されたRelease配布のみ。
