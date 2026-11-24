import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const exports = {};
new Function(
  "exports",
  ts.transpileModule(
    readFileSync("apps/mobile/src/lib/registrationDeclaration.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(exports);
test("age bands and guardian declaration fail closed", () => {
  const p = {
    available: true,
    version: "test-v1",
    terms_url: "https://example.com/terms",
    privacy_url: "https://example.com/privacy",
  };
  const fn = exports.registrationDeclaration;
  assert.equal(fn("18_plus", false, p, false), null);
  for (const age of [undefined, "under_13", "invalid"])
    assert.equal(fn(age, true, p), null);
  assert.equal(fn("13_17", false, p), null);
  assert.equal(fn("18_plus", false, { available: false }), null);
  assert.equal(
    fn("18_plus", false, { ...p, terms_url: "http://example.com" }),
    null,
  );
  assert.equal(fn("13_17", true, p, true).guardian_declared, true);
  assert.equal(fn("18_plus", true, p, true).guardian_declared, false);
});
test("registration declaration: public API validation, atomicity, retry, withdrawal, privacy (ROLLBACK)", async () => {
  const db = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await db.connect();
  try {
    await db.query("begin");
    const migration = readFileSync(
      "supabase/migrations/202611250058_registration_declaration.sql",
      "utf8",
    );
    await db.query(migration.replace(/^begin;/, "").replace(/commit;\s*$/, ""));
    const issuer = randomUUID(),
      teen = randomUUID(),
      adult = randomUUID(),
      session = randomUUID(),
      session2 = randomUUID();
    await db.query("insert into auth.users(id) values($1),($2),($3)", [
      issuer,
      teen,
      adult,
    ]);
    await db.query("insert into app_private.members(account_id) values($1)", [
      issuer,
    ]);
    await db.query(
      "insert into auth.sessions(id,user_id) values($1,$2),($3,$4)",
      [session, teen, session2, adult],
    );
    const code = randomUUID(),
      code2 = randomUUID();
    await db.query(
      "insert into app_private.invitations(issuer,code_hash) values($1,sha256(convert_to($2,'UTF8'))),($1,sha256(convert_to($3,'UTF8')))",
      [issuer, code, code2],
    );
    const claims = async (id, sid) =>
      db.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({ sub: id, session_id: sid, role: "authenticated" }),
      ]);
    const rpc = async (op, p = {}) => {
      await db.query("set local role authenticated");
      const r = await db.query("select public.street_api($1,$2) result", [
        op,
        p,
      ]);
      await db.query("reset role");
      return r.rows[0].result;
    };
    const rejected = async (fn, pattern) => {
      await db.query("savepoint bad_input");
      await assert.rejects(fn, pattern);
      await db.query("rollback to savepoint bad_input");
      await db.query("reset role");
    };
    await claims(teen, session);
    assert.equal((await rpc("registration_policy")).available, false);
    const valid = {
      code,
      age_band: "13_17",
      guardian_declared: true,
      policy_version: "test-v1",
    };
    await rejected(() => rpc("invite_accept", valid), /conflict/);
    await db.query(
      "insert into app_private.registration_policy(version,terms_url,privacy_url) values('test-v1','https://example.com/terms','https://example.com/privacy')",
    );
    assert.equal((await rpc("registration_policy")).version, "test-v1");
    for (const p of [
      { code },
      { ...valid, age_band: "under_13" },
      { ...valid, guardian_declared: false },
      { ...valid, guardian_declared: "true" },
    ])
      await rejected(() => rpc("invite_accept", p), /invalid_input/);
    await rejected(
      () => rpc("invite_accept", { ...valid, policy_version: "stale" }),
      /conflict/,
    );
    await rejected(
      () => rpc("invite_accept", { ...valid, code: "invalid" }),
      /invalid_input/,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from app_private.registration_declarations where account_id=$1",
          [teen],
        )
      ).rows[0].n,
      0,
    );
    assert.equal((await rpc("invite_accept", valid)).accepted, true);
    const record = (
      await db.query(
        "select * from app_private.registration_declarations where account_id=$1",
        [teen],
      )
    ).rows[0];
    assert.equal(record.method, "self_declaration");
    assert.equal(record.guardian_declared, true);
    assert.equal((await rpc("invite_accept", { code })).accepted, true);
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from app_private.registration_declarations where account_id=$1",
          [teen],
        )
      ).rows[0].n,
      1,
    );
    await rejected(async () => {
      await db.query("set local role authenticated");
      await db.query("select * from app_private.registration_declarations");
    }, /permission denied/);
    await claims(adult, session2);
    assert.equal(
      (
        await rpc("invite_accept", {
          code: code2,
          age_band: "18_plus",
          guardian_declared: false,
          policy_version: "test-v1",
        })
      ).accepted,
      true,
    );
    await db.query(
      "update app_private.members set withdrawn_at=now(),active=false where account_id=$1",
      [teen],
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from app_private.registration_declarations where account_id=$1",
          [teen],
        )
      ).rows[0].n,
      0,
    );
  } finally {
    await db.query("rollback").catch(() => {});
    await db.end();
  }
});
