-- ─────────────────────────────────────────────────────────────────────
-- Honey Pilates — owner / admin bootstrap
--
-- When mjalfino@gmail.com signs up via Supabase Auth, this trigger:
--   1. Promotes their members row to role = 'admin' (full RLS access
--      via the existing "instructors + admin read" policies)
--   2. Seeds a demo Monthly Unlimited membership so the dashboard
--      renders a populated state out of the gate
--   3. Seeds a demo 10-class pack with 6 credits left
--
-- The email is hardcoded — to add more admins later, either flip an
-- existing member's role via the SQL editor or extend the WHERE
-- clause here.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.tg_promote_owner_and_seed()
returns trigger security definer set search_path = public language plpgsql as $$
begin
  if lower(new.email) = 'mjalfino@gmail.com' then
    -- 1. promote to admin
    update public.members
       set role = 'admin',
           preferred_name = coalesce(preferred_name, 'Owner')
     where id = new.id;

    -- 2. demo monthly membership
    insert into public.memberships (
      member_id, plan_name, price_cents, classes_per_month,
      status, current_period_start, current_period_end
    ) values (
      new.id, 'Monthly Unlimited', 12900, null,
      'active', now(), now() + interval '30 days'
    );

    -- 3. demo 10-class pack
    insert into public.class_packs (
      member_id, label, credits_total, credits_left,
      purchased_at, expires_at, status, price_cents
    ) values (
      new.id, '10-Class Pack', 10, 6,
      now() - interval '20 days', now() + interval '70 days',
      'active', 28000
    );
  end if;
  return new;
end $$;

-- Fires AFTER tg_create_member_on_signup() — order matters because
-- we update the row that the prior trigger inserted.
create trigger tg_on_member_created_promote_owner
  after insert on public.members
  for each row execute function public.tg_promote_owner_and_seed();
