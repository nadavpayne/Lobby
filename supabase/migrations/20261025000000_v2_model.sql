-- V2 data model: account roles, categories table, branches, CRM pipelines, per-business commission,
-- offer approval, invoices, customer notes and a monthly commissions view.
-- Roles: a resident (or committee member) is a row in residents; admin and business_owner are rows in
-- user_roles. The app routes each account to /app, /biz or /admin from these, never from a toggle.

-- 'lead' must exist before 'pending'. ('pending' is shown as "negotiating" in the admin pipeline.)
alter type public.business_status add value if not exists 'lead' before 'pending';

-- ---------- Roles ----------

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'business_owner')),
  business_id uuid references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((role = 'business_owner') = (business_id is not null)),
  unique nulls not distinct (user_id, role, business_id)
);
create index on public.user_roles (business_id);
alter table public.user_roles enable row level security;
create policy "user reads own roles" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------- Categories ----------
-- Keys match src/lib/businesses/categories.ts; icon = lucide icon name.

create table public.categories (
  slug text primary key check (slug ~ '^[a-z_]+$'),
  name text not null,
  icon text not null,
  sort smallint not null default 0,
  active boolean not null default true
);
insert into public.categories (slug, name, icon, sort) values
  ('food', 'אוכל', 'utensils', 10),
  ('bakery', 'מאפייה', 'croissant', 20),
  ('grocery', 'מכולת', 'shopping-basket', 30),
  ('home', 'לבית', 'sofa', 40),
  ('beauty', 'ביוטי', 'sparkles', 50),
  ('kids', 'ילדים', 'baby', 60),
  ('fitness', 'ספורט', 'dumbbell', 70),
  ('health', 'בריאות', 'heart-pulse', 80),
  ('pets', 'חיות מחמד', 'paw-print', 90),
  ('services', 'שירותים', 'wrench', 100),
  ('other', 'אחר', 'store', 110);
alter table public.categories enable row level security;
create policy "anyone reads categories" on public.categories for select to anon, authenticated using (true);

alter table public.businesses
  add constraint businesses_category_fkey foreign key (category) references public.categories (slug),
  add column commission_percent numeric(4, 2) not null default 5 check (commission_percent between 0 and 100),
  add column description text,
  add column logo_url text,
  add column cover_url text,
  -- {"sun": [["08:00","20:00"]], ..., "sat": []}
  add column hours jsonb;

-- ---------- Branches ----------

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  address text not null,
  city text not null,
  lat double precision,
  lng double precision,
  hours jsonb,
  created_at timestamptz not null default now()
);
create index on public.branches (business_id);
alter table public.branches enable row level security;

alter table public.redemptions add column branch_id uuid references public.branches (id) on delete set null;

-- ---------- Offers ----------

alter table public.offers
  add column title text,
  add column image_url text,
  add column category text references public.categories (slug),
  -- Set when the Lobby operator approves the offer; null = waiting for review.
  add column approved_at timestamptz;
update public.offers set approved_at = created_at, title = discount_percent || '% הנחה';

-- ---------- Buildings: committee pipeline ----------
-- A lead is a building we're talking to; committee_name / committee_phone are its contact person.

alter table public.buildings
  add column name text,
  add column pipeline text not null default 'joined' check (pipeline in ('lead', 'contacted', 'joined'));

-- ---------- Billing ----------

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  commission_total numeric(10, 2) not null check (commission_total >= 0),
  status text not null default 'open' check (status in ('open', 'paid')),
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  check ((status = 'paid') = (paid_at is not null)),
  unique (business_id, period)
);
alter table public.invoices enable row level security;

-- Redeemed totals per business per month. security_invoker: obeys the caller's RLS (server-only today).
create view public.commissions_monthly with (security_invoker = true) as
  select business_id, period,
         count(*)::integer as redemptions,
         sum(amount) as gmv,
         sum(discount_amount) as discount_total,
         sum(commission_amount) as commission_total
  from public.redemptions
  where status = 'redeemed'
  group by business_id, period;
revoke all on public.commissions_monthly from anon, authenticated;

-- ---------- Business CRM: notes and tags per customer ----------

create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  resident_id uuid not null references public.residents (id) on delete cascade,
  note text not null default '',
  tags text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (business_id, resident_id)
);
alter table public.customer_notes enable row level security;
