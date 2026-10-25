-- Business taxonomy v1 (data/business-categories.json): 13 primary categories replace the old 11, and a business
-- also stores 1–2 subcategories of its primary plus any tags. IDs only; the app validates them against the JSON.

insert into public.categories (slug, name, icon, sort) values
  ('restaurants', 'מסעדות ובתי קפה', 'utensils', 10),
  ('food_grocery', 'מזון וקניות לבית', 'shopping-basket', 20),
  ('beauty', 'יופי וטיפוח', 'sparkles', 30),
  ('health', 'בריאות', 'heart-pulse', 40),
  ('fitness', 'כושר וספורט', 'dumbbell', 50),
  ('home', 'בית ועיצוב', 'sofa', 60),
  ('local_services', 'שירותים בשכונה', 'wrench', 70),
  ('car', 'רכב', 'car', 80),
  ('shopping', 'אופנה וקניות', 'shopping-bag', 90),
  ('kids_family', 'ילדים ומשפחה', 'baby', 100),
  ('pets', 'חיות מחמד', 'paw-print', 110),
  ('leisure', 'פנאי', 'ticket', 120),
  ('other', 'אחר', 'store', 130)
on conflict (slug) do update set name = excluded.name, icon = excluded.icon, sort = excluded.sort, active = true;

alter table public.businesses
  add column subcategories text[] not null default '{}',
  add column tags text[] not null default '{}',
  add constraint businesses_subcategories_max2 check (cardinality(subcategories) <= 2);

-- Old categories that the new ones split or rename. Keep what a bakery/grocery was as its subcategory.
update public.businesses set subcategories = '{bakery}' where category = 'bakery';
update public.businesses set subcategories = '{grocery_supermarket}' where category = 'grocery';
update public.businesses set category = case category
    when 'food' then 'restaurants' when 'grocery' then 'food_grocery' when 'bakery' then 'food_grocery'
    when 'services' then 'local_services' when 'kids' then 'kids_family' end
  where category in ('food', 'grocery', 'bakery', 'services', 'kids');
update public.offers set category = case category
    when 'food' then 'restaurants' when 'grocery' then 'food_grocery' when 'bakery' then 'food_grocery'
    when 'services' then 'local_services' when 'kids' then 'kids_family' end
  where category in ('food', 'grocery', 'bakery', 'services', 'kids');

delete from public.categories where slug in ('food', 'grocery', 'bakery', 'services', 'kids');
