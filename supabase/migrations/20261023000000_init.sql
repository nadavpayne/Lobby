-- Lobby: initial schema.
-- Access model:
--   * Residents (Phase 2) are Supabase Auth users; RLS below lets them read only their own data.
--   * Businesses are NOT Supabase Auth users: they authenticate with access_slug + PIN against our
--     server, which uses the secret (service-role) key and always filters by that business_id.
--     With RLS enabled and no business policies, the browser can never read business data directly.
--   * All writes (issue / verify / redeem / onboarding) go through server code or SECURITY DEFINER RPCs.

create type public.business_status as enum ('pending', 'active', 'paused');
create type public.redemption_status as enum ('issued', 'redeemed', 'expired');

-- Unguessable slug: 128 random bits as 32 hex chars.
create function public.random_slug() returns text
language sql volatile set search_path = '' as $$
  select replace(gen_random_uuid()::text, '-', '')
$$;

-- Current calendar month in Israel time, e.g. '2026-10'.
create function public.current_period() returns text
language sql stable set search_path = '' as $$
  select to_char(now() at time zone 'Asia/Jerusalem', 'YYYY-MM')
$$;

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  city text not null,
  lat double precision,
  lng double precision,
  invite_slug text not null unique default public.random_slug(),
  committee_name text,
  committee_phone text,
  created_at timestamptz not null default now()
);

create table public.apartments (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  apartment_number text not null,
  unique (building_id, apartment_number)
);

create table public.residents (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null,
  name text,
  apartment_id uuid references public.apartments (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.residents (apartment_id);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  address text not null,
  lat double precision,
  lng double precision,
  contact_name text not null,
  phone text not null,
  email text not null,
  pin_hash text not null,
  access_slug text not null unique default public.random_slug(),
  status public.business_status not null default 'pending',
  agreed_terms_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  discount_percent smallint not null default 10 check (discount_percent between 1 and 100),
  description text not null,
  terms text,
  quantity_limit integer check (quantity_limit > 0),
  starts_at timestamptz,
  ends_at timestamptz check (ends_at is null or starts_at is null or ends_at > starts_at),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.offers (business_id);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  -- 6 chars from the unambiguous alphabet: no 0/O, 1/I/L.
  code text not null check (code ~ '^[A-HJKMNP-Z2-9]{6}$'),
  apartment_id uuid not null references public.apartments (id),
  business_id uuid not null references public.businesses (id),
  offer_id uuid not null references public.offers (id),
  -- Nullable so commission history survives a resident deleting their account.
  resident_id uuid references public.residents (id) on delete set null,
  status public.redemption_status not null default 'issued',
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  redeemed_at timestamptz,
  amount numeric(10, 2) check (amount >= 0),
  discount_amount numeric(10, 2) check (discount_amount >= 0),
  commission_amount numeric(10, 2) check (commission_amount >= 0),
  period text not null default public.current_period() check (period ~ '^\d{4}-\d{2}$'),
  -- A redeemed row must carry its money fields.
  check (status <> 'redeemed' or (redeemed_at is not null and amount is not null
         and discount_amount is not null and commission_amount is not null)),
  -- A business looks codes up by its own id + code.
  unique (business_id, code)
);
create index on public.redemptions (business_id, period);
create index on public.redemptions (apartment_id, period);

-- The core rule: one live (issued or redeemed) code per apartment, per business, per month.
-- Expired codes drop out of the index and free the slot.
create unique index redemptions_one_per_apartment_business_month
  on public.redemptions (apartment_id, business_id, period)
  where status in ('issued', 'redeemed');

-- Push-ready: one row per installed app / browser. Exactly one owner (resident or business).
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references public.residents (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),
  push_token text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  check ((resident_id is null) <> (business_id is null))
);
create index on public.devices (resident_id);
create index on public.devices (business_id);

-- Marks codes past their 24h window as expired. Called before issuing/verifying and on a schedule.
create function public.expire_stale_redemptions() returns integer
language sql volatile security definer set search_path = '' as $$
  with expired as (
    update public.redemptions set status = 'expired'
    where status = 'issued' and expires_at <= now()
    returning 1
  )
  select count(*)::integer from expired
$$;
revoke execute on function public.expire_stale_redemptions() from public, anon, authenticated;

-- Hourly cleanup. Requires the pg_cron extension (enabled by this statement on Supabase).
create extension if not exists pg_cron;
select cron.schedule('expire-stale-redemptions', '0 * * * *', 'select public.expire_stale_redemptions()');

-- ---------- Row Level Security ----------

alter table public.buildings enable row level security;
alter table public.apartments enable row level security;
alter table public.residents enable row level security;
alter table public.businesses enable row level security;
alter table public.offers enable row level security;
alter table public.redemptions enable row level security;
alter table public.devices enable row level security;

-- Residents manage only their own devices; business devices are registered server-side.
create policy "resident manages own devices" on public.devices
  for all to authenticated
  using (resident_id = (select auth.uid()))
  with check (resident_id = (select auth.uid()) and business_id is null);

-- Apartment of the signed-in resident (SECURITY DEFINER so policies don't recurse through residents RLS).
create function public.my_apartment_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select apartment_id from public.residents where id = auth.uid()
$$;

create policy "resident reads self" on public.residents
  for select to authenticated using (id = (select auth.uid()));

create policy "resident reads own apartment" on public.apartments
  for select to authenticated using (id = (select public.my_apartment_id()));

create policy "resident reads own building" on public.buildings
  for select to authenticated using (
    id = (select building_id from public.apartments where id = (select public.my_apartment_id()))
  );

create policy "resident reads own apartment redemptions" on public.redemptions
  for select to authenticated using (apartment_id = (select public.my_apartment_id()));

-- businesses / offers: no client policies yet. Business access is server-side (see header).
-- Phase 2 will expose active offers to residents through a view that omits pin_hash / access_slug.
