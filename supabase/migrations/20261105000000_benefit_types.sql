-- Benefit types and per-business rates.
-- * An offer (the business's benefit) is monthly (once per apartment per calendar month, as before) or one-time
--   (once ever at this business, per apartment or per resident). Rates were already per business: the discount on
--   the offer, the commission and its base on the business.
-- * Tokens snapshot everything the register applies: type, scope, discount, commission and base. A rate change
--   never touches an issued token or a past redemption.
-- * Eligibility is one stored key per redemption, unique per business among non-voided rows:
--     monthly              apt:<apartment_id>:m:<YYYY-MM>
--     one-time, apartment  apt:<apartment_id>:once
--     one-time, resident   res:<resident_user_id>:once
--   Voiding frees the slot. Monthly redemptions never block a later one-time benefit.

-- ---------- Offers: the benefit type ----------

alter table public.offers
  add column benefit_type text not null default 'monthly' check (benefit_type in ('monthly', 'one_time')),
  add column one_time_scope text not null default 'apartment' check (one_time_scope in ('apartment', 'resident'));

-- ---------- Tokens: full snapshot ----------

alter table public.redemption_tokens
  add column benefit_type text not null default 'monthly' check (benefit_type in ('monthly', 'one_time')),
  add column one_time_scope text not null default 'apartment' check (one_time_scope in ('apartment', 'resident')),
  add column commission_rate numeric(5, 2),
  add column commission_base text check (commission_base in ('gross', 'net'));
update public.redemption_tokens t
set commission_rate = b.commission_percent, commission_base = b.commission_base
from public.businesses b where b.id = t.business_id;

-- ---------- Redemptions: type and eligibility key ----------

alter table public.redemptions
  add column benefit_type text not null default 'monthly' check (benefit_type in ('monthly', 'one_time')),
  add column one_time_scope text check (one_time_scope in ('apartment', 'resident')),
  add column eligibility_key text;
-- Every existing redemption was a monthly one.
update public.redemptions set eligibility_key = 'apt:' || apartment_id || ':m:' || period;
alter table public.redemptions alter column eligibility_key set not null;
alter table public.redemptions add constraint redemptions_one_time_scope check ((benefit_type = 'one_time') = (one_time_scope is not null));

drop index if exists public.redemptions_one_per_apartment_business_month;
-- The rule, enforced by the database: one non-voided redemption per business and eligibility key.
create unique index redemptions_one_per_eligibility on public.redemptions (business_id, eligibility_key) where status = 'redeemed';

-- Monthly totals also count the one-time redemptions (new customers brought in).
create or replace view public.commissions_monthly with (security_invoker = true) as
  select business_id, period,
         count(*)::integer as redemptions,
         sum(amount) as gmv,
         sum(discount_amount) as discount_total,
         sum(commission_amount) as commission_total,
         count(*) filter (where benefit_type = 'one_time')::integer as one_time_redemptions
  from public.redemptions
  where status = 'redeemed'
  group by business_id, period;
revoke all on public.commissions_monthly from anon, authenticated;

-- ---------- Approve: the key is built from the token's snapshot, in the month of the scan ----------

create or replace function public.approve_redemption(p_scan_id uuid, p_business_id uuid, p_bill_agorot integer, p_cashier uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.audit_log;
  t public.redemption_tokens;
  prev public.redemptions;
  r public.redemptions;
  v_key text;
  v_code text;
  v_rate numeric;
  v_base text;
  v_discount integer;
  v_commission integer;
begin
  if p_bill_agorot is null or p_bill_agorot <= 0 or p_bill_agorot > 10000000 then
    return jsonb_build_object('code', 'INVALID_AMOUNT');
  end if;

  -- Only a successful scan by this business can be approved.
  select * into s from public.audit_log
  where id = p_scan_id and event = 'scan' and result = 'OK' and business_id = p_business_id;
  if not found then return jsonb_build_object('code', 'INVALID_CODE'); end if;
  if s.created_at < now() - interval '30 minutes' then return jsonb_build_object('code', 'CODE_EXPIRED'); end if;

  -- Lock the token: concurrent approves of the same token run one at a time.
  select * into t from public.redemption_tokens where id = s.token_id for update;
  if not found then return jsonb_build_object('code', 'INVALID_CODE'); end if;
  if t.status = 'used' then
    -- A retry of the same scan (network loss) gets the same redemption; any other scan lost the race.
    if t.used_scan_id = p_scan_id then
      return jsonb_build_object('code', 'OK', 'redemption_id', t.redemption_id, 'replay', true);
    end if;
    return jsonb_build_object('code', 'CODE_ALREADY_USED');
  end if;
  -- Expiry was checked when it was scanned; a replaced token is dead.
  if t.status <> 'active' then return jsonb_build_object('code', 'CODE_EXPIRED'); end if;

  -- The eligibility key (same shape as src/lib/benefits/eligibility.ts), monthly in the month of the scan.
  v_key := case
    when t.benefit_type = 'monthly' then 'apt:' || t.apartment_id || ':m:' || s.period
    when t.one_time_scope = 'resident' and t.resident_id is not null then 'res:' || t.resident_id || ':once'
    else 'apt:' || t.apartment_id || ':once'
  end;
  v_code := case when t.benefit_type = 'monthly' then 'ALREADY_REDEEMED_THIS_MONTH' else 'ALREADY_REDEEMED_ONE_TIME' end;

  select * into prev from public.redemptions
  where business_id = t.business_id and eligibility_key = v_key and status = 'redeemed'
  limit 1;
  if found then
    return jsonb_build_object('code', v_code, 'previous_id', prev.id);
  end if;

  -- Rates from the token's snapshot (tokens issued before the snapshot existed fall back to the business).
  v_rate := t.commission_rate;
  v_base := t.commission_base;
  if v_rate is null or v_base is null then
    select commission_percent, commission_base into v_rate, v_base from public.businesses where id = t.business_id;
  end if;
  v_discount := round(p_bill_agorot * t.discount_rate / 100);
  v_commission := round((case when v_base = 'net' then p_bill_agorot - v_discount else p_bill_agorot end) * v_rate / 100);

  begin
    insert into public.redemptions (
      code, apartment_id, business_id, offer_id, resident_id, status, issued_at, expires_at, redeemed_at, period,
      bill_agorot, discount_agorot, paid_agorot, commission_agorot, discount_rate, commission_rate, commission_base,
      building_id, cashier_user_id, token_id, benefit_type, one_time_scope, eligibility_key
    ) values (
      t.backup_code, t.apartment_id, t.business_id, t.offer_id, t.resident_id, 'redeemed', t.issued_at, t.expires_at, now(), s.period,
      p_bill_agorot, v_discount, p_bill_agorot - v_discount, v_commission, t.discount_rate, v_rate, v_base,
      t.building_id, p_cashier, t.id, t.benefit_type, case when t.benefit_type = 'one_time' then t.one_time_scope end, v_key
    ) returning * into r;
  exception when unique_violation then
    -- Another token with the same key won a moment ago.
    return jsonb_build_object('code', v_code);
  end;

  update public.redemption_tokens set status = 'used', used_at = now(), used_scan_id = p_scan_id, redemption_id = r.id where id = t.id;
  insert into public.audit_log (event, result, business_id, token_id, redemption_id, actor_user_id, period, details)
  values ('redeemed', 'OK', t.business_id, t.id, r.id, p_cashier, s.period,
          jsonb_build_object('bill_agorot', p_bill_agorot, 'discount_agorot', v_discount, 'commission_agorot', v_commission, 'benefit_type', t.benefit_type));
  return jsonb_build_object('code', 'OK', 'redemption_id', r.id, 'replay', false);
end $$;
