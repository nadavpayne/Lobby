-- Sign-in is by email code for now; residents add (and later verify) a phone before public launch.
-- The unique constraint still applies to phones that are set.
alter table public.residents alter column phone drop not null;
