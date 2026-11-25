-- Only run on the linked denshin-app-review project, outside shared migrations.
begin;
do $$ begin
 if not exists(select 1 from app_private.streets where id='22222222-2222-4222-8222-222222222222' and name='審査デモの街')
 then raise exception 'Missing review installation'; end if;
end $$;
insert into app_private.areas(street_id,version,polygon)
values ('22222222-2222-4222-8222-222222222222',1,extensions.st_makeenvelope(-500,-500,500,500))
on conflict do nothing;
insert into app_private.tags(id,street_id,active)
values ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222',true)
on conflict do nothing;
insert into app_private.placements(tag_id,street_id,title,longitude,latitude,installed_at,revision)
values ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','審査用入口',139.8333333,36,now(),1)
on conflict do nothing;
commit;
