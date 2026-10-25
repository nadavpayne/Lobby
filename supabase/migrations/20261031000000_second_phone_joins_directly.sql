-- The committee's only job is sharing the invite link: no approvals.
-- A second phone in an apartment joins as active right away (still at most 2 phones, sharing the apartment's
-- monthly quota); a third is refused ("apartment_full") and the join form asks them to check the apartment number.
create or replace function public.enforce_apartment_members() returns trigger
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
  return new;
end $$;

-- Phones that were waiting for an approval that will never come.
update public.residents set status = 'active' where status = 'pending';
