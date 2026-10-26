-- Addresses become geo-points: every building, business and branch gets a Google place ID, a normalized address
-- and a PostGIS point derived from lat/lng (so existing code that reads lat/lng keeps working).
-- Google's terms (Places §14.3): lat/lng may be cached for 30 days at most, place IDs indefinitely, so
-- geo_fetched_at drives a refresh job. A pin the business owner moved by hand is their own data (pin_moved).

create extension if not exists postgis with schema extensions;

alter table public.buildings
  add column place_id text,
  add column street text,
  add column house_number text,
  add column postal_code text,
  add column formatted_address text,
  add column geo_fetched_at timestamptz,
  add column location extensions.geography(Point, 4326) generated always as (
    case when lat is not null and lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography end
  ) stored;
create unique index buildings_place_id_key on public.buildings (place_id) where place_id is not null;
create index buildings_location_idx on public.buildings using gist (location);

alter table public.businesses
  add column place_id text,
  add column street text,
  add column house_number text,
  add column postal_code text,
  add column formatted_address text,
  add column geo_fetched_at timestamptz,
  add column pin_moved boolean not null default false,
  add column location extensions.geography(Point, 4326) generated always as (
    case when lat is not null and lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography end
  ) stored;
create index businesses_location_idx on public.businesses using gist (location);

alter table public.branches
  add column place_id text,
  add column street text,
  add column house_number text,
  add column postal_code text,
  add column formatted_address text,
  add column geo_fetched_at timestamptz,
  add column location extensions.geography(Point, 4326) generated always as (
    case when lat is not null and lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography end
  ) stored;
create index branches_location_idx on public.branches using gist (location);

-- One Place Details lookup per place: the same address is never resolved (billed) twice within 25 days.
create table public.place_cache (
  place_id text primary key,
  result jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.place_cache enable row level security;

-- Every billable Google call, for the monthly usage view and the daily safety cap.
create table public.google_api_log (
  id bigint generated always as identity primary key,
  sku text not null check (sku in ('autocomplete', 'place_details', 'text_search')),
  created_at timestamptz not null default now()
);
create index google_api_log_day_idx on public.google_api_log (sku, created_at);
alter table public.google_api_log enable row level security;
