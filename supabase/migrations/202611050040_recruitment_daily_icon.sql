begin;
alter function app_private.recruitment_view(uuid,uuid,timestamptz) rename to recruitment_without_icon;
create function app_private.recruitment_view(rid uuid, actor uuid, t timestamptz)
returns jsonb language plpgsql set search_path='' as $$
declare
  pin jsonb := app_private.recruitment_without_icon(rid, actor, t);
  author uuid := (pin->>'author_id')::uuid;
  street uuid;
  today date := (t at time zone 'Asia/Tokyo')::date;
  icon_path text;
begin
  if pin is null then return null; end if;
  select v.street_id into street from app_private.recruitments r
    join app_private.visits v on v.id=r.visit_id where r.id=rid;
  select i.path into icon_path from app_private.daily_street_icons a
    left join (app_private.street_icons i join app_private.members m on m.account_id=i.owner_id and m.active)
      on i.id=a.icon_id and i.active and i.removed_at is null
    where a.account_id=author and a.street_id=street and a.day=today;
  if not found then
    icon_path := app_private.my_daily_icon(author,street,t);
  end if;
  return pin || jsonb_build_object('icon_path',icon_path,'icon_until',(today+1)::timestamp at time zone 'Asia/Tokyo');
end $$;
revoke all on function app_private.recruitment_view(uuid,uuid,timestamptz) from public,anon,authenticated;
commit;
