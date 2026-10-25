-- Resident amount disputes ("הסכום לא נכון?").
-- * A resident (or another resident of the same apartment) reports a redemption within 7 days: the real bill was
--   higher, the discount wasn't given, or other. One dispute per redemption, optional private receipt photo.
-- * The Lobby admin corrects the bill (discount, paid and commission are recalculated with the redemption's own
--   snapshot rates, in one transaction) or dismisses it with a reason the resident sees.
-- * Billing: a month is charged once it has ended. A correction in the running month just changes its totals.
--   A correction in an ended month leaves that month's billed total as it was and adds a billing_adjustments row
--   that is charged with the month the correction was made in (apply_period): counted exactly once.

-- ---------- Disputes ----------

create table public.redemption_disputes (
  id uuid primary key default gen_random_uuid(),
  redemption_id uuid not null unique references public.redemptions (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  apartment_id uuid not null references public.apartments (id) on delete cascade,
  reported_by_user_id uuid references auth.users (id) on delete set null,
  reason text not null check (reason in ('BILL_HIGHER', 'DISCOUNT_NOT_GIVEN', 'OTHER')),
  claimed_bill_agorot integer check (claimed_bill_agorot > 0 and claimed_bill_agorot <= 10000000),
  receipt_photo_key text,
  note text check (char_length(note) <= 500),
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_REVIEW', 'CORRECTED', 'DISMISSED')),
  resolution_note text check (char_length(resolution_note) <= 300),
  resolved_by_user_id uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  -- The redemption as it was when reported (a correction changes the redemption, never these).
  original_bill_agorot integer not null,
  original_discount_agorot integer not null,
  original_commission_agorot integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reason <> 'BILL_HIGHER' or claimed_bill_agorot > original_bill_agorot),
  check ((status in ('CORRECTED', 'DISMISSED')) = (resolved_at is not null)),
  check (status <> 'DISMISSED' or char_length(resolution_note) >= 2)
);
create index on public.redemption_disputes (status, created_at);
create index on public.redemption_disputes (business_id, created_at desc);
create index on public.redemption_disputes (reported_by_user_id, created_at desc);
alter table public.redemption_disputes enable row level security;

-- ---------- Billing adjustments (corrections to months already charged) ----------

create table public.billing_adjustments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- The month of the corrected redemption, and the month whose charge carries the difference.
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  apply_period text not null check (apply_period ~ '^\d{4}-\d{2}$' and apply_period > period),
  commission_diff_agorot integer not null,
  dispute_id uuid not null unique references public.redemption_disputes (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.billing_adjustments (business_id, apply_period);
alter table public.billing_adjustments enable row level security;

-- ---------- Audit events ----------

alter table public.audit_log drop constraint if exists audit_log_event_check;
alter table public.audit_log add constraint audit_log_event_check check (event in (
  'token_issued', 'scan', 'redeemed', 'voided',
  'dispute_created', 'dispute_status', 'dispute_corrected', 'dispute_dismissed', 'adjustment_created'
));
alter table public.audit_log add column dispute_id uuid references public.redemption_disputes (id) on delete set null;

-- ---------- Receipt photos: private, read only through short-lived signed URLs ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dispute-receipts', 'dispute-receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ---------- Correct: one transaction ----------

create function public.correct_redemption(p_dispute_id uuid, p_bill_agorot integer, p_admin uuid, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  d public.redemption_disputes;
  r public.redemptions;
  v_discount integer;
  v_commission integer;
  v_now_period text := to_char(now() at time zone 'Asia/Jerusalem', 'YYYY-MM');
  v_diff integer;
  v_adjusted boolean := false;
begin
  if p_bill_agorot is null or p_bill_agorot <= 0 or p_bill_agorot > 10000000 then
    return jsonb_build_object('code', 'INVALID_AMOUNT');
  end if;
  select * into d from public.redemption_disputes where id = p_dispute_id for update;
  if not found then return jsonb_build_object('code', 'NOT_FOUND'); end if;
  if d.status not in ('OPEN', 'IN_REVIEW') then return jsonb_build_object('code', 'ALREADY_RESOLVED'); end if;
  select * into r from public.redemptions where id = d.redemption_id for update;
  if r.status <> 'redeemed' then return jsonb_build_object('code', 'VOIDED'); end if;

  -- Same math as approve_redemption() and splitBill(): the redemption's own snapshot rates.
  v_discount := round(p_bill_agorot * r.discount_rate / 100);
  v_commission := round((case when r.commission_base = 'net' then p_bill_agorot - v_discount else p_bill_agorot end) * r.commission_rate / 100);
  v_diff := v_commission - r.commission_agorot;

  update public.redemptions
  set bill_agorot = p_bill_agorot, discount_agorot = v_discount, paid_agorot = p_bill_agorot - v_discount, commission_agorot = v_commission
  where id = r.id;
  update public.redemption_disputes
  set status = 'CORRECTED', resolution_note = nullif(trim(p_note), ''), resolved_by_user_id = p_admin, resolved_at = now(), updated_at = now()
  where id = d.id;

  insert into public.audit_log (event, result, business_id, redemption_id, dispute_id, actor_user_id, period, details)
  values ('dispute_corrected', 'OK', r.business_id, r.id, d.id, p_admin, r.period, jsonb_build_object(
    'before', jsonb_build_object('bill_agorot', r.bill_agorot, 'discount_agorot', r.discount_agorot, 'paid_agorot', r.paid_agorot, 'commission_agorot', r.commission_agorot),
    'after', jsonb_build_object('bill_agorot', p_bill_agorot, 'discount_agorot', v_discount, 'paid_agorot', p_bill_agorot - v_discount, 'commission_agorot', v_commission)));

  -- An ended month was already charged: the difference goes on the running month's charge.
  if r.period < v_now_period and v_diff <> 0 then
    insert into public.billing_adjustments (business_id, period, apply_period, commission_diff_agorot, dispute_id)
    values (r.business_id, r.period, v_now_period, v_diff, d.id);
    insert into public.audit_log (event, result, business_id, redemption_id, dispute_id, actor_user_id, period, details)
    values ('adjustment_created', 'OK', r.business_id, r.id, d.id, p_admin, v_now_period,
            jsonb_build_object('period', r.period, 'commission_diff_agorot', v_diff));
    v_adjusted := true;
  end if;
  return jsonb_build_object('code', 'OK', 'adjusted', v_adjusted, 'commission_diff_agorot', v_diff);
end $$;
revoke execute on function public.correct_redemption(uuid, integer, uuid, text) from public, anon, authenticated;
