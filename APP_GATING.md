# ThreeLanes — Implement Free vs Pro Gating (Supabase)

> **Important:** All code below is **illustrative**. You **must adapt names, schemas, RLS policies, auth model (user vs workspace), and existing app code** before applying. Treat it as a blueprint to modify, not a paste-in replacement.

---

## Goal

Add product-led gating **now** (payments later):

1. Enforce **per-board active task caps** (archives don’t count)
2. Gate the **second board** behind Pro
3. Keep Free archive storage predictable (retention + caps)
4. Enforce rules at the **DB/RLS layer**
5. Provide clean hooks to flip plan on future billing webhooks

---

## Plan Summary

- **Free:** 1 board · **100 active tasks per board** · archives **don’t count** · auto-prune archives (90 days) · archived cap **1,000/user**
- **Pro:** Unlimited boards (soft safety ceiling in DB) · **100 active tasks per board** · keep archives indefinitely · archived cap **200,000/user** (hard ceiling)
- **UX:** Show per-board usage meter; warn at 80%/95%; “Upgrade to Pro” on 2nd board; “Board full” on 101st active task
- **Admin (temporary):** Manual _Grant/Remove Pro_ toggle; stub billing webhooks (no actual payments yet)

---

## Data Model & Migrations (SQL)

> **Illustrative – adjust table/column names, ownership model (user vs workspace), and indices.**

```sql
-- 1) Entitlements per user (or per workspace if you have teams)
create table if not exists entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  board_cap int not null default 1,                 -- Free=1, Pro=500 (soft cap)
  active_cap_per_board int not null default 100,    -- both Free & Pro
  archive_retention_days int not null default 90,   -- Free=90, Pro=~indef (36500)
  archived_cap_per_user int not null default 1000,  -- Free=1k, Pro=200k
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Optional helper for server use when switching to Pro
create or replace function entitlements_defaults_pro()
returns entitlements language sql stable as $$
  select null::uuid, 'pro', 500, 100, 36500, 200000, now(), now();
$$;

-- 2) Boards must record an owner (adjust if you already have workspace_id)
alter table boards
  add column if not exists owner_id uuid references auth.users(id);

create index if not exists boards_owner_idx on boards(owner_id);

-- 3) Tasks must have archived fields and a board reference
alter table tasks
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

-- Helpful indexes (adapt to your query patterns)
create index if not exists tasks_board_active_idx on tasks(board_id) where (archived = false);
create index if not exists tasks_archived_owner_idx on tasks(archived, archived_at);

-- Keep archived_at accurate when flipping archived -> true
create or replace function set_archived_at()
returns trigger language plpgsql as $$
begin
  if new.archived and (old.archived is distinct from true) then
    new.archived_at := coalesce(new.archived_at, now());
  end if;
  return new;
end $$;

drop trigger if exists trg_tasks_set_arch on tasks;
create trigger trg_tasks_set_arch
before update on tasks
for each row execute function set_archived_at();
```

---

## RLS Policies (SQL)

> **Illustrative – adapt to your auth model and existing policies.**  
> Principle: **ONE** write policy per table that combines **ownership AND cap checks** so OR-combining multiple policies can’t bypass limits.

```sql
-- Enable RLS
alter table boards enable row level security;
alter table tasks  enable row level security;
alter table entitlements enable row level security;

-- Ownership checks (adjust to workspace if needed)
create policy boards_owner_select on boards
for select using (owner_id = auth.uid());

create policy boards_owner_write on boards
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy tasks_owner_select on tasks
for select using (
  exists (select 1 from boards b where b.id = tasks.board_id and b.owner_id = auth.uid())
);

-- We'll replace generic "write" with safer, cap-aware policies below.

-- Entitlements: users can read their own; updates go through server only (no public update policy)
create policy entitlements_owner_select on entitlements
for select using (user_id = auth.uid());

-- Helper: current board count vs cap
create or replace function within_board_cap(p_user uuid)
returns boolean language sql stable as $$
  with e as (select board_cap from entitlements where user_id = p_user),
       c as (select count(*)::int as boards from boards where owner_id = p_user)
  select (select boards from c) < (select board_cap from e);
$$;

-- Helper: active tasks on board vs per-board cap
create or replace function within_active_per_board_cap(p_board uuid)
returns boolean language sql stable as $$
  with e as (
    select owner_id,
           (select active_cap_per_board from entitlements where user_id = b.owner_id) as cap
    from boards b where b.id = p_board
  )
  select (select count(*) from tasks t where t.board_id = p_board and t.archived = false)
         < (select cap from e);
$$;

-- Gate new boards by cap (Free users blocked at 2nd board)
create policy boards_insert_cap on boards
for insert
with check ( within_board_cap(auth.uid()) and owner_id = auth.uid() );

-- CAP-AWARE TASK POLICIES (single policies to avoid OR-bypass)
-- Insert: must own the board AND either inserting archived task OR under active cap
create policy tasks_insert_capaware on tasks
for insert
with check (
  exists (select 1 from boards b where b.id = new.board_id and b.owner_id = auth.uid())
  and (
    new.archived = true
    or (new.archived = false and within_active_per_board_cap(new.board_id))
  )
);

-- Update: must own, AND if ending state is active, must be under cap (prevents un-archiving above cap)
create policy tasks_update_capaware on tasks
for update
using (
  exists (select 1 from boards b where b.id = tasks.board_id and b.owner_id = auth.uid())
)
with check (
  exists (select 1 from boards b where b.id = new.board_id and b.owner_id = auth.uid())
  and (
    new.archived = true
    or (new.archived = false and within_active_per_board_cap(new.board_id))
  )
);

-- Delete: owner only (optional)
create policy tasks_delete_owner on tasks
for delete using (
  exists (select 1 from boards b where b.id = tasks.board_id and b.owner_id = auth.uid())
);
```

---

## Scheduled Pruning (SQL helper + Edge Function outline)

> **Illustrative – adjust for workspace, batching, and error handling.**

**SQL helper (per user):**

```sql
create or replace function prune_archives_for_user(p_user uuid)
returns void language plpgsql as $$
declare
  keep_days int;
  cap int;
begin
  select archive_retention_days, archived_cap_per_user
  into keep_days, cap
  from entitlements where user_id = p_user;

  -- Age-based prune (Free typically keeps 90 days)
  delete from tasks t
  using boards b
  where t.board_id = b.id
    and b.owner_id = p_user
    and t.archived = true
    and t.archived_at < now() - (keep_days || ' days')::interval;

  -- Cap-based prune (oldest archived first)
  with ranked as (
    select t.id,
           row_number() over (order by t.archived_at asc nulls first) as rn
    from tasks t
    join boards b on b.id = t.board_id
    where b.owner_id = p_user and t.archived = true
  )
  delete from tasks t
  using ranked r
  where t.id = r.id and r.rn > cap;
end $$;
```

**Edge Function (TypeScript) — outline only:**

```ts
// Illustrative only: adapt to your runtime and SDK setup
// Goal: nightly, iterate entitlements and call the SQL function per user

import { createClient } from "@supabase/supabase-js";

export async function runPruneJob() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!
  );

  // 1) fetch all entitlements (or chunked)
  const { data: ents, error } = await supabase
    .from("entitlements")
    .select("user_id, plan");

  if (error) throw error;

  for (const e of ents ?? []) {
    // 2) call RPC/SQL function
    const { error: rpcError } = await supabase.rpc("prune_archives_for_user", {
      p_user: e.user_id,
    });
    if (rpcError) {
      console.error("Prune error for", e.user_id, rpcError);
      // decide whether to continue or bail
    }
  }
}

// Schedule daily via Supabase Scheduled Functions / cron
```

---

## Frontend Changes (high level)

- **Per-board usage meter:** `Active X/100` (count `archived=false`)
- **Warnings:** Show at **80%** and **95%**
- **On insert/update failure (RLS error):** Map to friendly modals
  - “Board full (100 active). Archive something or create a new board.”
  - “Free plan includes 1 board. Upgrade to Pro to add another.”
- **Temporary admin toggle:** “Grant/Remove Pro” → server action flips `entitlements` (service role)

---

## Webhook Stubs (for future billing)

> No billing provider yet; just wire the handlers so drop-in is trivial.

- `POST /api/billing/webhook` (server-only)
  - `subscription_created` → set `plan='pro'`, apply Pro defaults
  - `subscription_canceled` → set `plan='free'`, apply Free defaults
  - Log request ids, signatures, and payloads; no external calls yet

---

## Acceptance Criteria

1. **Board cap**

   - Free user: 1 board; attempt 2nd → blocked by RLS; “Upgrade to Pro” modal shown
   - After admin toggles Pro → can create more boards

2. **Per-board active cap**

   - At 100 active tasks: 101st insert → blocked; “Board full” modal
   - Archiving reduces active count → next insert succeeds
   - Un-archiving at 100 active → blocked by RLS

3. **Archive pruning**

   - Free: nightly job removes archived older than 90 days and trims to ≤ 1,000/user
   - Pro: no age prune; hard ceiling 200k archived (safety)

4. **Security**

   - All caps enforced via RLS; no bypass via API
   - Users can **read** their entitlements; **updates only via server** (service role)

5. **DX**
   - Minimal indexes; no full scans in hot paths
   - Clear error mapping to UX modals

---

## Implementation Notes

- If you use **workspace/team** ownership, replace `owner_id` / `user_id` everywhere with `workspace_id` consistently.
- Keep code **payment-agnostic**: plan flips via admin/server today; a billing webhook will call the same code later.
- Consider adding a **daily usage rollup** table and simple alerting to watch storage growth.
- If you already have RLS, **merge** policies carefully; prefer single cap-aware policies per table to avoid OR-bypass.

---

## Deliverables

1. SQL migrations (entitlements, indexes, functions, RLS policies) — **illustrative, adapt as needed**
2. Edge Function for pruning + cron schedule — **outline provided**
3. Frontend: usage meter, warning toasts, modals, RLS error mapping
4. Admin: _Grant/Remove Pro_ toggle (server-only)
5. Webhook stub endpoint + plan-flip server code (no billing yet)

---

**Reminder:** All snippets are **for illustration**. Update names, ownership, policies, and logic to fit **existing database and codebase** before applying.
