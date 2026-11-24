// Read-only inventory. Never print account IDs, post content, credentials or URLs.
import pg from "pg";

const db = new pg.Client({
  connectionString: process.env.TEST_DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  connectionTimeoutMillis: 5000,
});
try {
  await db.connect();
  await db.query("begin isolation level repeatable read read only");
  await db.query("set local statement_timeout = '10s'");
  const counts = (await db.query(`select
    (select count(*) from app_private.messages where author_id is null and body is not null)::int as unattributed_messages_with_body,
    (select count(*) from app_private.messages p join app_private.members m on m.account_id=p.author_id where m.withdrawn_at is not null and p.body is not null)::int as withdrawn_messages_with_body,
    (select count(*) from app_private.denshin_pins p join app_private.members m on m.account_id=p.owner_id where m.withdrawn_at is not null and p.body <> '削除済み')::int as withdrawn_pins_with_body,
    (select count(*) from app_private.events e join app_private.members m on m.account_id=e.host_id where m.withdrawn_at is not null)::int as withdrawn_legacy_events,
    (select count(*) from app_private.recruitments r join app_private.visits v on v.id=r.visit_id join app_private.members m on m.account_id=v.account_id where m.withdrawn_at is not null and r.title is not null)::int as withdrawn_legacy_recruitments_with_title,
    (select count(*) from app_private.reports r join app_private.members m on m.account_id=r.subject_id where m.withdrawn_at is not null)::int as reports_about_withdrawn_members,
    (select count(*) from app_private.account_cleanup_jobs)::int as pending_account_cleanup_jobs
  `)).rows[0];
  const migration = await db.query("select exists(select 1 from supabase_migrations.schema_migrations where version='202611250057') as applied");
  console.log(JSON.stringify({
    scope: "Selected database only; not backup, Auth deletion, storage or device verification",
    migration057Applied: migration.rows[0].applied,
    counts,
    note: "Unattributed content is not proof of ownership. Do not bulk-delete it from these counts. Zero counts are not a compliance verdict.",
  }, null, 2));
} catch (error) {
  console.error("Withdrawal inventory failed:", error.code ?? "unknown_error");
  process.exitCode = 1;
} finally {
  await db.query("rollback").catch(() => {});
  await db.end();
}
