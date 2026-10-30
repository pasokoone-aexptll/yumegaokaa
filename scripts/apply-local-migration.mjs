import pg from 'pg';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const name=process.argv[2];
if(!name||!/^\d+_[a-z_]+\.sql$/.test(name))throw Error('Specify a migration filename.');
const client=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});
await client.connect();
try{await client.query(await readFile(path.join('supabase/migrations',name),'utf8'));console.log('Applied local migration:',name);}finally{await client.end();}
