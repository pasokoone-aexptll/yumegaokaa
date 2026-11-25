-- The review project authenticates its two pre-created accounts using passwords.
-- Keep the same ticket, subject, freshness checks and deletion code as the app.
do $setup$
declare definition text;
begin
 if not exists(select 1 from app_private.streets where id='22222222-2222-4222-8222-222222222222' and name='審査デモの街') then raise exception 'Review project required'; end if;
 definition:=pg_get_functiondef('app_private.account_api(text,jsonb)'::regprocedure);
 if position('a->>''method''=''password''' in definition)>0 then return; end if;
 if position('a->>''method''=''otp''' in definition)=0 then raise exception 'Review withdrawal definition changed'; end if;
 execute replace(definition,'a->>''method''=''otp''','a->>''method''=''password''');
end $setup$;
