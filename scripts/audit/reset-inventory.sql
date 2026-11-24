begin read only;
set local statement_timeout='15s';
select jsonb_build_object(
 'auth_users',(select count(*) from auth.users),
 'auth_sessions',(select count(*) from auth.sessions),
 'members',(select count(*) from app_private.members),
 'operators',(select count(*) from app_private.operators),
 'profiles',(select count(*) from app_private.profiles),
 'messages',(select count(*) from app_private.messages),
 'pins',(select count(*) from app_private.denshin_pins),
 'visits',(select count(*) from app_private.visits),
 'invitations',(select count(*) from app_private.invitations),
 'reports',(select count(*) from app_private.reports),
 'cleanup_jobs',(select count(*) from app_private.account_cleanup_jobs),
 'storage_objects',(select count(*) from storage.objects),
 'street_icons',(select count(*) from app_private.street_icons),
 'streets',(select count(*) from app_private.streets),
 'areas',(select count(*) from app_private.areas),
 'tags',(select count(*) from app_private.tags),
 'placements',(select count(*) from app_private.placements),
 'sticker_drafts',(select count(*) from app_private.sticker_drafts),
 'area_publications',(select count(*) from app_private.area_publications),
 'withdrawn_members',(select count(*) from app_private.members where withdrawn_at is not null),
 'invalid_constraints',(select count(*) from pg_constraint where connamespace='app_private'::regnamespace and not convalidated),
 'deadlocks_since_stats_reset',(select deadlocks from pg_stat_database where datname=current_database()),
 'stats_reset',(select stats_reset from pg_stat_database where datname=current_database())
) as counts;
rollback;
