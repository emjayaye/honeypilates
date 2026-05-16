-- ─────────────────────────────────────────────────────────────────────
-- Honey Pilates — milestones & reward system
--
-- Lifetime-attendance based: every time a reservation flips to
-- 'attended', a trigger checks whether the member has crossed any
-- new milestone thresholds and inserts member_milestones rows. The
-- dashboard reads from member_milestones to render Honors and the
-- next-milestone progress bar.
--
-- Each milestone definition carries four reward fields so a single
-- record drives all four reward layers:
--   - recognition_text   ("You have honored your practice 25 times.")
--   - free_credits       (number of class credits granted on award)
--   - merch_label        (manual fulfillment label, e.g. "Water bottle")
--   - perks_json         (booking-window-days, guest-passes, etc.)
--
-- New rewards land in member_milestones with status='earned'. Admin
-- tooling later flips status='fulfilled' for merch / perks; free
-- credits convert immediately into a class_pack row (Phase 4).
-- ─────────────────────────────────────────────────────────────────────

create type public.milestone_status as enum ('earned', 'fulfilled');

create table public.milestones (
  id                  uuid primary key default uuid_generate_v4(),
  key                 text unique not null,
  label               text not null,
  threshold           int not null,            -- lifetime attended-class count to reach
  recognition_text    text,
  free_credits        int not null default 0,
  merch_label         text,                    -- null = no merch reward
  perks_json          jsonb,                   -- e.g. {"early_booking_days": 7, "guest_passes": 1}
  sort_order          int not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger tg_milestones_updated_at
  before update on public.milestones
  for each row execute function public.tg_set_updated_at();

alter table public.milestones enable row level security;
create policy "anyone reads milestones" on public.milestones
  for select using (true);

insert into public.milestones (key, label, threshold, recognition_text, free_credits, merch_label, perks_json, sort_order) values
  ('first-visit', 'First Visit',  1,   'Welcome — your first class is on the books.',                0, null,                       null,                                                  10),
  ('honey',       'Honey',        5,   'Five classes in. The pattern is forming.',                   0, null,                       null,                                                  20),
  ('devotee',     'Devotee',      10,  'Ten classes. The studio knows your name.',                   1, null,                       null,                                                  30),
  ('iron',        'Iron',         25,  'Twenty-five classes. The practice is no longer new.',        0, 'Honey Pilates water bottle', null,                                                 40),
  ('steel',       'Steel',        50,  'Fifty classes. Steady. Strong. Felt.',                       1, null,                       '{"early_booking_days": 7}'::jsonb,                    50),
  ('diamond',     'Diamond',      100, 'A hundred classes. Few make it here.',                       0, 'Honey Pilates jacket',     '{"early_booking_days": 7, "guest_passes_per_month": 1}'::jsonb, 60),
  ('sovereign',   'Sovereign',    250, 'Two hundred fifty. The studio is yours.',                    2, 'Engraved plaque on the wall', '{"early_booking_days": 14, "guest_passes_per_month": 2}'::jsonb, 70),
  ('founder',     'Founder',      500, 'Five hundred classes. Lifetime honors.',                     5, 'Custom commission',         '{"early_booking_days": 14, "guest_passes_per_month": 4, "lifetime": true}'::jsonb, 80);

-- ── achievement records ────────────────────────────────────────────
create table public.member_milestones (
  id              uuid primary key default uuid_generate_v4(),
  member_id       uuid not null references public.members(id) on delete cascade,
  milestone_id    uuid not null references public.milestones(id) on delete restrict,
  achieved_at     timestamptz not null default now(),
  status          public.milestone_status not null default 'earned',
  fulfilled_at    timestamptz,
  fulfilled_by    uuid references public.members(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (member_id, milestone_id)
);
create index ix_member_milestones_member on public.member_milestones (member_id, achieved_at desc);
create index ix_member_milestones_status on public.member_milestones (status, achieved_at desc);

alter table public.member_milestones enable row level security;
create policy "members read own milestones" on public.member_milestones
  for select using (auth.uid() = member_id);
create policy "instructors + admin read all milestones" on public.member_milestones
  for select using (public.is_admin_or_instructor());
create policy "admin updates milestone fulfillment" on public.member_milestones
  for update using (public.is_admin_or_instructor())
  with check (public.is_admin_or_instructor());

-- ── auto-award trigger ────────────────────────────────────────────
-- When a reservation flips to 'attended', count the member's lifetime
-- attended classes and insert member_milestones rows for any newly
-- reached thresholds. Idempotent via the unique(member, milestone)
-- constraint — re-running awards the same milestone at most once.
create or replace function public.tg_award_milestones_on_attended()
returns trigger security definer set search_path = public language plpgsql as $$
declare
  attended_count int;
  m record;
begin
  -- Only act when status flips TO 'attended' (insert or update).
  if new.status <> 'attended' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'attended' then return new; end if;

  select count(*) into attended_count
    from public.reservations
   where member_id = new.member_id
     and status = 'attended';

  for m in
    select id from public.milestones
     where is_active and threshold <= attended_count
  loop
    insert into public.member_milestones (member_id, milestone_id)
      values (new.member_id, m.id)
      on conflict (member_id, milestone_id) do nothing;
  end loop;

  return new;
end $$;

create trigger tg_reservations_award_milestones
  after insert or update of status on public.reservations
  for each row execute function public.tg_award_milestones_on_attended();
