# 🚀 ThreeLanes Free vs Pro Gating - Implementation Plan

## 📊 Current State Analysis

**Existing Structure:**
- ✅ **Boards table**: Already has `user_id` (ownership model)
- ✅ **Tasks table**: Already has `archived` + `archived_at` fields
- ✅ **RLS policies**: Basic user ownership in place
- ✅ **TypeScript types**: Defined in `lib/supabase.ts`
- ✅ **Archive UI**: `archived-tasks-dialog.tsx` exists

**Gaps to Fill:**
- ❌ **Entitlements table**: Missing plan/cap tracking
- ❌ **Cap-aware RLS policies**: Current policies don't enforce limits
- ❌ **Usage meters**: No UI showing board/task counts
- ❌ **Admin controls**: No manual Pro granting
- ❌ **Archive pruning**: No automated cleanup

---

## 🎯 Implementation Strategy

### Phase 1: Database Foundation
1. Create `entitlements` table with plan limits
2. Add cap-aware RLS policies (replace existing ones)
3. Create helper functions for cap checking
4. Update TypeScript types

### Phase 2: Backend Enforcement
1. Create admin API for manual Pro granting
2. Add webhook stubs for future billing
3. Create archive pruning Edge Function
4. Add usage checking utilities

### Phase 3: Frontend UX
1. Add usage meters to board UI
2. Create upgrade modals/warnings
3. Map RLS errors to user-friendly messages
4. Add admin panel for Pro management

### Phase 4: Testing & Polish
1. Test all cap enforcement scenarios
2. Verify archive pruning works
3. Test admin Pro granting
4. Documentation and cleanup

---

## 📋 Detailed Implementation Tasks

### 🗄️ Phase 1: Database (Migrations)

#### 1.1 Create Entitlements Table
```sql
-- Migration: add_entitlements.sql
CREATE TABLE IF NOT EXISTS public.entitlements (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  board_cap INT NOT NULL DEFAULT 1,
  active_cap_per_board INT NOT NULL DEFAULT 100,
  archive_retention_days INT NOT NULL DEFAULT 90,
  archived_cap_per_user INT NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.2 Update Existing Tables
```sql
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_board_archived ON public.tasks(board_id, archived) WHERE (archived = false);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_owner ON public.tasks(archived, archived_at);
```

#### 1.3 Helper Functions
```sql
-- Cap checking functions
CREATE OR REPLACE FUNCTION within_board_cap(p_user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT (
    SELECT COUNT(*) FROM public.boards WHERE user_id = p_user
  ) < (
    SELECT board_cap FROM public.entitlements WHERE user_id = p_user
  );
$$;

CREATE OR REPLACE FUNCTION within_active_per_board_cap(p_board UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT (
    SELECT COUNT(*) FROM public.tasks WHERE board_id = p_board AND archived = false
  ) < (
    SELECT e.active_cap_per_board 
    FROM public.boards b 
    JOIN public.entitlements e ON b.user_id = e.user_id 
    WHERE b.id = p_board
  );
$$;
```

#### 1.4 Replace RLS Policies
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can insert columns to their boards" ON public.columns;

-- Create cap-aware policies
CREATE POLICY "Users can insert boards within cap" ON public.boards 
FOR INSERT WITH CHECK (auth.uid() = user_id AND within_board_cap(auth.uid()));

-- Similar cap-aware policies for tasks and columns
```

### ⚙️ Phase 2: Backend

#### 2.1 Admin API Endpoints
```typescript
// app/api/admin/grant-pro/route.ts
// app/api/admin/revoke-pro/route.ts
```

#### 2.2 Usage Checking Utilities
```typescript
// lib/usage.ts - functions to check current usage vs caps
// lib/entitlements.ts - plan management functions
```

#### 2.3 Archive Pruning
```typescript
// app/api/cron/prune-archives/route.ts - scheduled cleanup
```

#### 2.4 Webhook Stubs
```typescript
// app/api/billing/webhook/route.ts - future billing integration
```

### 🎨 Phase 3: Frontend

#### 3.1 Usage Meter Components
```typescript
// components/usage-meter.tsx - shows X/100 tasks per board
// components/board-usage-indicator.tsx - board count indicator
```

#### 3.2 Upgrade Modals
```typescript
// components/upgrade-modal.tsx - shown when caps exceeded
// components/board-limit-modal.tsx - specific to board limits
// components/task-limit-modal.tsx - specific to task limits
```

#### 3.3 Error Mapping
```typescript
// lib/error-mapping.ts - convert RLS errors to user-friendly messages
// hooks/use-cap-enforcement.ts - handle cap violations gracefully
```

#### 3.4 Admin Panel
```typescript
// components/admin/pro-management.tsx - manual Pro granting UI
```

### 🧪 Phase 4: Integration Points

#### 4.1 Update Existing Components
- `supabase-kanban-board.tsx`: Add usage meters
- `add-task-dialog.tsx`: Check task caps before creation
- `board-selector.tsx`: Check board caps before creation
- `archived-tasks-dialog.tsx`: Show archive count vs limits

#### 4.2 Type Updates
- Update `lib/supabase.ts` with entitlements types
- Add archived fields to task types (if missing)

---

## 🔧 Key Technical Decisions

### 1. Ownership Model
- **Keep existing**: `user_id` on boards (no workspace changes needed)
- **Entitlements**: Per-user, not per-workspace

### 2. Cap Enforcement Strategy
- **Primary**: RLS policies (database-level, cannot bypass)
- **Secondary**: Frontend validation (better UX)
- **Fallback**: Server-side checks (defense in depth)

### 3. Archive Strategy
- **Free**: 90-day retention + 1,000 cap
- **Pro**: Indefinite + 200,000 cap (safety limit)
- **Pruning**: Daily cron job

### 4. Error Handling
- **RLS violations** → User-friendly upgrade prompts
- **Rate limiting** → Clear messaging about limits
- **Admin actions** → Audit logging

---

## 📝 Implementation Order

**Priority 1 (Core Functionality):**
1. Database migration + RLS policies
2. Basic usage meter UI
3. Error mapping for cap violations

**Priority 2 (Admin & Polish):**
4. Admin Pro granting UI
5. Archive pruning system
6. Upgrade modals and warnings

**Priority 3 (Future Prep):**
7. Billing webhook stubs
8. Analytics and monitoring
9. Documentation

---

## 🚨 Risk Mitigation

### 1. Breaking Changes
- Test RLS policies thoroughly in staging
- Keep existing policies as backup during transition
- Gradual rollout with feature flags

### 2. Performance Impact
- Add indexes before enabling RLS
- Monitor query performance
- Optimize cap-checking functions

### 3. Data Migration
- Ensure all existing users get default entitlements
- Handle edge cases (users already over caps)
- Backup strategy before major changes

---

## ✅ Acceptance Criteria

### Board Caps:
- Free users: 1 board max
- Pro users: 500 boards (soft limit)
- 2nd board creation blocked for free users
- Clear upgrade messaging

### Task Caps:
- 100 active tasks per board for all users
- 101st task blocked with clear message
- Archiving reduces active count
- Un-archiving respects caps

### Archive Management:
- Free: 90-day auto-prune + 1,000 cap
- Pro: No age prune + 200,000 safety cap
- Daily cleanup job runs successfully

### UX Quality:
- Usage meters show current vs limits
- Warnings at 80%/95% thresholds
- Error messages map to upgrade prompts
- Admin can grant/remove Pro access

---

## 📝 Implementation Notes

- If you use **workspace/team** ownership, replace `user_id` everywhere with `workspace_id` consistently
- Keep code **payment-agnostic**: plan flips via admin/server today; billing webhook will call the same code later
- Consider adding a **daily usage rollup** table and simple alerting to watch storage growth
- If you already have RLS, **merge** policies carefully; prefer single cap-aware policies per table to avoid OR-bypass

---

**Status: Plan Complete ✅**
**Next: Phase 1 - Database Foundation Implementation**
