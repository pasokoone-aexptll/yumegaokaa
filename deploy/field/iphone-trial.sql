-- Field project only. Run once with psql -v trial_account=<verified target UUID>.
begin;
insert into app_private.streets(id,name) values('11111111-1111-4111-8111-111111111111','池袋');
insert into app_private.areas(street_id,version,polygon)
values('11111111-1111-4111-8111-111111111111',1,
 extensions.st_transform(extensions.st_geomfromtext('POLYGON((139.700 35.725,139.720 35.725,139.720 35.738,139.700 35.738,139.700 35.725))',4326),
 '+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'));

insert into app_private.members(account_id) select id from auth.users where id=:'trial_account'::uuid on conflict do nothing;
insert into app_private.profiles(account_id,display_name) select id,'現地テスター' from auth.users where id=:'trial_account'::uuid on conflict do nothing;
create table app_private.field_trial_grant(tag_id uuid primary key references app_private.tags, account_id uuid not null references auth.users, expires_at timestamptz not null);
create or replace function app_private.guard_field_trial() returns trigger language plpgsql set search_path='' as $$
begin
 if new.tag_id='14fdc906-3ff4-4576-a212-35c42642dd49' and not exists(select 1 from app_private.field_trial_grant g where g.tag_id=new.tag_id and g.account_id=new.account_id and g.expires_at>clock_timestamp()) then raise exception 'inactive_tag'; end if;
 return new;
end; $$;
create trigger field_trial_prepare before insert on app_private.attempts for each row execute function app_private.guard_field_trial();
create trigger field_trial_commit before update of state on app_private.attempts for each row when(new.state='committed') execute function app_private.guard_field_trial();
insert into app_private.tags(id,street_id,active) values('14fdc906-3ff4-4576-a212-35c42642dd49','11111111-1111-4111-8111-111111111111',true);
insert into app_private.field_trial_grant select '14fdc906-3ff4-4576-a212-35c42642dd49',id,'2026-11-12 09:52:45+09' from auth.users where id=:'trial_account'::uuid;
do $$ begin if (select count(*) from app_private.field_trial_grant)<>1 then raise exception 'missing grant'; end if; end $$;
commit;
