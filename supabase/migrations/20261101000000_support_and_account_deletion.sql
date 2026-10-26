-- App Store readiness: support requests, and account deletion from inside the app.

-- ---------- Support requests (public /support form and the in-app help screen) ----------

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 254),
  role text not null check (role in ('resident', 'committee', 'business', 'other')),
  topic text not null check (topic in ('account', 'redemption', 'dispute', 'join_business', 'join_building', 'deletion', 'other')),
  message text not null check (char_length(message) between 5 and 2000),
  -- Signed-in senders are linked (the account may be deleted later).
  user_id uuid references auth.users (id) on delete set null,
  -- Rate limiting only: a salted hash, never the raw IP.
  ip_hash text not null,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  emailed boolean not null default false
);
create index on public.support_requests (created_at desc);
create index on public.support_requests (ip_hash, created_at desc);
create index on public.support_requests (lower(email), created_at desc);
alter table public.support_requests enable row level security;

-- ---------- Account deletion: audit event (role and building only, never personal data) ----------

alter table public.audit_log drop constraint if exists audit_log_event_check;
alter table public.audit_log add constraint audit_log_event_check check (event in (
  'token_issued', 'scan', 'redeemed', 'voided',
  'dispute_created', 'dispute_status', 'dispute_corrected', 'dispute_dismissed', 'adjustment_created',
  'account_deleted'
));

-- ---------- Account deletion: the database part, in one transaction ----------
-- Called by the API after the user re-authenticated with a fresh email code. Afterwards the API deletes receipt
-- photos from storage, revokes cashier logins and deletes the auth user, which cascades to residents (redemptions
-- keep their rows; resident_id becomes null) and user_roles.
create function public.delete_account_data(p_user uuid, p_handover uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me public.residents;
  v_building uuid;
  v_roles text[];
  v_businesses uuid[];
  v_cashiers uuid[];
  v_receipts text[];
  v_sole_left boolean := false;
begin
  select * into me from public.residents where id = p_user;
  if found then
    select building_id into v_building from public.apartments where id = me.apartment_id;
  end if;
  select coalesce(array_agg(distinct role), '{}') into v_roles from public.user_roles where user_id = p_user;
  if me.id is not null then v_roles := v_roles || me.role; end if;
  if 'admin' = any (v_roles) then return jsonb_build_object('code', 'ADMIN'); end if;

  -- Committee: hand the role to another active resident of the building, if asked.
  if me.role = 'committee' and p_handover is not null then
    update public.residents r set role = 'committee'
    from public.apartments a
    where r.id = p_handover and r.id <> p_user and r.status = 'active' and a.id = r.apartment_id and a.building_id = v_building;
    if not found then return jsonb_build_object('code', 'BAD_HANDOVER'); end if;
  end if;
  if me.role = 'committee' then
    v_sole_left := not exists (
      select 1 from public.residents r join public.apartments a on a.id = r.apartment_id
      where a.building_id = v_building and r.role = 'committee' and r.id <> p_user);
    -- The committee contact was this person: the building stays active, without their details.
    if v_sole_left then update public.buildings set committee_name = null, committee_phone = null where id = v_building; end if;
  end if;

  -- Unused QR codes die with the account.
  delete from public.redemption_tokens where resident_id = p_user and status = 'active';

  -- Disputes stay for billing integrity, without the person: no reporter, note or receipt photo.
  select coalesce(array_agg(receipt_photo_key) filter (where receipt_photo_key is not null), '{}') into v_receipts
  from public.redemption_disputes where reported_by_user_id = p_user;
  update public.redemption_disputes set reported_by_user_id = null, note = null, receipt_photo_key = null, updated_at = now()
  where reported_by_user_id = p_user;

  -- Business owner: the business leaves the club (hidden, no scanning), keeps its redemptions, billing and any
  -- unpaid commission, and loses the owner's personal contact details. Its cashiers lose access.
  select coalesce(array_agg(business_id), '{}') into v_businesses from public.user_roles where user_id = p_user and role = 'business_owner';
  update public.businesses
  set status = 'paused', contact_name = 'החשבון נמחק', phone = '-', email = 'deleted+' || id || '@lobby.invalid'
  where id = any (v_businesses);
  select coalesce(array_agg(distinct user_id), '{}') into v_cashiers from public.user_roles where role = 'cashier' and business_id = any (v_businesses);
  delete from public.user_roles where role = 'cashier' and business_id = any (v_businesses);

  delete from public.support_requests where user_id = p_user;

  insert into public.audit_log (event, result, period, details)
  values ('account_deleted', 'OK', to_char(now() at time zone 'Asia/Jerusalem', 'YYYY-MM'), jsonb_build_object(
    'roles', v_roles, 'building_id', v_building, 'businesses', cardinality(v_businesses), 'committee_left_building', v_sole_left));

  return jsonb_build_object('code', 'OK', 'receipts', to_jsonb(v_receipts), 'cashiers', to_jsonb(v_cashiers),
    'building_id', v_building, 'committee_left_building', v_sole_left);
end $$;
revoke execute on function public.delete_account_data(uuid, uuid) from public, anon, authenticated;

-- ---------- Push notifications (iOS app) ----------

-- One row per device: a token belongs to the account signed in on that device (re-registering moves it).
create table public.push_tokens (
  token text primary key check (char_length(token) between 32 and 512),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;

-- Per-account switches; no row = the defaults.
create table public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  new_benefits boolean not null default true,
  redemptions boolean not null default true,
  disputes boolean not null default true,
  biz_summary boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
