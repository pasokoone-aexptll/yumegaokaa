# 現地DBと画像のバックアップ

Macのログインユーザーの LaunchAgent `jp.yumegaoka.field-backup` が毎日03:15（Macの現地時間）に実行する。Docker Desktop、Supabase CLIのログイン、ネットワーク接続が必要。ジョブのコピー、資格情報、公開証明書・復号鍵、実行ログは `~/Library/Application Support/yumegaoka-backup/`。スクリプトの変更時は同フォルダの `runner/scripts/` にも反映する。復号鍵と証明書は利用者の安全なオフライン保管先にも控える。R2に復号鍵は置かない。

R2の専用バケットの `daily/` にCMS暗号化した世代を保存する。DBはpublic、app_private、auth、storage、supabase_migrationsを一度のpg_dumpで取得。画像はStorage APIから取得し、DB取得の前後で一覧・バージョン・サイズを比較する。アップロード後に同じオブジェクトを再取得し、ネットワークのない一時PostgreSQLで復元、認証ユーザー・投稿数と画像参照・ハッシュを確認する。実行結果はdaily.log、エラーはdaily-errors.log。Supabaseのサービス設定や外部サービスの鍵は別管理。

特定世代を取り出すにはリポジトリから次のように実行する。出力先は新規ディレクトリに限る。

```sh
python3 scripts/field-backup.py --restore 'daily/<世代名>.cms' --recover-to '/private/tmp/yumegaoka-recovery'
```

検証済みのdb.dump、objects.json、画像実体が出力される。画像の元のバケットとパスはobjects.jsonのbucket_idとname。運用環境の切替時は別のSupabaseプロジェクトで標準サービス・ロールと拡張を準備し、DBの所有者・権限、Storage API経由での画像再配置、ログインと画像取得を確認してから接続先を切り替える。平文で書き出した復旧データは作業後に取り除く。
