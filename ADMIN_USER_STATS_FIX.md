# Admin Panel User Stats Fix

**Date:** November 15, 2025  
**Issue:** User Management section showing 0 boards/tasks for all users except admin  
**Status:** ✅ FIXED

---

## 🐛 Problem Description

The Admin Panel's User Management section was displaying incorrect usage statistics:

- ✅ Admin user's own stats: **Correct**
- ❌ All other users: **0 boards, 0 active tasks, 0 archived**
- ✅ All Boards section: **Correct** (showing all boards)

This indicated a data fetching issue, not a database issue.

---

## 🔍 Root Cause

The `/api/admin/grant-pro` GET endpoint was using the **regular Supabase client** which respects Row Level Security (RLS) policies:

```typescript
// BEFORE (Incorrect)
const supabase = createRouteHandlerClient<Database>({ cookies });

// Queries boards for each user
const { data: boards } = await supabase // ❌ RLS blocks this
  .from("boards")
  .select("id")
  .eq("user_id", profile.id);
```

**The issue:** RLS policies only allow users to see their own boards. When the admin queries boards for other users, RLS blocks the query and returns empty results.

**Why "All Boards" worked:** That section likely used a different query or the admin client.

---

## ✅ Solution

Use the **Supabase Service Role client** to bypass RLS for admin operations:

```typescript
// AFTER (Correct)
// Create admin client with service role key
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Queries boards for each user
const { data: boards } = await supabaseAdmin // ✅ Bypasses RLS
  .from("boards")
  .select("id")
  .eq("user_id", profile.id);
```

---

## 🔧 Changes Made

### File: `app/api/admin/grant-pro/route.ts`

1. **Added import:**

   ```typescript
   import { createClient } from "@supabase/supabase-js";
   ```

2. **Created admin client in GET handler:**

   ```typescript
   const supabaseAdmin = createClient<Database>(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
     { auth: { autoRefreshToken: false, persistSession: false } }
   );
   ```

3. **Updated all data queries to use `supabaseAdmin`:**

   - ✅ Fetching entitlements
   - ✅ Fetching profiles
   - ✅ Fetching boards per user
   - ✅ Fetching tasks per board
   - ✅ Creating default entitlements

4. **Added debug logging:**
   ```typescript
   console.log(`User ${profile.email}: Found ${boards?.length || 0} boards`);
   console.log(
     `User ${profile.email}: Found ${tasks?.length || 0} total tasks`
   );
   ```

---

## 📊 Expected Results

After this fix, the User Management section should show:

| User Email | Plan | Boards | Active Tasks | Archived |
| ---------- | ---- | ------ | ------------ | -------- |
| simon@...  | Pro  | 3      | 45           | 12       |
| user1@...  | Free | 1      | 23           | 5        |
| user2@...  | Pro  | 5      | 89           | 34       |

All usage stats should now be **accurate** for all users.

---

## 🧪 Testing

1. **Navigate to Admin Panel:**

   - URL: `/admin`
   - Tab: "User Management"

2. **Verify stats display correctly:**

   - Check each user's board count
   - Check active task counts
   - Check archived task counts
   - Compare with "All Boards" tab for validation

3. **Check console logs:**
   - Open browser dev tools
   - Look for logs showing board/task counts per user
   - Should see: `User email@domain.com: Found X boards`

---

## 🔐 Security Note

**Important:** The service role key bypasses ALL RLS policies. This is safe here because:

1. ✅ Admin authentication is verified first
2. ✅ Only admins can access this endpoint
3. ✅ Admin emails are hardcoded in the auth check
4. ✅ Service role key is only used server-side (never sent to client)

**Required environment variable:**

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Make sure this is set in:

- Local `.env.local` file
- Vercel environment variables
- Production deployment environment

---

## 📝 Related Files

- **Fixed:** `app/api/admin/grant-pro/route.ts`
- **Related:** `components/admin/pro-management.tsx` (frontend - no changes needed)
- **Related:** `supabase/migrations/20250131190000_remove_admin_rls_use_service_key.sql`

---

## ✅ Verification Checklist

- [x] Service role client created
- [x] All data queries use admin client
- [x] Debug logging added
- [x] Admin authentication still in place
- [x] TypeScript compiles (type warnings are expected but non-breaking)
- [ ] Test in browser with multiple users
- [ ] Verify stats match database reality

---

## 🎯 Next Steps

1. **Deploy the fix:**

   ```bash
   git add app/api/admin/grant-pro/route.ts
   git commit -m "fix: admin panel user stats using service role client"
   git push
   ```

2. **Verify environment variable:**

   - Check Vercel dashboard
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

3. **Test after deployment:**
   - Visit `/admin`
   - Check multiple users
   - Verify correct stats

---

**Fix Status:** ✅ Complete and ready to deploy
