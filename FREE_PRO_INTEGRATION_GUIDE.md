# 🎯 Free vs Pro Integration Guide

## ✅ What You Should See Now

### 1. Usage Meter in Header
**Location**: Top right of the board page, next to settings
**What it shows**: 
- Your plan (Free/Pro) with badge
- Current board usage (e.g., "1/1 boards")
- Warning icon if approaching limits

### 2. Cap Warning Banner
**Location**: Below the header, above the kanban board
**When it appears**: 
- When you're at 80%+ of any limit
- Critical alerts at 95%+ usage
- Contextual messages based on limit type

### 3. Upgrade Modal
**Trigger**: 
- Click "Upgrade to Pro" button in usage meter
- Click "Upgrade" button in warning banners
- Automatic when hitting hard limits

**What it contains**:
- Side-by-side plan comparison
- Pricing information ($0 vs $9/month)
- Feature lists
- FAQ section
- Current usage statistics

### 4. Admin Panel
**Location**: 
- Direct URL: `/admin`
- User menu dropdown (if you're admin)
- "Admin Panel" link with shield icon

**What it shows**:
- Complete list of all users
- Plan management (Grant/Revoke Pro)
- Usage statistics
- Search and filter capabilities

## 🚀 How to Test the Features

### Testing Usage Meter
1. Go to `/board` 
2. Look in top right header - you should see "Free 1/1 boards"
3. The badge should be blue/gray for Free plan

### Testing Cap Warnings
1. Since you're on Free plan with 1 board limit, you should see warnings
2. Try creating a second board - should be blocked
3. Warning banner should appear about board limits

### Testing Upgrade Modal
1. Click "Upgrade to Pro" in the usage meter
2. Modal should open with plan comparison
3. Should show your current usage stats
4. FAQ section should be expandable

### Testing Admin Panel
1. Click your profile picture in top right
2. You should see "Admin Panel" option (if your email ends with @threelanes.app)
3. Click it to go to `/admin`
4. Should see user management interface

## 🔧 If Something's Not Working

### Check These Things:

1. **Database Migrations Applied?**
   ```sql
   -- Check if entitlements table exists
   SELECT * FROM entitlements LIMIT 1;
   
   -- Check if you have entitlements
   SELECT * FROM entitlements WHERE user_id = 'your-user-id';
   ```

2. **Components Imported Correctly?**
   - Check browser console for import errors
   - Look for missing component errors

3. **User Authentication Working?**
   - Make sure you're logged in
   - Check that user.id is available

4. **Admin Access?**
   - Your email should end with @threelanes.app
   - Check the admin email list in admin/page.tsx

## 🎨 Expected Visual Flow

### Normal State (Free Plan)
```
[ThreeLanes Logo]                    [Free 1/1 boards] [⚙️] [🌙] [👤]
─────────────────────────────────────────────────────────────
⚠️ Board Limit Warning: You're using 1 of 1 boards (100%).
   Consider upgrading to Pro for unlimited boards.
─────────────────────────────────────────────────────────────
[Kanban Board Content]
```

### When Upgrade Modal Opens
```
┌─────────────────────────────────────────────────────────┐
│                Upgrade to ThreeLanes Pro               │
│ You've reached your board limit. Upgrade to Pro to      │
│ create unlimited boards.                                │
│                                                         │
│  [Free Plan]              [Pro Plan ⭐]                 │
│  $0/month                  $9/month                     │
│  1 board                   Unlimited boards            │
│  100 tasks/board           100 tasks/board             │
│  1,000 archived            200,000 archived            │
│  90-day retention          Unlimited retention         │
│                                                         │
│  [Upgrade to Pro] [Contact Support]                    │
└─────────────────────────────────────────────────────────┘
```

### Admin Panel View
```
[ThreeLanes Admin]                           [Back to Board] [👤]
─────────────────────────────────────────────────────────────
📊 Total Users: 5  📊 Pro Users: 1  📊 Free Users: 4
📊 Total Boards: 7  📊 Active Tasks: 45  📊 Archived: 23

┌─ Users (5) ───────────────────────────────────────────┐
│ User                    Plan    Usage    Actions      │
│ simon@threelanes.app    Pro     3/500    [Revoke Pro] │
│ user@example.com        Free    1/1      [Grant Pro]   │
│ test@test.com           Free    1/1      [Grant Pro]   │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Quick Test Commands

### Check Database
```sql
-- Verify your entitlements
SELECT plan, board_cap, active_cap_per_board 
FROM entitlements 
WHERE user_id = 'your-user-id';

-- Check your usage
SELECT COUNT(*) as board_count FROM boards WHERE user_id = 'your-user-id';
```

### Test API Endpoints
```bash
# Test usage stats (in browser console)
fetch('/api/admin/grant-pro').then(r => r.json()).then(console.log)

# Test cap enforcement
fetch('/api/admin/grant-pro', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({userId: 'your-user-id'})
}).then(r => r.json()).then(console.log)
```

## 🎯 Next Steps

Once you confirm everything is working:

1. **Run the migrations** if you haven't already
2. **Test creating boards** - should be blocked at 1 for Free users
3. **Test admin panel** - grant yourself Pro, verify limits change
4. **Test archive pruning** - check the cron job setup

The system should now be fully functional with all the Free vs Pro gating features visible and working! 🚀
