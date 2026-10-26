-- Radius search in our own database (never through Google). A business counts as near if its storefront or any
-- of its branches is within the radius. Each resident has a radius (not in the UI yet; default 1 km).

alter table public.residents
  add column radius_preference integer not null default 1000 check (radius_preference between 100 and 50000);

-- Active businesses within radius_meters of a point, nearest first, distance in whole meters.
-- category_id matches the primary category or a subcategory; null = all.
create function public.nearby_businesses(lat double precision, lng double precision, radius_meters integer default 1000, category_id text default null)
returns table (business_id uuid, distance_meters integer)
language sql stable set search_path = '' as $$
  with here as (
    select extensions.st_setsrid(extensions.st_makepoint(nearby_businesses.lng, nearby_businesses.lat), 4326)::extensions.geography as g
  ),
  candidates as (
    select b.id, b.category, b.subcategories, b.location from public.businesses b where b.status = 'active' and b.location is not null
    union all
    select b.id, b.category, b.subcategories, br.location
    from public.branches br join public.businesses b on b.id = br.business_id
    where b.status = 'active' and br.location is not null
  )
  select c.id, min(round(extensions.st_distance(c.location, here.g)))::integer
  from candidates c, here
  where extensions.st_dwithin(c.location, here.g, nearby_businesses.radius_meters)
    and (nearby_businesses.category_id is null or c.category = nearby_businesses.category_id or nearby_businesses.category_id = any (c.subcategories))
  group by c.id
  order by 2, 1;
$$;

-- Server only (the API decides what each user may see).
revoke execute on function public.nearby_businesses(double precision, double precision, integer, text) from public, anon, authenticated;
grant execute on function public.nearby_businesses(double precision, double precision, integer, text) to service_role;
