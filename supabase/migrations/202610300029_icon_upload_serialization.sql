begin;
create or replace function public.street_icon_access(object_name text, writing boolean default false)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare item app_private.street_icons%rowtype;
begin
 if not public.avatar_member() then return false;end if;
 if writing then
  -- Keep write authorization and metadata insertion in one transaction with
  -- removal/publication. A request waiting behind removal must recheck it.
  select * into item from app_private.street_icons
   where path=object_name and owner_id=auth.uid() for update;
  if not found then return false;end if;
  return item.removed_at is null and not item.active
    and exists(select 1 from app_private.members where account_id=item.owner_id and active);
 end if;
 return exists(select 1 from app_private.street_icons i join app_private.members m on m.account_id=i.owner_id
  where i.path=object_name and i.removed_at is null and m.active and (i.active or i.owner_id=auth.uid()));
end $$;
revoke all on function public.street_icon_access(text,boolean) from public,anon;
grant execute on function public.street_icon_access(text,boolean) to authenticated;
commit;
