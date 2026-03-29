# Phase 1: Paddle Account & Product Setup

**Status:** 🚧 In Progress  
**Started:** November 16, 2025  
**Expected Duration:** 3-5 days

---

## 🎯 Phase 1 Objectives

1. ✅ Create and verify Paddle account (Sandbox + Production)
2. ✅ Configure ThreeLanes Pro product
3. ✅ Obtain all required API keys and IDs
4. ✅ Set up environment variables
5. ✅ Review Paddle documentation

---

## 📋 Step-by-Step Implementation

### Step 1.1: Create Paddle Account

#### Action Items:

1. **Go to Paddle Signup:**

   - Visit: https://vendors.paddle.com/signup
   - Or: https://www.paddle.com/billing (for Paddle Billing)

2. **Choose Account Type:**

   - **Recommended:** Paddle Billing (newer platform)
   - Alternative: Paddle Classic
   - Note: This guide assumes Paddle Billing

3. **Complete Registration:**

   - [ ] Enter business email
   - [ ] Set password
   - [ ] Verify email address
   - [ ] Complete business information:
     - Business name: ThreeLanes (or your company name)
     - Business type: SaaS
     - Country: (your location)
     - Tax ID (if applicable)

4. **Set Up Sandbox Environment:**
   - [ ] Enable sandbox mode in Paddle dashboard
   - [ ] Sandbox is for testing - no real payments
   - [ ] You'll switch to production later

**Deliverable:** ✅ Paddle account created and email verified

---

### Step 1.2: Configure ThreeLanes Pro Product

#### Action Items:

1. **Navigate to Products:**

   - Go to: Paddle Dashboard → Catalog → Products
   - Click "Add Product"

2. **Create Product:**

   ```
   Product Name: ThreeLanes Pro
   Description: Premium plan with unlimited boards and advanced features
   Tax Category: SaaS (Software as a Service)
   ```

3. **Set Up Pricing:**

   - Click "Add Price" on your product
   - Configure:
     ```
     Price Name: Monthly Subscription
     Amount: $6.00 USD
     Billing Period: Monthly (every 1 month)
     Trial Period: None (or 14 days if you want)
     ```

4. **Configure Additional Settings:**

   - [ ] **Cancellation:** Allow customers to cancel anytime
   - [ ] **Renewal:** Automatic monthly renewal
   - [ ] **Proration:** Enable if you want mid-cycle upgrades
   - [ ] **Currency:** USD (add more currencies if needed)

5. **Save Product:**
   - [ ] Click "Save" or "Create Product"
   - [ ] Note down the **Product ID** (you'll need this)
   - [ ] Note down the **Price ID** (you'll need this too)

**Important:** Make sure you're creating this in **Sandbox** mode first!

**Deliverable:** ✅ ThreeLanes Pro product configured with $6/month pricing

---

### Step 1.3: Obtain API Keys and IDs

#### Action Items:

1. **Get Seller/Vendor ID:**

   - Go to: Paddle Dashboard → Developer Tools → Authentication
   - Find your **Vendor ID** or **Seller ID**
   - Copy this - you'll need it for `NEXT_PUBLIC_PADDLE_VENDOR_ID`

2. **Generate API Key:**

   - Go to: Paddle Dashboard → Developer Tools → Authentication
   - Click "Create API Key" or "New API Key"
   - Name it: "ThreeLanes Production" (or "Sandbox" for testing)
   - Select scopes:
     - [x] Read/Write Subscriptions
     - [x] Read/Write Products
     - [x] Read/Write Customers
     - [x] Read/Write Transactions
   - Copy the API key immediately (you can't view it again!)
   - Store it securely

3. **Get Product and Price IDs:**

   - Go to: Paddle Dashboard → Catalog → Products
   - Click on "ThreeLanes Pro"
   - Copy the **Product ID** (format: `pro_xxxxx` or similar)
   - Copy the **Price ID** (format: `pri_xxxxx` or similar)

4. **Get Webhook Secret:**
   - Go to: Paddle Dashboard → Developer Tools → Notifications
   - Click "Add Notification Destination" or "Add Endpoint"
   - Set URL: `https://your-domain.vercel.app/api/billing/webhook`
   - For now, use: `https://webhook.site` (temporary for testing)
   - Select events to receive:
     - [x] subscription.created
     - [x] subscription.updated
     - [x] subscription.canceled
     - [x] transaction.completed
     - [x] transaction.payment_failed
   - Copy the **Webhook Secret** (format: `pdl_ntfset_xxxxx`)

**Security Note:** Never commit API keys to git!

**Deliverable:** ✅ All API keys and IDs collected securely

---

### Step 1.4: Set Up Environment Variables

#### Action Items:

1. **Update `.env.local`:**
   - Add the following variables to your `.env.local` file:

```bash
# Paddle Configuration
# Get these from: https://vendors.paddle.com/authentication

# Public keys (safe to expose in client-side code)
NEXT_PUBLIC_PADDLE_VENDOR_ID=your_vendor_id_here
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_TOKEN=your_client_side_token_here

# Private keys (NEVER expose these!)
PADDLE_API_KEY=your_api_key_here
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here

# Product IDs
PADDLE_PRODUCT_ID=pro_xxxxx
PADDLE_PRICE_ID=pri_xxxxx

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **Add to Vercel Environment Variables:**

   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add each variable above
   - Set environment: Production, Preview, Development (as needed)

3. **Update `.env.example` (for documentation):**
   - Create/update `.env.example` with placeholder values
   - This helps other developers know what's needed

**Security Checklist:**

- [ ] `.env.local` is in `.gitignore`
- [ ] Never commit real API keys
- [ ] Use different keys for sandbox vs production
- [ ] Rotate keys if accidentally exposed

**Deliverable:** ✅ Environment variables configured locally and in Vercel

---

### Step 1.5: Verify Paddle SDK Compatibility

#### Action Items:

1. **Check Paddle.js Documentation:**

   - Visit: https://developer.paddle.com/paddlejs/overview
   - Review supported features
   - Check browser compatibility

2. **Review Webhook Events:**

   - Visit: https://developer.paddle.com/webhooks/overview
   - Understand event structure
   - Note which events you'll handle

3. **Read Subscription Lifecycle:**

   - Visit: https://developer.paddle.com/concepts/subscriptions/subscription-lifecycle
   - Understand subscription states
   - Plan for edge cases

4. **Review Best Practices:**
   - Webhook security: https://developer.paddle.com/webhooks/signature-verification
   - Testing guide: https://developer.paddle.com/concepts/testing/sandbox
   - Error handling: https://developer.paddle.com/api-reference/about/errors

**Deliverable:** ✅ Paddle documentation reviewed and understood

---

## 📝 Environment Variables Reference

### Required Variables:

| Variable                         | Type   | Description                      | Example                  |
| -------------------------------- | ------ | -------------------------------- | ------------------------ |
| `NEXT_PUBLIC_PADDLE_VENDOR_ID`   | Public | Your Paddle seller/vendor ID     | `123456`                 |
| `NEXT_PUBLIC_PADDLE_ENVIRONMENT` | Public | Environment (sandbox/production) | `sandbox`                |
| `NEXT_PUBLIC_PADDLE_TOKEN`       | Public | Client-side token (if required)  | `live_xxx`               |
| `PADDLE_API_KEY`                 | Secret | Server-side API key              | `xxx_xxx_xxx`            |
| `PADDLE_WEBHOOK_SECRET`          | Secret | Webhook signature secret         | `pdl_ntfset_xxx`         |
| `PADDLE_PRODUCT_ID`              | Secret | ThreeLanes Pro product ID        | `pro_xxxxx`              |
| `PADDLE_PRICE_ID`                | Secret | Monthly price ID                 | `pri_xxxxx`              |
| `NEXT_PUBLIC_APP_URL`            | Public | Your app's URL                   | `https://threelanes.app` |

---

## ✅ Phase 1 Completion Checklist

### Account Setup:

- [ ] Paddle account created
- [ ] Email verified
- [ ] Business information completed
- [ ] Sandbox mode enabled

### Product Configuration:

- [ ] ThreeLanes Pro product created
- [ ] $6/month pricing configured
- [ ] Billing cycle set to monthly
- [ ] Product status: Active

### API Keys & IDs:

- [ ] Vendor ID obtained
- [ ] API key generated
- [ ] Product ID copied
- [ ] Price ID copied
- [ ] Webhook secret obtained

### Environment Setup:

- [ ] `.env.local` updated with all variables
- [ ] Vercel environment variables configured
- [ ] `.env.example` created/updated
- [ ] Variables tested locally

### Documentation:

- [ ] Paddle.js docs reviewed
- [ ] Webhook events understood
- [ ] Subscription lifecycle learned
- [ ] Best practices noted

---

## 🚨 Common Issues & Solutions

### Issue 1: Can't Find Vendor ID

**Solution:** Go to Developer Tools → Authentication → Look for "Seller ID" or "Vendor ID" at the top

### Issue 2: API Key Not Working

**Solution:**

- Make sure you're using the right environment (sandbox vs production)
- Check if key has correct scopes enabled
- Verify key hasn't expired

### Issue 3: Webhook Not Receiving Events

**Solution:**

- Use webhook.site temporarily to test
- Check URL is correct and accessible
- Verify webhook is enabled in Paddle dashboard

### Issue 4: Product Not Visible

**Solution:**

- Make sure product status is "Active"
- Check you're in the right environment (sandbox/production)
- Refresh Paddle dashboard

---

## 📊 Testing Checklist

Before moving to Phase 2, verify:

1. **Account Access:**

   - [ ] Can log into Paddle dashboard
   - [ ] Can see sandbox environment
   - [ ] Can view products

2. **Product Visibility:**

   - [ ] ThreeLanes Pro appears in product list
   - [ ] Pricing shows $6/month
   - [ ] Product is active

3. **API Key Validation:**
   - [ ] Can make test API call (optional at this stage)
   - [ ] Environment variables load correctly
   - [ ] No console errors related to missing vars

---

## 🔄 Next Steps

Once Phase 1 is complete:

1. **Verify All Checklist Items:** Ensure everything above is ✅
2. **Document Any Issues:** Note any problems encountered
3. **Prepare for Phase 2:** Review frontend checkout integration plan
4. **Notify Team:** Let team know Phase 1 is complete

**Ready for Phase 2?** Frontend Checkout Integration starts next! 🚀

---

## 📝 Notes & Observations

**Date:** [Add notes as you work]

**Issues Encountered:**

- [Document any problems]

**Decisions Made:**

- [Record important choices]

**Questions for Later:**

- [Note anything unclear]

---

**Phase 1 Status:** 🚧 In Progress  
**Started:** November 16, 2025  
**Completed:** [TBD]
