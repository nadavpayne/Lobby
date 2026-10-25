-- Redemption flow v2: codes are 6 digits and valid 10 minutes.
-- A code only has to be unique among a business's LIVE codes, so the million numbers are reused over time;
-- older letter codes (e.g. the first demo's DEMA24) stay valid in history.

alter table public.redemptions drop constraint redemptions_code_check;
alter table public.redemptions add constraint redemptions_code_check check (code ~ '^[A-Z0-9]{6}$');

alter table public.redemptions alter column expires_at set default now() + interval '10 minutes';

alter table public.redemptions drop constraint redemptions_business_id_code_key;
create unique index redemptions_live_code_per_business on public.redemptions (business_id, code) where status = 'issued';
create index redemptions_business_code on public.redemptions (business_id, code);
