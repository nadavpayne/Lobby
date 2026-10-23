-- Failed PIN / code attempts per business, for rate limiting the verification terminal.
-- Server-only (RLS on, no policies).
create table public.business_attempts (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null check (kind in ('pin', 'code')),
  created_at timestamptz not null default now()
);
create index on public.business_attempts (business_id, kind, created_at);
alter table public.business_attempts enable row level security;

-- Keep the table small: drop attempts older than a day, daily.
select cron.schedule('prune-business-attempts', '30 3 * * *',
  $$delete from public.business_attempts where created_at < now() - interval '1 day'$$);
