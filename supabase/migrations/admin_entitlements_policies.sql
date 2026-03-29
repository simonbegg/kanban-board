-- Admin RLS policies for the entitlements table.
--
-- Regular users can only read their own row.
-- Admin API routes use the service-role key (bypasses RLS entirely), so these
-- policies are only needed if you ever call entitlements from a client
-- authenticated as an admin user.
--
-- Admin emails / domains are kept in sync with lib/admin.ts.

-- Helper function: returns true if the calling user is an admin.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
as $$
  select (
    auth.email() = 'simon@teamtwobees.com'     or
    auth.email() = 'simon@threelanes.app'       or
    auth.email() like '%@threelanes.app'        or
    auth.email() like '%@teamtwobees.com'
  );
$$;

-- Drop any previously created admin policies so this migration is idempotent.
drop policy if exists "Users can read own entitlement"       on public.entitlements;
drop policy if exists "Admins can view any entitlements"     on public.entitlements;
drop policy if exists "Admins can insert any entitlements"   on public.entitlements;
drop policy if exists "Admins can update any entitlements"   on public.entitlements;
drop policy if exists "Admins can delete any entitlements"   on public.entitlements;

-- Users: read their own row only.
create policy "Users can read own entitlement"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- Admins: full access across all rows.
create policy "Admins can view any entitlements"
  on public.entitlements for select
  using (public.is_admin());

create policy "Admins can insert any entitlements"
  on public.entitlements for insert
  with check (public.is_admin());

create policy "Admins can update any entitlements"
  on public.entitlements for update
  using (public.is_admin());

create policy "Admins can delete any entitlements"
  on public.entitlements for delete
  using (public.is_admin());
