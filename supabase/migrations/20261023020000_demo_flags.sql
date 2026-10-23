-- Demo data used in sales meetings (see scripts/seed-demo.ts). Reports and resident offer lists
-- must exclude is_demo rows.
alter table public.buildings add column is_demo boolean not null default false;
alter table public.businesses add column is_demo boolean not null default false;
