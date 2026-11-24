begin read only;
set local statement_timeout='15s';
select jsonb_build_object(
 'active_members_without_current_consent',(select count(*) from app_private.members m where active and not app_private.has_current_consent(account_id)),
 'profiles_without_member',(select count(*) from app_private.profiles p left join app_private.members m using(account_id) where m.account_id is null),
 'avatars_missing_object',(select count(*) from app_private.profiles p where p.avatar_path is not null and not exists(select 1 from storage.objects o where bucket_id='avatars' and name=p.avatar_path)),
 'active_icons_missing_object',(select count(*) from app_private.street_icons i where active and removed_at is null and not exists(select 1 from storage.objects o where bucket_id='street-icons' and name=i.path)),
 'avatars_without_profile_reference',(select count(*) from storage.objects o where bucket_id='avatars' and not exists(select 1 from app_private.profiles p where p.avatar_path=o.name)),
 'icons_without_row',(select count(*) from storage.objects o where bucket_id='street-icons' and not exists(select 1 from app_private.street_icons i where i.path=o.name)),
 'expired_messages_beyond_cleanup_window',(select count(*) from app_private.messages where created_at<clock_timestamp()-interval '31 days'),
 'unpublished_active_tags',(select count(*) from app_private.tags t where active and not retired and not exists(select 1 from app_private.placements p where p.tag_id=t.id)),
 'authenticated_private_schema_usage',has_schema_privilege('authenticated','app_private','USAGE'),
 'anon_private_schema_usage',has_schema_privilege('anon','app_private','USAGE'),
 'authenticated_private_tables_readable',(select count(*) from pg_class c where relnamespace='app_private'::regnamespace and relkind='r' and has_table_privilege('authenticated',c.oid,'SELECT')),
 'anon_private_tables_readable',(select count(*) from pg_class c where relnamespace='app_private'::regnamespace and relkind='r' and has_table_privilege('anon',c.oid,'SELECT'))
) as checks;
rollback;
