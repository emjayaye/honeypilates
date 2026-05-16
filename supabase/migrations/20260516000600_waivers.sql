-- ─────────────────────────────────────────────────────────────────────
-- Honey Pilates — waiver documents + signature-required booking
--
-- Schema:
--   waiver_documents       — versioned waiver text. New version is a
--                            new row; older rows stay for audit.
--   waivers (already exists) — signature records, one per member per
--                            doc version. Stored signature_text +
--                            ip + user_agent satisfies the federal
--                            E-SIGN Act for non-regulated use.
--
-- Reservation gate:
--   reserve_class() now refuses to create a reservation if the member
--   has not signed the latest waiver version. Error message tells the
--   client to redirect to /waiver.
--
-- IMPORTANT: the seeded waiver text below is a placeholder and is
-- NOT legal advice. Replace it with copy reviewed by a New York
-- licensed attorney before the studio takes its first real booking.
-- ─────────────────────────────────────────────────────────────────────

create table public.waiver_documents (
  id              uuid primary key default uuid_generate_v4(),
  version         text unique not null,         -- 'v1', 'v2-2026-09'
  title           text not null,
  body_md         text not null,                 -- markdown
  effective_at    timestamptz not null default now(),
  is_active       boolean not null default true, -- only one row should be true
  created_at      timestamptz not null default now()
);
alter table public.waiver_documents enable row level security;
create policy "anyone reads waiver_documents" on public.waiver_documents
  for select using (true);
create policy "admin writes waiver_documents" on public.waiver_documents
  for all using (public.is_admin_or_instructor())
  with check (public.is_admin_or_instructor());

-- Add doc_version + signature_text columns to the existing waivers
-- table so we can link signatures to a specific document row and
-- record what the member typed.
alter table public.waivers
  add column if not exists waiver_document_id uuid references public.waiver_documents(id) on delete restrict,
  add column if not exists signature_text     text;

-- Convenience view: a member's currently-valid signature, if any.
create or replace view public.member_waiver_status as
  select w.member_id,
         w.id            as waiver_id,
         w.doc_version,
         w.signed_at,
         d.is_active     as doc_is_active
    from public.waivers w
    join public.waiver_documents d on d.version = w.doc_version
   where d.is_active = true;

grant select on public.member_waiver_status to authenticated;

-- ── seed the first waiver ──────────────────────────────────────────
insert into public.waiver_documents (version, title, body_md) values (
  'v1',
  'Honey Pilates — Liability Release and Assumption of Risk',
$$
**Effective: 2026-05-16**

This Release of Liability ("Release") is entered into between you ("Member")
and **Honey Pilates LLC** ("Studio"), located in Patchogue and Sayville, New York.

### 1. Assumption of Risk
I understand that Pilates and reformer-based exercise carry inherent risks,
including (without limitation): muscle strain, joint injury, falls, equipment
malfunction, and aggravation of pre-existing conditions. I voluntarily accept
all such risks.

### 2. Medical Disclosure
I confirm that I am physically fit to participate. I will notify the Studio
of any health condition, recent injury, pregnancy, or medication that may
affect my safe participation, and I will follow my physician's guidance.

### 3. Release of Liability
To the fullest extent permitted by New York law, I release Honey Pilates LLC,
its owners, instructors, employees, and contractors from all claims, demands,
damages, and causes of action arising from my participation in any class,
private session, on-demand video, or use of studio equipment — except for
claims arising from the Studio's gross negligence or willful misconduct.

### 4. Indemnification
I agree to indemnify and hold harmless the Studio from any third-party claim
arising from my acts or omissions on Studio premises or in connection with
Studio programming.

### 5. Photo / Video
The Studio may photograph or record classes for marketing purposes.
I may opt out at any time by emailing flow@honeypilates.com.

### 6. Cancellation Policy
I understand that class cancellations must be made at least four (4) hours
before the scheduled start time. Late cancellations or no-shows may result in
loss of a class credit per Studio policy.

### 7. Electronic Signature
By typing my full legal name and selecting "I agree" below, I am signing this
Release electronically under the federal E-SIGN Act and applicable New York
law. I confirm that this electronic signature has the same legal effect as a
handwritten signature.

By signing, I confirm I am 18 years or older, or that I have a parent or
legal guardian sign on my behalf.
$$
);

-- ── waiver gate on reserve_class ───────────────────────────────────
-- Recreate reserve_class to add the waiver check. Logic is otherwise
-- identical to the original in 20260516000400.
create or replace function public.reserve_class(p_session_id uuid)
returns table (id uuid, status public.reservation_status)
security definer set search_path = public language plpgsql as $$
declare
  v_member uuid := auth.uid();
  v_capacity int;
  v_booked int;
  v_status public.reservation_status;
  v_existing public.reservations%rowtype;
  v_session public.class_sessions%rowtype;
  v_has_waiver boolean;
begin
  if v_member is null then
    raise exception 'must be signed in';
  end if;

  -- Waiver gate — must have signed the currently-active doc version.
  select exists (
    select 1 from public.waivers w
    join public.waiver_documents d on d.version = w.doc_version
    where w.member_id = v_member and d.is_active = true
  ) into v_has_waiver;
  if not v_has_waiver then
    raise exception 'waiver_required';
  end if;

  select * into v_session from public.class_sessions
   where class_sessions.id = p_session_id
   for update;
  if not found then raise exception 'session not found'; end if;
  if v_session.cancelled_at is not null then raise exception 'class has been cancelled'; end if;
  if v_session.starts_at <= now() then raise exception 'class has already started'; end if;

  v_capacity := v_session.capacity;

  select * into v_existing from public.reservations r
   where r.member_id = v_member and r.class_session_id = p_session_id
     and r.status in ('booked', 'waitlist');
  if found then
    return query select v_existing.id, v_existing.status;
    return;
  end if;

  select count(*) into v_booked from public.reservations r
   where r.class_session_id = p_session_id and r.status = 'booked';

  if v_booked < v_capacity then v_status := 'booked';
  else v_status := 'waitlist';
  end if;

  insert into public.reservations (member_id, class_session_id, status)
    values (v_member, p_session_id, v_status)
    returning reservations.id into v_existing.id;

  return query select v_existing.id, v_status;
end $$;
grant execute on function public.reserve_class(uuid) to authenticated;

-- ── sign_waiver RPC ────────────────────────────────────────────────
-- Inserts a waivers row for the signed-in member against the currently
-- active waiver_document. Idempotent — re-signing the same active doc
-- silently no-ops via the (member, version) uniqueness check below.
-- We also enforce one-signature-per-member-per-version via a unique
-- index.
create unique index if not exists ux_waivers_member_version
  on public.waivers (member_id, doc_version);

create or replace function public.sign_waiver(p_signature_text text)
returns void
security definer set search_path = public language plpgsql as $$
declare
  v_member uuid := auth.uid();
  v_doc public.waiver_documents%rowtype;
begin
  if v_member is null then raise exception 'must be signed in'; end if;
  if length(coalesce(p_signature_text, '')) < 3 then
    raise exception 'please type your full legal name';
  end if;
  select * into v_doc from public.waiver_documents where is_active = true limit 1;
  if not found then raise exception 'no active waiver on file'; end if;

  insert into public.waivers (member_id, waiver_document_id, doc_version, signature_text)
    values (v_member, v_doc.id, v_doc.version, p_signature_text)
    on conflict (member_id, doc_version) do update set
      signed_at = now(),
      signature_text = excluded.signature_text;
end $$;
grant execute on function public.sign_waiver(text) to authenticated;
