-- ─────────────────────────────────────────────────────────────────────
-- Honey Pilates — billing catalog
--
-- Two product families:
--   subscription_plans  — monthly memberships (Stripe Subscription)
--   class_pack_offerings — pay-once class packs (Stripe one-time)
--
-- Catalogs are admin-editable so the owner can launch new tiers
-- without a code change. Members see whichever rows are is_published.
-- Stripe price_ids stay nullable until the live checkout wires up;
-- the rest of the app reads everything else from these tables.
-- ─────────────────────────────────────────────────────────────────────

create table public.subscription_plans (
  id                    uuid primary key default uuid_generate_v4(),
  key                   text unique not null,
  name                  text not null,
  tagline               text,
  description           text,
  price_cents           int not null,
  classes_per_month     int,                  -- null = unlimited
  features              jsonb,                -- string[] of perk bullets
  badge                 text,                 -- "Most popular" / "Best value"
  stripe_price_id       text,                 -- filled in once Stripe is live
  sort_order            int not null default 0,
  is_published          boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger tg_subscription_plans_updated_at
  before update on public.subscription_plans
  for each row execute function public.tg_set_updated_at();

alter table public.subscription_plans enable row level security;
create policy "anyone reads published plans" on public.subscription_plans
  for select using (is_published);
create policy "admin writes plans" on public.subscription_plans
  for all using (public.is_admin_or_instructor())
  with check (public.is_admin_or_instructor());

insert into public.subscription_plans
  (key, name, tagline, description, price_cents, classes_per_month, features, badge, sort_order) values
  ('intro-month',
   'Intro Month',
   'New here?',
   'Four weeks of unlimited reformer + mat — the warmest possible welcome.',
   9900, null,
   '["Unlimited classes for 30 days", "Both studios", "Cancel anytime", "First-time members only"]'::jsonb,
   'New member',
   10),
  ('monthly-eight',
   'Monthly Eight',
   'A steady cadence.',
   'Eight classes per month, ideal for twice-weekly practitioners.',
   16900, 8,
   '["8 classes per calendar month", "Both studios", "Unused classes roll one month", "Pause for up to 30 days"]'::jsonb,
   null,
   20),
  ('monthly-unlimited',
   'Monthly Unlimited',
   'Most popular.',
   'Practice as often as you like across both Patchogue and Sayville studios.',
   24900, null,
   '["Unlimited reformer + mat", "Both studios", "7-day early booking window", "Pause for up to 60 days"]'::jsonb,
   'Most popular',
   30),
  ('founders-circle',
   'Founders Circle',
   'For the regular.',
   'Unlimited classes, two complimentary guest passes a month, first dibs on workshops.',
   34900, null,
   '["Unlimited reformer + mat", "Both studios", "14-day early booking window", "2 guest passes / month", "Workshop priority"]'::jsonb,
   'Highest tier',
   40);

-- ── class pack offerings ────────────────────────────────────────────
create table public.class_pack_offerings (
  id              uuid primary key default uuid_generate_v4(),
  key             text unique not null,
  name            text not null,
  tagline         text,
  description     text,
  credits         int not null,
  price_cents     int not null,
  valid_days      int not null default 90,
  badge           text,
  stripe_price_id text,                       -- filled in once Stripe is live
  sort_order      int not null default 0,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger tg_class_pack_offerings_updated_at
  before update on public.class_pack_offerings
  for each row execute function public.tg_set_updated_at();

alter table public.class_pack_offerings enable row level security;
create policy "anyone reads published packs" on public.class_pack_offerings
  for select using (is_published);
create policy "admin writes packs" on public.class_pack_offerings
  for all using (public.is_admin_or_instructor())
  with check (public.is_admin_or_instructor());

insert into public.class_pack_offerings
  (key, name, tagline, description, credits, price_cents, valid_days, badge, sort_order) values
  ('single-class',
   'Single Class',
   'Pay as you go.',
   'One reformer or mat class. Valid for thirty days.',
   1, 4500, 30,
   null,
   10),
  ('five-pack',
   'Five-Class Pack',
   'A little more room.',
   'Five classes to use within ninety days. Mix reformer and mat freely.',
   5, 21500, 90,
   null,
   20),
  ('ten-pack',
   'Ten-Class Pack',
   'Best per-class value.',
   'Ten classes valid for ninety days. The most flexible way to commit.',
   10, 39500, 90,
   'Best value',
   30);
