begin;
do $$
declare
  street constant uuid := '22222222-2222-4222-8222-222222222222';
  walker uuid;
  reader_id uuid;
  t timestamptz := clock_timestamp();
begin
  if not exists(select 1 from app_private.streets where id=street and name='審査デモの街') then raise exception 'Review project required'; end if;
  select id into strict walker from auth.users where email='sample-walker@example.test';
  select id into strict reader_id from auth.users where email='sample-reader@example.test';
  insert into app_private.members(account_id) values(walker),(reader_id) on conflict do nothing;
  insert into app_private.profiles(account_id,display_name) values(walker,'散歩のひと'),(reader_id,'本を読むひと') on conflict do nothing;
  if not exists(select 1 from app_private.messages where author_id=reader_id and street_id=street and created_at>t-interval '30 days') then
    insert into app_private.messages(author_id,street_id,body) values(reader_id,street,'広場のベンチで本を読んでいます。');
  end if;
  if not exists(select 1 from app_private.denshin_pins where owner_id=walker and street_id=street and expires_at>t) then
    insert into app_private.denshin_pins(owner_id,street_id,body,longitude,latitude,recruiting,capacity,created_at,expires_at)
      values(walker,street,'広場をひとまわり散歩しませんか。',139.8335,36.0002,true,4,t,t+interval '24 hours');
  end if;
end $$;
commit;
