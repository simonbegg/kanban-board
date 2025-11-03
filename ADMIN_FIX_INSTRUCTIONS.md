# 🔧 Admin Pro Granting Fix - Instructions

## 🎯 Problem Identified

The admin Pro granting feature was failing due to **Row Level Security (RLS) policy violations** on the `entitlements` table.

**Error**: `new row violates row-level security policy for table "entitlements"`

## 🔧 Solution Applied

### 1. Created Admin RLS Policies
**File**: `supabase/migrations/admin_entitlements_policies.sql`

This migration adds RLS policies that allow:
- ✅ Users to manage their own entitlements
- ✅ Admins to manage ANY user's entitlements
- ✅ Proper email-based admin authentication

### 2. What You Need to Do

**Apply the migration to your Supabase database:**

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Paste the contents of `supabase/migrations/admin_entitlements_policies.sql`
4. Click **Run** to execute the migration

#### Option B: Using Supabase CLI
```bash
# If you have the CLI set up
supabase db push
```

## 📋 Migration Contents

The migration creates these policies on the `entitlements` table:

### User Policies
- `Users can view their own entitlements` - SELECT where auth.uid() = user_id
- `Users can insert their own entitlements` - INSERT for initial entitlement creation
- `Users can update their own entitlements` - UPDATE for self-upgrades

### Admin Policies  
- `Admins can view any entitlements` - SELECT for admin users
- `Admins can insert any entitlements` - INSERT for granting Pro
- `Admins can update any entitlements` - UPDATE for granting/revoking Pro
- `Admins can delete any entitlements` - DELETE for admin management

### Admin Email Detection
Admins are identified by:
- `simon@teamtwobees.com` ✅
- `simon@threelanes.app` ✅
- Any email ending in `@threelanes.app` ✅
- Any email ending in `@teamtwobees.com` ✅

## 🧪 Testing After Migration

Once you apply the migration:

1. **Go to http://localhost:3000/admin**
2. **Try granting Pro** to any user
3. **Should work without RLS errors**

### Expected Result
- ✅ No more "row-level security policy" errors
- ✅ Pro plan grants successfully
- ✅ User list updates to show new Pro status
- ✅ Revoke Pro also works

## 🔍 What Was Fixed

### Before (Broken)
```sql
-- No admin policies existed
-- Admins couldn't modify other users' entitlements
-- RLS blocked all cross-user operations
```

### After (Working)
```sql
-- Admin policies allow cross-user operations
-- Proper email-based admin authentication
-- Secure but functional admin access
```

## 🚀 Next Steps

1. **Apply the migration** (see instructions above)
2. **Test the admin panel** functionality
3. **Verify Pro granting works**
4. **Test Pro revoking also works**

---

## 📊 Current Status

- ✅ **Admin authentication**: Working correctly
- ✅ **API routes**: Fixed and ready
- ✅ **Frontend**: Ready to test
- ⏳ **Database policies**: Need migration applied

**Once you apply the migration, the complete Free vs Pro system will be functional!** 🎯

---

*Apply the migration and test the admin Pro granting functionality.*
