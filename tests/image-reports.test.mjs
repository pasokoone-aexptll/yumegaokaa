import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import pg from "pg";

test("reported profile photos and anonymous pool images stay tied to the displayed version", async () => {
  const db = new pg.Client({connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"});
  await db.connect();
  const [owner, reporter, operator, street] = Array.from({length: 4}, randomUUID);
  const sessions = new Map();
  const query = async (sql, args) => (await db.query(sql, args)).rows[0];
  const as = async (uid, aal = "aal1") => {
    await db.query("reset role");
    await query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({sub: uid, session_id: sessions.get(uid), role: "authenticated", aal}),
    ]);
    await db.query("set local role authenticated");
  };
  const rpc = async (operation, payload = {}) =>
    (await query("select public.street_api($1,$2) result", [operation,payload])).result;
  const denied = async (call, pattern) => {
    await db.query("savepoint denied");
    await assert.rejects(call, pattern);
    await db.query("rollback to savepoint denied");
  };
  async function store(bucket, path) {
    await db.query("reset role");
    await db.query("insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3)", [
      bucket, path, {size: 20,mimetype:"image/jpeg"},
    ]);
  }
  try {
    await db.query("begin");
    const dir = "supabase/migrations";
    for (const file of readdirSync(dir).filter(f => /^2026112500(58|59|60|61|62)_/.test(f)).sort()) {
      const applied = await query("select 1 from supabase_migrations.schema_migrations where version=$1",[file.split("_")[0]]);
      if (!applied) await db.query(readFileSync(dir+"/"+file,"utf8").replace(/^begin;/,"").replace(/commit;\s*$/,""));
    }
    for (const id of [owner, reporter, operator]) {
      const sid = randomUUID();
      sessions.set(id,sid);
      await db.query("insert into auth.users(id) values($1)",[id]);
      await db.query("insert into auth.sessions(id,user_id) values($1,$2)",[sid,id]);
      await db.query("insert into app_private.members(account_id) values($1)",[id]);
      await db.query("insert into app_private.registration_declarations(account_id,age_band,guardian_declared,policy_version,terms_accepted) select $1,'18_plus',false,version,true from app_private.registration_policy",[id]);
    }
    const factor = randomUUID();
    await db.query("insert into app_private.operators(account_id) values($1)",[operator]);
    await db.query("insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values($1,$2,'totp','verified',now(),now())",[factor,operator]);
    await db.query("update auth.sessions set factor_id=$1,aal='aal2' where id=$2",[factor,sessions.get(operator)]);
    await db.query("insert into app_private.streets(id,name) values($1,'Test street')",[street]);

    await as(owner);
    await rpc("profile_save",{display_name:"Test"});
    const upload = async () => {
      await as(owner);
      const path = (await rpc("profile_get")).avatar_upload_path;
      assert.ok(!path.endsWith("/avatar.jpg"));
      assert.equal((await query("select public.avatar_pending($1) ok",[path])).ok,true);
      await store("avatars",path);
      await as(owner);
      assert.equal((await rpc("profile_avatar_set",{path})).avatar_path,path);
      assert.equal((await query("select public.avatar_pending($1) ok",[path])).ok,false);
      return path;
    };
    const uploadIcon = async () => {
      await as(owner);
      const {id, upload_path} = await rpc("street_icon_prepare",{street_id:street});
      await store("street-icons",upload_path);
      await as(owner);
      await rpc("street_icon_publish",{id,street_id:street});
      return upload_path;
    };
    const avatar = await upload(), icon = await uploadIcon();
    const fileReport = async (kind,path) => {
      const result = await rpc("report_create",{target_kind:kind,path,reason:"other"});
      assert.deepEqual(Object.keys(result),["id"]);
      return result.id;
    };
    await as(reporter);
    const ar = await fileReport("profile_image",avatar);
    assert.equal(await fileReport("profile_image",avatar),ar);
    const ir = await fileReport("street_image",icon);
    await denied(() => rpc("operator_image_delete",{id:ir}),/membership_required|unauthorized/);
    const newAvatar = await upload(), newIcon = await uploadIcon();
    await as(reporter);
    for (const [bucket,path] of [["avatars",avatar],["street-icons",icon]]) {
      assert.equal((await query("select count(*)::int n from storage.objects where bucket_id=$1 and name=$2",[bucket,path])).n,0);
    }
    await as(operator);
    await denied(() => rpc("operator_image_delete",{id:ar}),/unauthorized/);
    await as(operator,"aal2");
    const list = (await rpc("operator_reports")).items;
    assert.equal(list.find(r => r.id === ar)?.evidence.path,avatar);
    assert.equal(list.find(r => r.id === ir)?.evidence.path,icon);
    for (const [bucket,path,id] of [["avatars",avatar,ar],["street-icons",icon,ir]]) {
      assert.equal((await query("select count(*)::int n from storage.objects where bucket_id=$1 and name=$2",[bucket,path])).n,1);
      await rpc("operator_image_delete",{id});
      await rpc("operator_image_delete",{id});
      assert.equal((await query("select count(*)::int n from storage.objects where bucket_id=$1 and name=$2",[bucket,path])).n,0);
    }
    await as(owner);
    assert.equal((await rpc("profile_get")).avatar_path,newAvatar);
    assert.equal((await rpc("street_icon_get",{street_id:street})).contribution_path,newIcon);
    await as(reporter);
    const activeAvatar = await fileReport("profile_image",newAvatar);
    const activeIcon = await fileReport("street_image",newIcon);
    await as(operator,"aal2");
    for (const id of [activeAvatar,activeIcon]) await rpc("operator_image_delete",{id});
    await as(owner);
    assert.equal((await rpc("profile_get")).avatar_path,null);
    assert.equal((await rpc("street_icon_get",{street_id:street})).contribution_path,null);
    await db.query("reset role");
    await db.query("update app_private.members set active=false,withdrawn_at=now() where account_id=$1",[reporter]);
    assert.equal((await query("select count(*)::int n from app_private.reports where reporter=$1",[reporter])).n,0);
  } finally {
    await db.query("rollback");
    await db.end();
  }
});
