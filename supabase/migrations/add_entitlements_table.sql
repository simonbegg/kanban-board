-- Simplified entitlements table for MVP monetisation.
-- Limits are hardcoded in lib/cap-enforcement.ts (not stored in DB) so changing
-- them never requires a migration.
--
-- Free : 1 board,   50 active tasks/board
-- Pro  : 100 boards, 1 000 active tasks/board

create table if not exists public.entitlements (
  user_id                uuid        primary key references auth.users(id) on delete cascade,
  plan                   text        not null default 'free',
  paddle_subscription_id text,
  updated_at             timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- Users may only read their own row.
-- Writes are performed exclusively by the Paddle webhook handler
-- using the service-role key (bypasses RLS).
create policy "Users can read own entitlement"
  on public.entitlements
  for select
  using (auth.uid() = user_id);
