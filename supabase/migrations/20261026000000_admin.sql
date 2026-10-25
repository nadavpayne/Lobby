-- Admin CRM: blocked residents, business leads (no terms accepted yet), hero banners, featured offers,
-- and Lobby announcements to everyone / a city / a building (shown in the resident app; native push later).

alter table public.residents drop constraint if exists residents_status_check;
alter table public.residents add constraint residents_status_check check (status in ('active', 'pending', 'blocked'));

-- A business the operator adds as a sales lead hasn't accepted the terms yet.
alter table public.businesses alter column agreed_terms_at drop not null;

alter table public.offers add column featured boolean not null default false;

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 60),
  subtitle text check (char_length(subtitle) <= 120),
  image_url text,
  -- Tapping the banner opens this business's page.
  business_id uuid references public.businesses (id) on delete set null,
  city text,
  active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.banners enable row level security;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 60),
  body text not null check (char_length(body) between 2 and 300),
  target text not null check (target in ('all', 'city', 'building')),
  city text,
  building_id uuid references public.buildings (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((target = 'city') = (city is not null) and (target = 'building') = (building_id is not null))
);
create index on public.notifications (created_at desc);
alter table public.notifications enable row level security;
