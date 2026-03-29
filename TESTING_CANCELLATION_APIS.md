# Testing Cancellation APIs with Insomnia

Step-by-step guide to test the Pro cancellation and export endpoints.

---

## Prerequisites

1. **Install Insomnia** - Download from https://insomnia.rest/download
2. **Have a test account** - You need a user account with Pro plan
3. **Local dev server running** - `npm run dev` on http://localhost:3000

---

## Step 1: Get Your Authentication Token

### Option A: From Browser DevTools (Easiest)

1. **Login to your app** at http://localhost:3000
2. **Open DevTools** (F12)
3. **Go to Application tab** → Storage → Cookies → http://localhost:3000
4. **Copy these cookies:**
   - `sb-access-token` 
   - `sb-refresh-token`

### Option B: Manual Login via API

**Request:**
```
POST http://localhost:3000/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "...",
  "user": { ... }
}
```

Copy the `access_token` - you'll use this in all requests.

---

## Step 2: Set Up Insomnia Environment

1. **Create a new Request Collection** named "ThreeLanes Cancellation"
2. **Create Environment Variables:**
   - Click the environment dropdown (top left)
   - Click "Manage Environments"
   - Create "Local Dev" environment:

```json
{
  "base_url": "http://localhost:3000",
  "access_token": "YOUR_ACCESS_TOKEN_HERE",
  "refresh_token": "YOUR_REFRESH_TOKEN_HERE"
}
```

---

## Step 3: Configure Cookie Jar (Important!)

Supabase Auth uses HTTP-only cookies. You need to set these up:

1. **Open Cookie Manager** (top menu → Application → Manage Cookies)
2. **Add cookies for localhost:3000:**

```
Name: sb-access-token
Value: YOUR_ACCESS_TOKEN
Domain: localhost
Path: /
Secure: false
HttpOnly: true

Name: sb-refresh-token  
Value: YOUR_REFRESH_TOKEN
Domain: localhost
Path: /
Secure: false
HttpOnly: true
```

---

## Step 4: Test Endpoints

### Test 1: Check Current Entitlements (GET)

**Setup:**
- Method: `GET`
- URL: `{{ _.base_url }}/api/admin/grant-pro`
- Headers: None needed (uses cookies)

**Expected Response:**
```json
{
  "users": [
    {
      "email": "your-email@example.com",
      "plan": "pro",
      "status": "active",
      "cancel_at_period_end": false,
      "boards": 5,
      "active_tasks": 250,
      "archived_tasks": 100
    }
  ]
}
```

**✅ Success:** You see your user with `"plan": "pro"`

---

### Test 2: Cancel Subscription (Scheduled)

**Setup:**
- Method: `POST`
- URL: `{{ _.base_url }}/api/subscription/cancel`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "cancelNow": false
}
```

**Expected Response:**
```json
{
  "success": true,
  "effectiveDate": "2025-12-05T23:39:00.000Z",
  "courtesyUntil": "2025-12-19T23:39:00.000Z",
  "message": "Pro plan will end on December 5, 2025 at 11:39 PM UTC. You'll have until December 19, 2025 at 11:39 PM UTC to resolve over-limit items."
}
```

**✅ Success:** You get dates for cancellation and courtesy period

**Verify in Database:**
```sql
SELECT 
  user_id,
  plan,
  status,
  cancel_at_period_end,
  cancel_effective_at,
  courtesy_until
FROM entitlements
WHERE user_id = 'your-user-id';
```

Should show:
- `status` = 'cancel_scheduled'
- `cancel_at_period_end` = true
- `cancel_effective_at` = future date
- `courtesy_until` = 14 days after effective date

---

### Test 3: Undo Cancellation

**Setup:**
- Method: `POST`
- URL: `{{ _.base_url }}/api/subscription/undo-cancel`
- Headers: `Content-Type: application/json`
- Body: (empty or `{}`)

**Expected Response:**
```json
{
  "success": true,
  "message": "Pro plan reactivated successfully. Your subscription will continue."
}
```

**✅ Success:** Cancellation is undone

**Verify in Database:**
```sql
SELECT 
  status,
  cancel_at_period_end,
  cancel_effective_at
FROM entitlements
WHERE user_id = 'your-user-id';
```

Should show:
- `status` = 'active'
- `cancel_at_period_end` = false
- `cancel_effective_at` = NULL

---

### Test 4: Cancel Immediately

**Setup:**
- Method: `POST`
- URL: `{{ _.base_url }}/api/subscription/cancel`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "cancelNow": true
}
```

**Possible Responses:**

**A) If Eligible (within 30 days of upgrade):**
```json
{
  "success": true,
  "effectiveDate": "2025-11-05T23:39:00.000Z",
  "courtesyUntil": "2025-11-19T23:39:00.000Z",
  "message": "Pro plan cancelled immediately. You have until November 19, 2025..."
}
```

**B) If Not Eligible:**
```json
{
  "error": "Not eligible for immediate cancellation",
  "message": "Immediate cancellation is only available within 30 days of upgrade or 7 days before renewal"
}
```

**✅ Success:** Either immediate cancellation or appropriate error

---

### Test 5: Request Board Export

First, **get a board ID** from your database:

```sql
SELECT id, title FROM boards LIMIT 1;
```

**Setup:**
- Method: `POST`
- URL: `{{ _.base_url }}/api/export/request`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "type": "board_csv",
  "boardId": "YOUR_BOARD_ID_HERE"
}
```

**Expected Response (Small Dataset):**
```json
{
  "success": true,
  "token": "abc123def456...",
  "downloadUrl": "/api/export/download/abc123def456...",
  "expiresAt": "2025-11-12T23:39:00.000Z",
  "taskCount": 45,
  "filename": "board-abc123-export.csv"
}
```

**Expected Response (Large Dataset >1000 tasks):**
```json
{
  "success": true,
  "token": "abc123def456...",
  "estimatedTime": "5-10 minutes",
  "taskCount": 1500,
  "message": "We're preparing your export. You'll receive an email when it's ready."
}
```

**✅ Success:** You get a token and download URL (or queued message)

---

### Test 6: Request Full Account Export

**Setup:**
- Method: `POST`
- URL: `{{ _.base_url }}/api/export/request`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "type": "account_json"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "xyz789...",
  "downloadUrl": "/api/export/download/xyz789...",
  "expiresAt": "2025-11-12T23:39:00.000Z",
  "taskCount": 250,
  "filename": "threelanes-account-export.json"
}
```

**✅ Success:** You get a token for full account export

---

### Test 7: Download Export

**Setup:**
- Method: `GET`
- URL: `{{ _.base_url }}/api/export/download/YOUR_TOKEN_HERE`
  - Use the token from Test 5 or 6
- Headers: None needed

**Expected Response:**
- **Status:** 200 OK
- **Headers:**
  - `Content-Type: text/csv` or `application/json`
  - `Content-Disposition: attachment; filename="..."`
- **Body:** CSV or JSON file content

**In Insomnia:**
- Click "Preview" tab to see formatted data
- Click "Timeline" tab to see download headers
- Right-click → "Save Response" to save file

**✅ Success:** File downloads successfully

---

### Test 8: Try to Use Token Again (Should Fail)

**Setup:**
- Method: `GET`
- URL: Same download URL from Test 7
- Headers: None

**Expected Response:**
```json
{
  "error": "Invalid, expired, or already used token"
}
```

**Status:** 410 Gone

**✅ Success:** Token is single-use, second attempt fails

---

## Step 5: Test Error Cases

### Test 9: Cancel When Not on Pro

1. **Downgrade to Free** (via admin API or database)
2. **Try to cancel:**

```
POST {{ _.base_url }}/api/subscription/cancel
Body: { "cancelNow": false }
```

**Expected:**
```json
{
  "error": "Only Pro users can cancel their subscription"
}
```

---

### Test 10: Export Non-Existent Board

```
POST {{ _.base_url }}/api/export/request
Body: {
  "type": "board_csv",
  "boardId": "00000000-0000-0000-0000-000000000000"
}
```

**Expected:**
```json
{
  "error": "Board not found"
}
```

---

### Test 11: Export Someone Else's Board

1. Get another user's board ID
2. Try to export it

**Expected:**
```json
{
  "error": "Not authorized to export this board"
}
```

---

## Troubleshooting

### Issue: "Unauthorized" (401)

**Causes:**
- Cookies not set correctly
- Access token expired
- Not logged in

**Fix:**
1. Get fresh tokens from browser
2. Update cookie jar in Insomnia
3. Or use Supabase client library to get new token

---

### Issue: "Board not found" (404)

**Causes:**
- Wrong board ID
- Board doesn't belong to you
- Board was deleted

**Fix:**
- Query database to get valid board ID:
```sql
SELECT id, title FROM boards WHERE user_id = 'your-user-id';
```

---

### Issue: Export returns empty/invalid file

**Causes:**
- Token expired before download
- Token already used
- Database has no data

**Fix:**
1. Request fresh export token
2. Download immediately (within 7 days)
3. Check board has tasks in database

---

### Issue: CORS errors in browser

**Not applicable** - Using Insomnia bypasses CORS

---

## Verification Checklist

After testing, verify in your database:

```sql
-- Check subscription events were logged
SELECT 
  event_type,
  event_data,
  created_at
FROM subscription_events
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;

-- Check export tokens were created
SELECT 
  token,
  export_type,
  status,
  expires_at,
  used_at
FROM export_tokens
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;

-- Check entitlements state
SELECT 
  plan,
  status,
  cancel_at_period_end,
  cancel_effective_at,
  courtesy_until,
  enforcement_state
FROM entitlements
WHERE user_id = 'your-user-id';
```

---

## Expected Database States

### After Scheduled Cancellation:
- `status` = 'cancel_scheduled'
- `cancel_at_period_end` = true
- `cancel_effective_at` = future date
- `plan` = still 'pro' (until effective date)

### After Undo:
- `status` = 'active'
- `cancel_at_period_end` = false
- `cancel_effective_at` = NULL

### After Immediate Cancellation:
- `status` = 'grace'
- `plan` = 'free'
- `courtesy_until` = 14 days from now
- `enforcement_state` = 'soft_warn'

### After Export Request:
- New row in `export_tokens` table
- `status` = 'ready' (small) or 'pending' (large)
- `expires_at` = 7 days from now

### After Export Download:
- `status` = 'used'
- `used_at` = current timestamp

---

## Next Steps

Once all tests pass:
1. ✅ Phase 2 APIs are working
2. Move to Phase 3 (Cron Jobs) or Phase 4 (UI)
3. Add email notifications
4. Build frontend components

---

## Quick Test Script

Save this as `test-cancellation.json` to import into Insomnia:

```json
{
  "name": "ThreeLanes Cancellation Tests",
  "requests": [
    {
      "name": "1. Check Entitlements",
      "method": "GET",
      "url": "{{ _.base_url }}/api/admin/grant-pro"
    },
    {
      "name": "2. Cancel (Scheduled)",
      "method": "POST",
      "url": "{{ _.base_url }}/api/subscription/cancel",
      "body": { "cancelNow": false }
    },
    {
      "name": "3. Undo Cancellation",
      "method": "POST",
      "url": "{{ _.base_url }}/api/subscription/undo-cancel"
    },
    {
      "name": "4. Export Board CSV",
      "method": "POST",
      "url": "{{ _.base_url }}/api/export/request",
      "body": { "type": "board_csv", "boardId": "REPLACE_WITH_BOARD_ID" }
    },
    {
      "name": "5. Export Account JSON",
      "method": "POST",
      "url": "{{ _.base_url }}/api/export/request",
      "body": { "type": "account_json" }
    }
  ]
}
```
