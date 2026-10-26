-- A business's reach: how many Lobby buildings, joined apartments and residents are within a radius.
-- Counts only, never addresses or apartment numbers (businesses must not see who lives where).

create function public.counts_near(lat double precision, lng double precision, radius_meters integer default 500)
returns table (buildings integer, apartments integer, residents integer)
language sql stable set search_path = '' as $$
  with here as (
    select extensions.st_setsrid(extensions.st_makepoint(counts_near.lng, counts_near.lat), 4326)::extensions.geography as g
  ),
  near as (
    select b.id from public.buildings b, here
    where b.active and not b.is_demo and b.location is not null and extensions.st_dwithin(b.location, here.g, counts_near.radius_meters)
  ),
  members as (
    select r.id, r.apartment_id from public.residents r join public.apartments a on a.id = r.apartment_id
    where a.building_id in (select id from near) and r.status = 'active'
  )
  select (select count(*) from near)::integer,
         (select count(distinct apartment_id) from members)::integer,
         (select count(*) from members)::integer;
$$;

revoke execute on function public.counts_near(double precision, double precision, integer) from public, anon, authenticated;
grant execute on function public.counts_near(double precision, double precision, integer) to service_role;
