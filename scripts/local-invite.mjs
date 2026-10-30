import pg from "pg";
const email = process.argv[2];
if (!email) throw Error("メールアドレスを指定してください。");
const c = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
await c.connect();
const r = await c.query(
  "insert into app_private.members(account_id) select id from auth.users where lower(email)=lower($1) on conflict(account_id) do update set active=true returning account_id",
  [email],
);
console.log(
  r.rowCount
    ? "ローカル開発用の招待登録が完了しました。"
    : "先にアプリで確認コードを送信してください。",
);
await c.end();
