-- ─────────────────────────────────────────────────────────────────────
-- Honey Pilates — marketing tables
--
-- Two surfaces gain DB support:
--   contact_messages — submissions from the public contact form.
--                      Admins read everything; anyone (including
--                      anonymous visitors) can INSERT.
--   instructors      — sample instructor profiles seeded so the
--                      Meet-the-Team page renders. Owner promotes
--                      / demotes real members via the admin panel.
-- ─────────────────────────────────────────────────────────────────────

create table public.contact_messages (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  email           text not null,
  topic           text,
  message         text not null,
  preferred_location text,                       -- 'patchogue' / 'sayville'
  source_page     text,
  responded_at    timestamptz,
  responded_by    uuid references public.members(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index ix_contact_messages_created on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone (signed-in or anon) can submit a message. We rely on rate
-- limiting at the edge / Cloudflare layer in production; for now
-- this open policy keeps the contact form usable for visitors.
create policy "anyone submits contact messages" on public.contact_messages
  for insert with check (true);
create policy "admin reads contact messages" on public.contact_messages
  for select using (public.is_admin_or_instructor());
create policy "admin updates contact messages" on public.contact_messages
  for update using (public.is_admin_or_instructor())
  with check (public.is_admin_or_instructor());

-- ── public read of instructor + admin profiles ────────────────────
-- The Meet-the-Team marketing page needs to render for anonymous
-- visitors. Adds a permissive SELECT policy scoped to staff rows so
-- the rest of the members table stays private.
create policy "anyone reads instructor profiles" on public.members
  for select using (role in ('instructor', 'admin'));

-- ── sample instructors ────────────────────────────────────────────
-- Two seeded staff so the Meet-the-Team page has content out of the
-- gate. These rows reference fake auth.users entries we synthesize
-- below — they're "studio staff cards", not loginable accounts.
-- Once real instructors create their own accounts, the owner can
-- promote them via the admin panel.
--
-- Trick: we insert directly into auth.users to skip the signup
-- flow, then the existing tg_create_member_on_signup trigger fires
-- and creates the public.members row. We then update the role.

do $$
declare
  v_maria uuid := gen_random_uuid();
  v_joelle uuid := gen_random_uuid();
begin
  -- Maria — founder. Already may exist via the owner-promotion
  -- migration if mjalfino@gmail.com signed up, so we no-op on
  -- conflict by checking first.
  if not exists (select 1 from public.members where email = 'maria@honeypilates.com') then
    insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, encrypted_password)
      values (v_maria, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
              'maria@honeypilates.com', now(), '{"provider":"email"}'::jsonb,
              '{"full_name":"Maria Bellini"}'::jsonb,
              now(), now(), '')
      on conflict do nothing;
    update public.members
       set role = 'instructor',
           preferred_name = 'Maria',
           notes_for_studio = 'Founder & Master Pilates Instructor. Reformer + mat. The Pilates Course certified.'
     where email = 'maria@honeypilates.com';
  end if;

  -- Joelle — senior instructor.
  if not exists (select 1 from public.members where email = 'joelle@honeypilates.com') then
    insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, encrypted_password)
      values (v_joelle, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
              'joelle@honeypilates.com', now(), '{"provider":"email"}'::jsonb,
              '{"full_name":"Joelle Reyes"}'::jsonb,
              now(), now(), '')
      on conflict do nothing;
    update public.members
       set role = 'instructor',
           preferred_name = 'Joelle',
           notes_for_studio = 'Senior reformer instructor specializing in Sculpt + Sweat and prenatal-safe modifications.'
     where email = 'joelle@honeypilates.com';
  end if;
end $$;
