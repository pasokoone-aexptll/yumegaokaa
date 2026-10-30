import pg from 'pg';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const filename=process.argv[2];
if(!filename||!/^\d+_[a-z_]+\.sql$/.test(filename))throw Error('Specify a migration filename.');
const [version,...parts]=filename.replace(/\.sql$/,'').split('_'),name=parts.join('_');
const sql=await readFile(path.join('supabase/migrations',filename),'utf8');
if(!/^begin;[\s\S]*commit;\s*$/i.test(sql.trim()))throw Error('Expected a single transaction migration.');
const body=sql.trim().replace(/^begin;/i,'').replace(/commit;$/i,'');
const client=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});
await client.connect();
try{
 await client.query('begin');
 await client.query("select pg_advisory_xact_lock(hashtext('yumegaoka.local.migrations'))");
 const existing=await client.query('select version from supabase_migrations.schema_migrations where version=$1',[version]);
 if(existing.rowCount){await client.query('rollback');console.log('Already recorded:',filename);}
 else{
  await client.query(body);
  await client.query('insert into supabase_migrations.schema_migrations(version,name,statements) values($1,$2,$3)',[version,name,[body]]);
  await client.query('commit');console.log('Applied and recorded local migration:',filename);
 }
}catch(e){await client.query('rollback');throw e;}finally{await client.end();}
