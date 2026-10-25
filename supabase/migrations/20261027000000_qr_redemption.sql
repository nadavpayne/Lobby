-- QR redemption (replaces the typed 6-digit codes).
-- * A resident's "use benefit" creates a single-use redemption TOKEN: 5 minutes, bound to apartment + business,
--   shown as a signed QR plus an XXX-XXX backup code. One active token per apartment + business.
-- * The register scans it (expiry is checked AT SCAN; the scan then locks the token), the cashier enters the bill,
--   and approve_redemption() records it in one transaction. The monthly rule is a unique index.
-- * Money is integer agorot. The old shekel columns (amount, discount_amount, commission_amount) become read-only
--   generated views of the agorot ones so existing reports keep working.
-- * Voids keep the row (status 'voided'), drop it from totals and free the monthly slot.
-- * audit_log records every token, scan attempt (with its result code), redemption and void.

-- ---------- Redemptions: agorot, snapshots, voids ----------

alter table public.redemptions
  add column bill_agorot integer check (bill_agorot > 0),
  add column discount_agorot integer check (discount_agorot >= 0),
  add column paid_agorot integer check (paid_agorot >= 0),
  add column commission_agorot integer check (commission_agorot >= 0),
  add column discount_rate numeric(5, 2),
  add column commission_rate numeric(5, 2),
  add column commission_base text check (commission_base in ('gross', 'net')),
  add column building_id uuid references public.buildings (id),
  add column cashier_user_id uuid references auth.users (id) on delete set null,
  add column token_id uuid,
  add column voided_at timestamptz,
  add column voided_by uuid references auth.users (id) on delete set null,
  add column void_reason text check (char_length(void_reason) <= 300);

-- Backfill the redeemed history in agorot; rates are reconstructed from the stored amounts.
update public.redemptions r set
  bill_agorot = round(r.amount * 100),
  discount_agorot = round(r.discount_amount * 100),
  paid_agorot = round(r.amount * 100) - round(r.discount_amount * 100),
  commission_agorot = round(r.commission_amount * 100),
  discount_rate = o.discount_percent,
  commission_rate = case when r.amount > 0 then round(r.commission_amount / r.amount * 100, 2) else 0 end,
  commission_base = 'gross'
from public.offers o
where o.id = r.offer_id and r.status = 'redeemed';
update public.redemptions r set building_id = a.building_id from public.apartments a where a.id = r.apartment_id;

-- Typed codes that were never redeemed have no further use: tokens replace them.
delete from public.redemptions where status <> 'redeemed';

-- Old indexes, the hourly expiry job and its function go before the column changes below.
drop index if exists public.redemptions_one_per_apartment_business_month;
drop index if exists public.redemptions_live_code_per_business;
select cron.unschedule(jobid) from cron.job where jobname = 'expire-stale-redemptions';
drop function if exists public.expire_stale_redemptions();

-- The shekel columns become generated from agorot (drops the view that reads them; recreated below).
alter table public.redemptions drop column amount cascade;
alter table public.redemptions drop column discount_amount cascade;
alter table public.redemptions drop column commission_amount cascade;
-- Status becomes text: only redeemed and voided rows remain (a new enum value can't be used in the same run).
alter table public.redemptions alter column status drop default;
alter table public.redemptions alter column status type text using status::text;
alter table public.redemptions alter column status set default 'redeemed';
alter table public.redemptions add constraint redemptions_status_check check (status in ('redeemed', 'voided'));
drop type public.redemption_status;

alter table public.redemptions
  add column amount numeric(10, 2) generated always as (bill_agorot / 100.0) stored,
  add column discount_amount numeric(10, 2) generated always as (discount_agorot / 100.0) stored,
  add column commission_amount numeric(10, 2) generated always as (commission_agorot / 100.0) stored;

alter table public.redemptions
  add constraint redemptions_money_present check (
    status not in ('redeemed', 'voided') or (bill_agorot is not null and discount_agorot is not null and paid_agorot is not null
      and commission_agorot is not null and discount_rate is not null and commission_rate is not null and redeemed_at is not null)),
  add constraint redemptions_paid_adds_up check (bill_agorot is null or paid_agorot = bill_agorot - discount_agorot),
  add constraint redemptions_void_complete check ((status = 'voided') = (voided_at is not null and void_reason is not null));

-- The monthly rule, enforced by the database: one non-voided redemption per apartment, business and month.
create unique index redemptions_one_per_apartment_business_month
  on public.redemptions (apartment_id, business_id, period) where status = 'redeemed';
create index on public.redemptions (business_id, redeemed_at desc);
create index on public.redemptions (building_id, period);

create or replace view public.commissions_monthly with (security_invoker = true) as
  select business_id, period,
         count(*)::integer as redemptions,
         sum(amount) as gmv,
         sum(discount_amount) as discount_total,
         sum(commission_amount) as commission_total
  from public.redemptions
  where status = 'redeemed'
  group by business_id, period;
revoke all on public.commissions_monthly from anon, authenticated;

-- What the commission is computed on (pre-discount bill by default, until the business terms confirm it).
alter table public.businesses add column commission_base text not null default 'gross' check (commission_base in ('gross', 'net'));

-- ---------- Tokens ----------

create table public.redemption_tokens (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  offer_id uuid not null references public.offers (id) on delete cascade,
  apartment_id uuid not null references public.apartments (id) on delete cascade,
  building_id uuid not null references public.buildings (id) on delete cascade,
  resident_id uuid references public.residents (id) on delete set null,
  -- Snapshot at issue: the resident is promised this rate.
  discount_rate numeric(5, 2) not null check (discount_rate > 0 and discount_rate <= 100),
  -- 6 characters without look-alikes (no 0/O, 1/I/L and other easily confused glyphs); shown as XXX-XXX.
  backup_code text not null check (backup_code ~ '^[ACEFHJKMNPRTWXY3479]{6}$'),
  status text not null default 'active' check (status in ('active', 'used', 'replaced')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '5 minutes',
  used_at timestamptz,
  used_scan_id uuid,
  redemption_id uuid references public.redemptions (id) on delete set null,
  check ((status = 'used') = (used_at is not null))
);
-- One active token per apartment + business; issuing a new one replaces the old.
create unique index redemption_tokens_one_active on public.redemption_tokens (apartment_id, business_id) where status = 'active';
-- A backup code is unambiguous among a business's active tokens.
create unique index redemption_tokens_backup_code on public.redemption_tokens (business_id, backup_code) where status = 'active';
create index on public.redemption_tokens (backup_code);
alter table public.redemption_tokens enable row level security;

alter table public.redemptions add constraint redemptions_token_fkey foreign key (token_id) references public.redemption_tokens (id) on delete set null;

-- ---------- Audit log ----------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event text not null check (event in ('token_issued', 'scan', 'redeemed', 'voided')),
  -- For scans: OK / INVALID_CODE / WRONG_BUSINESS / CODE_EXPIRED / CODE_ALREADY_USED / ALREADY_REDEEMED_THIS_MONTH.
  result text,
  business_id uuid references public.businesses (id) on delete cascade,
  token_id uuid references public.redemption_tokens (id) on delete set null,
  redemption_id uuid references public.redemptions (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  -- For OK scans: the month the scan happened in (a redemption belongs to its scan's month).
  period text check (period ~ '^\d{4}-\d{2}$'),
  details jsonb not null default '{}'
);
create index on public.audit_log (business_id, created_at desc);
create index on public.audit_log (token_id);
alter table public.audit_log enable row level security;

-- ---------- Cashiers: scan-only logins per business ----------

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles drop constraint if exists user_roles_check;
alter table public.user_roles
  add constraint user_roles_role_check check (role in ('admin', 'business_owner', 'cashier')),
  add constraint user_roles_business_check check ((role in ('business_owner', 'cashier')) = (business_id is not null));

-- ---------- Approve: one transaction ----------

create function public.approve_redemption(p_scan_id uuid, p_business_id uuid, p_bill_agorot integer, p_cashier uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.audit_log;
  t public.redemption_tokens;
  prev public.redemptions;
  r public.redemptions;
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

  -- The monthly rule, in the month of the scan.
  select * into prev from public.redemptions
  where apartment_id = t.apartment_id and business_id = t.business_id and period = s.period and status = 'redeemed'
  limit 1;
  if found then
    return jsonb_build_object('code', 'ALREADY_REDEEMED_THIS_MONTH', 'previous_id', prev.id);
  end if;

  select commission_percent, commission_base into v_rate, v_base from public.businesses where id = t.business_id;
  v_discount := round(p_bill_agorot * t.discount_rate / 100);
  v_commission := round((case when v_base = 'net' then p_bill_agorot - v_discount else p_bill_agorot end) * v_rate / 100);

  begin
    insert into public.redemptions (
      code, apartment_id, business_id, offer_id, resident_id, status, issued_at, expires_at, redeemed_at, period,
      bill_agorot, discount_agorot, paid_agorot, commission_agorot, discount_rate, commission_rate, commission_base,
      building_id, cashier_user_id, token_id
    ) values (
      t.backup_code, t.apartment_id, t.business_id, t.offer_id, t.resident_id, 'redeemed', t.issued_at, t.expires_at, now(), s.period,
      p_bill_agorot, v_discount, p_bill_agorot - v_discount, v_commission, t.discount_rate, v_rate, v_base,
      t.building_id, p_cashier, t.id
    ) returning * into r;
  exception when unique_violation then
    -- Another token of the same apartment won the month a moment ago.
    return jsonb_build_object('code', 'ALREADY_REDEEMED_THIS_MONTH');
  end;

  update public.redemption_tokens set status = 'used', used_at = now(), used_scan_id = p_scan_id, redemption_id = r.id where id = t.id;
  insert into public.audit_log (event, result, business_id, token_id, redemption_id, actor_user_id, period, details)
  values ('redeemed', 'OK', t.business_id, t.id, r.id, p_cashier, s.period,
          jsonb_build_object('bill_agorot', p_bill_agorot, 'discount_agorot', v_discount, 'commission_agorot', v_commission));
  return jsonb_build_object('code', 'OK', 'redemption_id', r.id, 'replay', false);
end $$;
revoke execute on function public.approve_redemption(uuid, uuid, integer, uuid) from public, anon, authenticated;

-- ---------- Void: owner only (checked by the API), keeps the row ----------

create function public.void_redemption(p_id uuid, p_business_id uuid, p_user uuid, p_reason text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_period text;
begin
  update public.redemptions set status = 'voided', voided_at = now(), voided_by = p_user, void_reason = p_reason
  where id = p_id and business_id = p_business_id and status = 'redeemed'
  returning period into v_period;
  if not found then return false; end if;
  insert into public.audit_log (event, result, business_id, redemption_id, actor_user_id, period, details)
  values ('voided', 'OK', p_business_id, p_id, p_user, v_period, jsonb_build_object('reason', p_reason));
  return true;
end $$;
revoke execute on function public.void_redemption(uuid, uuid, uuid, text) from public, anon, authenticated;
