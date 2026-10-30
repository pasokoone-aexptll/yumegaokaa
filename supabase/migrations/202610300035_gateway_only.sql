-- Client subscriptions are admitted only by the account-limited gateway.
-- Defense in depth: even if an old Realtime service is accidentally started,
-- authenticated clients cannot read private broadcasts.
drop policy if exists street_broadcast_read on realtime.messages;
