-- ─────────────────────────────────────────────────────────────────────
-- Honey Pilates — initial schema
--
-- Builds the core domain so the member dashboard, schedule, and
-- booking flow can talk to real data. Auth lives in Supabase's
-- managed `auth.users`; everything below either references that or
-- exists as standalone studio data.
--
-- Conventions:
--   • snake_case tables + columns
--   • every row gets created_at + updated_at via trigger
--   • RLS ENABLED on every public table — explicit policies grant
--     access. Members only see their own rows. Public-readable data
--     (instructors, locations, schedule) is exposed via "anyone"
--     policies so the marketing pages can render without auth.
-- ─────────────────────────────────────────────────────────────────────

-- ── extensions ───────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── helper: shared updated_at trigger ────────────────────────────────
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── enums ────────────────────────────────────────────────────────────
create type public.member_role as enum ('member', 'instructor', 'admin');
create type public.reservation_status as enum ('booked', 'waitlist', 'attended', 'no_show', 'cancelled');
create type public.membership_status as enum ('active', 'paused', 'cancelled', 'past_due');
create type public.pack_status as enum ('active', 'depleted', 'expired');

-- ── studio_locations ─────────────────────────────────────────────────
-- Patchogue, Sayville. Public-readable (marketing pages list these).
create table public.studio_locations (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,
  name         text not null,
  address      text,
  phone        text,
  hours        jsonb,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger tg_studio_locations_updated_at
  before update on public.studio_locations
  for each row execute function public.tg_set_updated_at();

alter table public.studio_locations enable row level security;
create policy "anyone reads locations" on public.studio_locations
  for select using (true);

insert into public.studio_locations (slug, name, address) values
  ('patchogue', 'Patchogue Studio', '123 Main St, Patchogue NY'),
  ('sayville',  'Sayville Studio',  '456 Main St, Sayville NY');

-- ── members (profile) ───────────────────────────────────────────────
-- Mirrors auth.users 1:1 and carries studio-specific profile data.
-- Created automatically on signup via the trigger below.
create table public.members (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text,
  preferred_name      text,
  phone               text,
  emergency_contact   jsonb,
  role                public.member_role not null default 'member',
  avatar_url          text,
  notes_for_studio    text,
  marketing_opt_in    boolean not null default false,
  joined_at           timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger tg_members_updated_at
  before update on public.members
  for each row execute function public.tg_set_updated_at();

alter table public.members enable row level security;

create policy "members read self" on public.members
  for select using (auth.uid() = id);
create policy "members update self" on public.members
  for update using (auth.uid() = id);
create policy "instructors + admin read members" on public.members
  for select using (
    exists (select 1 from public.members m
            where m.id = auth.uid() and m.role in ('instructor', 'admin'))
  );

-- Auto-create a members row whenever someone signs up via auth.
create or replace function public.tg_create_member_on_signup()
returns trigger security definer set search_path = public language plpgsql as $$
begin
  insert into public.members (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end $$;
create trigger tg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_create_member_on_signup();

-- ── class_types ─────────────────────────────────────────────────────
-- Reformer Flow, Mat & Core, etc. Templates that class_sessions
-- reference. Public-readable.
create table public.class_types (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  name          text not null,
  description   text,
  duration_min  int not null default 60,
  default_capacity int not null default 8,
  level         text default 'all-levels', -- 'beginner' | 'all-levels' | 'intermediate' | 'advanced'
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger tg_class_types_updated_at
  before update on public.class_types
  for each row execute function public.tg_set_updated_at();

alter table public.class_types enable row level security;
create policy "anyone reads class_types" on public.class_types
  for select using (true);

insert into public.class_types (slug, name, description, duration_min, default_capacity, level, sort_order) values
  ('reformer-flow',    'Reformer Flow',     'Full-body reformer session for every body.', 60, 8, 'all-levels', 10),
  ('mat-core',         'Mat & Core',        'Floor-based core conditioning + mobility.',  45, 12, 'all-levels', 20),
  ('sculpt-sweat',     'Sculpt + Sweat',    'Reformer + light weights for resistance.',   50, 8, 'intermediate', 30),
  ('prenatal-reformer','Prenatal Reformer', 'Pregnancy-safe reformer with modifications.', 50, 6, 'all-levels', 40),
  ('one-on-one',       '1:1 Training',      'Private session — book direct.',             60, 1, 'all-levels', 50);

-- ── class_sessions ──────────────────────────────────────────────────
-- A specific instance of a class_type at a specific time + studio,
-- taught by a specific instructor.
create table public.class_sessions (
  id              uuid primary key default uuid_generate_v4(),
  class_type_id   uuid not null references public.class_types(id) on delete restrict,
  instructor_id   uuid references public.members(id) on delete set null,
  location_id     uuid not null references public.studio_locations(id) on delete restrict,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  capacity        int not null,
  cancelled_at    timestamptz,
  cancel_reason   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger tg_class_sessions_updated_at
  before update on public.class_sessions
  for each row execute function public.tg_set_updated_at();
create index ix_class_sessions_starts_at on public.class_sessions (starts_at);
create index ix_class_sessions_location_starts on public.class_sessions (location_id, starts_at);

alter table public.class_sessions enable row level security;
create policy "anyone reads class_sessions" on public.class_sessions
  for select using (true);
create policy "instructors + admin write class_sessions" on public.class_sessions
  for all using (
    exists (select 1 from public.members m
            where m.id = auth.uid() and m.role in ('instructor', 'admin'))
  );

-- ── reservations ────────────────────────────────────────────────────
create table public.reservations (
  id                  uuid primary key default uuid_generate_v4(),
  member_id           uuid not null references public.members(id) on delete cascade,
  class_session_id    uuid not null references public.class_sessions(id) on delete cascade,
  status              public.reservation_status not null default 'booked',
  waitlist_position   int,
  cancelled_at        timestamptz,
  attended_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (member_id, class_session_id)
);
create trigger tg_reservations_updated_at
  before update on public.reservations
  for each row execute function public.tg_set_updated_at();
create index ix_reservations_member on public.reservations (member_id, created_at desc);
create index ix_reservations_session on public.reservations (class_session_id, status);

alter table public.reservations enable row level security;
create policy "members manage own reservations" on public.reservations
  for all using (auth.uid() = member_id) with check (auth.uid() = member_id);
create policy "instructors + admin read all reservations" on public.reservations
  for select using (
    exists (select 1 from public.members m
            where m.id = auth.uid() and m.role in ('instructor', 'admin'))
  );

-- ── class_packs (pay-per-class credits) ─────────────────────────────
create table public.class_packs (
  id              uuid primary key default uuid_generate_v4(),
  member_id       uuid not null references public.members(id) on delete cascade,
  label           text not null,                  -- '5-Class Pack', '10-Class Pack'
  credits_total   int not null,
  credits_left    int not null,
  purchased_at    timestamptz not null default now(),
  expires_at      timestamptz,                    -- nullable: some packs never expire
  status          public.pack_status not null default 'active',
  stripe_payment_intent text,
  price_cents     int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger tg_class_packs_updated_at
  before update on public.class_packs
  for each row execute function public.tg_set_updated_at();
create index ix_class_packs_member on public.class_packs (member_id, status);

alter table public.class_packs enable row level security;
create policy "members read own packs" on public.class_packs
  for select using (auth.uid() = member_id);

-- ── memberships (monthly subscriptions, Stripe-backed) ──────────────
create table public.memberships (
  id                    uuid primary key default uuid_generate_v4(),
  member_id             uuid not null references public.members(id) on delete cascade,
  plan_name             text not null,            -- 'Monthly Unlimited', 'Monthly Limited'
  price_cents           int not null,
  classes_per_month     int,                       -- null = unlimited
  status                public.membership_status not null default 'active',
  current_period_start  timestamptz not null default now(),
  current_period_end    timestamptz,
  cancelled_at          timestamptz,
  stripe_subscription_id text,
  stripe_customer_id    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger tg_memberships_updated_at
  before update on public.memberships
  for each row execute function public.tg_set_updated_at();
create index ix_memberships_member on public.memberships (member_id, status);

alter table public.memberships enable row level security;
create policy "members read own memberships" on public.memberships
  for select using (auth.uid() = member_id);

-- ── waivers (signed legal documents) ────────────────────────────────
-- Phase 5 fills this in. Stub here so the schema is complete.
create table public.waivers (
  id              uuid primary key default uuid_generate_v4(),
  member_id       uuid not null references public.members(id) on delete cascade,
  doc_version     text not null,
  signed_at       timestamptz not null default now(),
  signature_data  text,                            -- base64 PNG
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now()
);
create index ix_waivers_member on public.waivers (member_id, signed_at desc);

alter table public.waivers enable row level security;
create policy "members read own waivers" on public.waivers
  for select using (auth.uid() = member_id);
create policy "members insert own waivers" on public.waivers
  for insert with check (auth.uid() = member_id);
