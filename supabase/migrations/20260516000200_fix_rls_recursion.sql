-- ─────────────────────────────────────────────────────────────────────
-- Honey Pilates — fix RLS recursion on public.members
--
-- The "instructors + admin read members" policy from the initial
-- schema checked role via a subquery on public.members itself. That
-- subquery fires RLS on public.members AGAIN, which fires the same
-- subquery, which fires RLS again — infinite recursion that Postgres
-- responds to with HTTP 500 from PostgREST.
--
-- The fix is the standard Supabase pattern: wrap the role check in a
-- SECURITY DEFINER function so it runs as the table owner and skips
-- RLS within its body. Policies then call the function instead of
-- inlining a subquery.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.is_admin_or_instructor()
returns boolean
security definer
set search_path = public
language sql stable as $$
  select exists (
    select 1 from public.members
    where id = auth.uid()
      and role in ('instructor', 'admin')
  );
$$;

-- Allow authenticated users to call the function.
grant execute on function public.is_admin_or_instructor() to authenticated, anon;

-- Replace every recursive subquery-based policy with the function call.
drop policy if exists "instructors + admin read members" on public.members;
create policy "instructors + admin read members" on public.members
  for select using (public.is_admin_or_instructor());

drop policy if exists "instructors + admin write class_sessions" on public.class_sessions;
create policy "instructors + admin write class_sessions" on public.class_sessions
  for all using (public.is_admin_or_instructor())
  with check (public.is_admin_or_instructor());

drop policy if exists "instructors + admin read all reservations" on public.reservations;
create policy "instructors + admin read all reservations" on public.reservations
  for select using (public.is_admin_or_instructor());
