begin;
-- Count only new accepted visits after this release, including existing accounts.
-- No historical visits or locations are copied into this cumulative counter.
create table app_private.visit_counts (
 account_id uuid not null references app_private.members(account_id) on delete cascade,
 street_id uuid not null references app_private.streets(id),
 total bigint not null check(total>0),
 primary key(account_id,street_id)
);
create function app_private.count_new_visit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into app_private.visit_counts(account_id,street_id,total) values(new.account_id,new.street_id,1)
 on conflict(account_id,street_id) do update set total=app_private.visit_counts.total+1;
 return new;
end $$;
create trigger count_new_visit after insert on app_private.visits for each row execute function app_private.count_new_visit();
create function app_private.erase_visit_counts() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.withdrawn_at is not null then delete from app_private.visit_counts where account_id=new.account_id;end if;
 return new;
end $$;
create trigger erase_visit_counts after update of withdrawn_at on app_private.members for each row execute function app_private.erase_visit_counts();

alter function app_private.street_api(text,jsonb) rename to before_native_ui_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid; result jsonb; query text;
begin
 if operation not in ('visit_count','block_lookup','block_list') then return app_private.before_native_ui_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active and withdrawn_at is null for update;
 if not found then raise exception 'membership_required';end if;
 if operation='visit_count' then
  return jsonb_build_object('total',coalesce((select total from app_private.visit_counts where account_id=uid and street_id=(payload->>'street_id')::uuid),0));
 elsif operation='block_lookup' then
  query:=trim(leading '@' from btrim(payload->>'name'));
  if query is null or length(query)<1 or length(query)>50 then raise exception 'invalid_input';end if;
  if(select count(*) from app_private.request_limits where account_id=uid and kind='block_lookup' and at>clock_timestamp()-interval '1 minute')>=15 then raise exception 'rate_limited';end if;
  insert into app_private.request_limits values(uid,'block_lookup',clock_timestamp());
  select coalesce(jsonb_agg(to_jsonb(matches)),'[]'::jsonb) into result from (
   select p.account_id,p.display_name,p.avatar_path,p.avatar_updated_at
   from app_private.profiles p join app_private.members m on m.account_id=p.account_id
   where p.account_id<>uid and m.active and m.withdrawn_at is null and lower(p.display_name)=lower(query)
   order by p.account_id limit 20
  ) matches;
 else
  select coalesce(jsonb_agg(jsonb_build_object('account_id',b.target_id,'display_name',coalesce(p.display_name,'名前未設定'),'avatar_path',p.avatar_path,'avatar_updated_at',p.avatar_updated_at)),'[]'::jsonb)
   into result from app_private.blocks b left join app_private.profiles p on p.account_id=b.target_id where b.owner_id=uid;
 end if;
 return jsonb_build_object('items',result);
end $$;
revoke all on app_private.visit_counts from public,anon,authenticated;
revoke all on function app_private.count_new_visit(), app_private.erase_visit_counts(), app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
