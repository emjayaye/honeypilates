-- ─────────────────────────────────────────────────────────────────────
-- Honey Pilates — booking helpers
--
-- Adds a SECURITY DEFINER RPC `reserve_class` that runs the
-- reserve-or-waitlist decision inside a single transaction so two
-- members can't race past the same last seat. Returns the resulting
-- reservation row + computed status ('booked' or 'waitlist').
--
-- Credit / membership consumption is intentionally left out of this
-- migration — Phase 4 (Stripe) defines the payment contract and the
-- credit-decrement rules. For now, any member with an active session
-- can reserve any session; pack credit balance is informational only.
-- ─────────────────────────────────────────────────────────────────────

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
begin
  if v_member is null then
    raise exception 'must be signed in';
  end if;

  -- Load + lock the session row so capacity math is consistent.
  select * into v_session from public.class_sessions
   where class_sessions.id = p_session_id
   for update;
  if not found then raise exception 'session not found'; end if;
  if v_session.cancelled_at is not null then raise exception 'class has been cancelled'; end if;
  if v_session.starts_at <= now() then raise exception 'class has already started'; end if;

  v_capacity := v_session.capacity;

  -- Already booked? short-circuit.
  select * into v_existing from public.reservations r
   where r.member_id = v_member and r.class_session_id = p_session_id
     and r.status in ('booked', 'waitlist');
  if found then
    return query select v_existing.id, v_existing.status;
    return;
  end if;

  select count(*) into v_booked from public.reservations r
   where r.class_session_id = p_session_id and r.status = 'booked';

  if v_booked < v_capacity then
    v_status := 'booked';
  else
    v_status := 'waitlist';
  end if;

  insert into public.reservations (member_id, class_session_id, status)
    values (v_member, p_session_id, v_status)
    returning reservations.id into v_existing.id;

  return query select v_existing.id, v_status;
end $$;
grant execute on function public.reserve_class(uuid) to authenticated;

-- Cancel-self: members can already DELETE/UPDATE own reservations via
-- their RLS policy, but we expose a function for the cleaner client
-- call site (no need to hand-craft an update). Sets status='cancelled'
-- rather than deleting so history + the milestone trigger stay sound.
create or replace function public.cancel_reservation(p_reservation_id uuid)
returns void
security definer set search_path = public language plpgsql as $$
declare
  v_member uuid := auth.uid();
  v_res public.reservations%rowtype;
begin
  if v_member is null then raise exception 'must be signed in'; end if;
  select * into v_res from public.reservations where id = p_reservation_id;
  if not found then raise exception 'reservation not found'; end if;
  if v_res.member_id <> v_member then raise exception 'not your reservation'; end if;
  if v_res.status not in ('booked', 'waitlist') then return; end if;
  update public.reservations
     set status = 'cancelled', cancelled_at = now()
   where id = p_reservation_id;

  -- Promote first waitlister, if any, into the freed seat.
  update public.reservations
     set status = 'booked'
   where id = (
     select r.id from public.reservations r
       where r.class_session_id = v_res.class_session_id
         and r.status = 'waitlist'
       order by r.created_at asc
       limit 1
   );
end $$;
grant execute on function public.cancel_reservation(uuid) to authenticated;

-- Admin / instructor marks a reservation attended. Fires the milestone
-- trigger automatically since trigger watches status updates.
create or replace function public.mark_attended(p_reservation_id uuid)
returns void
security definer set search_path = public language plpgsql as $$
begin
  if not public.is_admin_or_instructor() then
    raise exception 'studio access required';
  end if;
  update public.reservations
     set status = 'attended', attended_at = now()
   where id = p_reservation_id
     and status in ('booked', 'waitlist');
end $$;
grant execute on function public.mark_attended(uuid) to authenticated;
