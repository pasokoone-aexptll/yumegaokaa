# 現地DBと画像のバックアップ

非公開リポジトリ [yumegaoka の Actions](https://github.com/pasokoone-aexptll/yumegaoka/actions/workflows/field-backup.yml) が毎日03:17（日本時間、開始時刻はGitHubのキューに依存）に実行する。手動再実行は Run workflow。ソースは同リポジトリの ops/backup と .github/workflows/field-backup.yml。ジョブは読み取り用DBログイン・画像専用ログイン・バケット限定R2資格、暗号化用の公開証明書を使用する。

R2の専用バケットの daily/ にCMS暗号化した世代を7日保管する。DBはpublic、app_private、auth、storage、supabase_migrationsを一度のpg_dumpで取得。画像はStorage APIから取得し、DB取得前後の一覧・バージョン・サイズを比較する。クラウドではアップロード後に同じオブジェクトをダウンロードして暗号文の一致を確認する。実際の復号・DB復元は下記の手順で独立して検証する。Supabaseのサービス設定や外部サービスの鍵は別管理。

復号鍵 recovery.key と証明書 backup.crt の保管場所は Mac の `~/Library/Application Support/yumegaoka-backup/`。別媒体にも安全に控える。CLIで復元するMacではDocker Desktopを起動する。

特定世代を取り出すにはリポジトリから次のように実行する。出力先は新規ディレクトリに限る。

```sh
python3 scripts/field-backup.py --restore 'daily/<世代名>.cms' --recover-to '/private/tmp/yumegaoka-recovery'
```

検証済みのdb.dump、objects.json、画像実体が出力される。画像の元のバケットとパスはobjects.jsonのbucket_idとname。運用環境の切替時は別のSupabaseプロジェクトで標準サービス・ロールと拡張を準備し、DBの所有者・権限、Storage API経由での画像再配置、ログインと画像取得を確認してから接続先を切り替える。平文で書き出した復旧データは作業後に取り除く。
