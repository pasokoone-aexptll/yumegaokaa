begin read only;
set local statement_timeout='15s';
select jsonb_build_object(
'functions',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select 'function' kind,n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' name,
 md5(pg_get_functiondef(p.oid)) fingerprint,p.prosecdef as security_definer,p.proconfig::text as settings,p.proacl::text as acl
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='app_private' or (n.nspname='public' and p.proname in ('street_api','avatar_member','street_icon_access','can_receive_street'))
order by name) x),
'policies',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select schemaname,tablename,policyname,roles,cmd,md5(coalesce(qual,'')||'|'||coalesce(with_check,'')) fingerprint
from pg_policies where schemaname='app_private' or (schemaname='storage' and policyname like any(array['avatar%','street_icon%'])) order by 1,2,3) x),
'tables',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select n.nspname||'.'||c.relname name,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text acl
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app_private' and c.relkind='r' order by 1) x),
'constraints',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select conrelid::regclass::text relation,conname,contype,convalidated,md5(pg_get_constraintdef(oid)) fingerprint
from pg_constraint where connamespace='app_private'::regnamespace order by 1,2) x),
'migrations',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select version from supabase_migrations.schema_migrations order by version) x)) as inventory;
rollback;
