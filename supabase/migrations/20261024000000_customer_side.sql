-- Customer side: committee-created buildings with a fixed apartment list, resident roles and approval,
-- at most 2 phones per apartment, and a city per business (offers are matched to buildings by city
-- until we geocode addresses).

alter table public.buildings
  add column apartment_count integer check (apartment_count between 1 and 500),
  add column active boolean not null default true,
  add column created_by uuid references auth.users (id) on delete set null;

alter table public.businesses add column city text;
update public.businesses set city = 'תל אביב' where is_demo;

alter table public.residents
  add column role text not null default 'resident' check (role in ('resident', 'committee')),
  add column status text not null default 'active' check (status in ('active', 'pending')),
  add column approved_by uuid references public.residents (id) on delete set null,
  add constraint residents_phone_key unique (phone);

-- At most 2 phones per apartment (they share the apartment's monthly quota). The first phone in an
-- apartment is active; a second one starts as pending until the first phone or the committee approves.
create function public.enforce_apartment_members() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  others integer;
begin
  if new.apartment_id is null then
    return new;
  end if;
  -- Lock the apartment row so two simultaneous joins can't both pass the count.
  perform 1 from public.apartments where id = new.apartment_id for update;
  select count(*) into others from public.residents where apartment_id = new.apartment_id and id <> new.id;
  if others >= 2 then
    raise exception 'apartment_full' using errcode = 'P0001';
  end if;
  if others > 0 and (tg_op = 'INSERT' or new.apartment_id is distinct from old.apartment_id) then
    new.status := 'pending';
  end if;
  return new;
end $$;

create trigger residents_apartment_members
  before insert or update of apartment_id on public.residents
  for each row execute function public.enforce_apartment_members();
