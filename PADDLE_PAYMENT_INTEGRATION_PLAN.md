# Paddle Payment Integration Plan

**Status:** 📋 Planning  
**Created:** November 16, 2025  
**Estimated Timeline:** 4-6 weeks

---

## 🎯 Objective

Integrate Paddle as the payment processor for ThreeLanes Pro subscriptions, replacing the current manual upgrade process (mailto) with fully automated payment processing, subscription management, and webhook handling.

---

## 📊 Current State

### ✅ What's Already Built:

- **Entitlements System:** Free/Pro plans with caps
- **Subscription Cancellation:** Frontend UI + API endpoints
- **Pricing Page:** UI displaying Free ($0) and Pro ($6/month)
- **Webhook Skeleton:** Basic webhook handler structure at `/api/billing/webhook`
- **Admin Panel:** Manual Pro plan granting/revoking
- **Upgrade Modal:** Frontend component for upselling

### ❌ What's Missing:

- Paddle account setup and configuration
- Paddle Checkout integration
- Webhook signature verification
- Real payment processing
- Subscription lifecycle management
- Customer portal integration
- Receipt/invoice handling
- Payment method updates
- Tax calculation (via Paddle)
- Failed payment recovery flow

---

## 🏗️ Architecture Overview

### Payment Flow:

```
User clicks "Upgrade to Pro"
  ↓
Paddle Checkout opens (overlay)
  ↓
User enters payment info
  ↓
Paddle processes payment
  ↓
Paddle sends webhook → /api/billing/webhook
  ↓
Webhook grants Pro entitlements
  ↓
User sees success + Pro features unlocked
```

### Tech Stack:

- **Payment Processor:** Paddle (Merchant of Record)
- **Paddle SDK:** `@paddle/paddle-js` (client-side)
- **Webhook Handling:** Next.js API routes
- **Database:** Supabase (entitlements + subscription state)
- **Authentication:** Existing Supabase Auth

---

## 📅 Implementation Phases

---

## Phase 1: Paddle Account & Product Setup

**Duration:** 3-5 days  
**Type:** Configuration & Setup

### Tasks:

#### 1.1 Paddle Account Setup

- [ ] Create Paddle account (sandbox + production)
- [ ] Complete business verification
- [ ] Configure payout settings
- [ ] Set up tax handling (Paddle handles automatically)
- [ ] Configure supported countries/currencies

#### 1.2 Product Configuration

- [ ] Create "ThreeLanes Pro" product in Paddle
- [ ] Set pricing: $6/month USD
- [ ] Configure billing cycle: Monthly recurring
- [ ] Set up trial period (optional: 14 days)
- [ ] Configure cancellation policy
- [ ] Add product description and images

#### 1.3 Environment Setup

- [ ] Get Paddle Vendor ID (sandbox)
- [ ] Get Paddle API keys (sandbox)
- [ ] Get Paddle Product ID
- [ ] Get Paddle webhook secret
- [ ] Set up environment variables:
  ```bash
  NEXT_PUBLIC_PADDLE_VENDOR_ID=
  NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
  PADDLE_API_KEY=
  PADDLE_WEBHOOK_SECRET=
  PADDLE_PRODUCT_ID=
  ```

#### 1.4 Documentation Review

- [ ] Read Paddle documentation
- [ ] Review webhook event types
- [ ] Understand subscription lifecycle
- [ ] Review checkout customization options

**Deliverables:**

- Configured Paddle sandbox account
- Product created and priced
- Environment variables documented

---

## Phase 2: Frontend Checkout Integration

**Duration:** 5-7 days  
**Type:** Frontend Development

### Tasks:

#### 2.1 Install Paddle SDK

- [ ] Install `@paddle/paddle-js`
- [ ] Create Paddle client wrapper (`lib/paddle-client.ts`)
- [ ] Initialize Paddle on app load
- [ ] Add TypeScript types

#### 2.2 Upgrade Flow Implementation

- [ ] Update `UpgradeModal` to use Paddle Checkout
- [ ] Add loading states during checkout
- [ ] Handle checkout success/failure
- [ ] Pass user metadata (user_id, email) to Paddle
- [ ] Implement "Upgrade to Pro" button functionality

#### 2.3 Pricing Page Integration

- [ ] Replace mailto link with Paddle checkout
- [ ] Add checkout button to pricing cards
- [ ] Show loading spinner during checkout init
- [ ] Handle checkout errors gracefully

#### 2.4 User Experience Enhancements

- [ ] Show checkout overlay (Paddle default)
- [ ] Display success message after payment
- [ ] Auto-refresh entitlements after success
- [ ] Handle edge cases (already subscribed, etc.)

#### 2.5 Testing & Polish

- [ ] Test checkout flow end-to-end (sandbox)
- [ ] Test with different payment methods
- [ ] Test error scenarios
- [ ] Verify mobile responsiveness
- [ ] Add analytics tracking (optional)

**Files to Create/Modify:**

- `lib/paddle-client.ts` (new)
- `components/upgrade-modal.tsx` (modify)
- `app/pricing/page.tsx` (modify)
- `components/checkout-button.tsx` (new)

**Deliverables:**

- Functional Paddle checkout on pricing page
- Working upgrade modal with Paddle
- Success/error handling

---

## Phase 3: Webhook Processing & Subscription Management

**Duration:** 7-10 days  
**Type:** Backend Development

### Tasks:

#### 3.1 Webhook Signature Verification

- [ ] Implement Paddle signature verification
- [ ] Use `PADDLE_WEBHOOK_SECRET` for validation
- [ ] Reject invalid webhooks
- [ ] Log verification failures

#### 3.2 Subscription Created Event

- [ ] Parse `subscription.created` webhook
- [ ] Extract user_id from passthrough data
- [ ] Grant Pro entitlements
- [ ] Set `current_period_end`
- [ ] Store Paddle subscription_id
- [ ] Send welcome email (optional)

#### 3.3 Subscription Updated Event

- [ ] Handle `subscription.updated` webhook
- [ ] Update entitlement caps if plan changes
- [ ] Handle pause/resume events
- [ ] Update billing cycle end date

#### 3.4 Subscription Cancelled Event

- [ ] Handle `subscription.canceled` webhook
- [ ] Set `cancel_at_period_end = true`
- [ ] Calculate grace period end
- [ ] Update enforcement state
- [ ] Keep Pro active until period end

#### 3.5 Payment Succeeded Event

- [ ] Handle `payment.succeeded` webhook
- [ ] Extend `current_period_end`
- [ ] Reset grace period if was in dunning
- [ ] Log payment for records

#### 3.6 Payment Failed Event

- [ ] Handle `payment.failed` webhook
- [ ] Set enforcement state to `grace`
- [ ] Calculate `courtesy_until` (7 days)
- [ ] Send payment failure email
- [ ] Schedule retry (Paddle handles automatically)

#### 3.7 Database Schema Updates

- [ ] Add `paddle_subscription_id` to entitlements
- [ ] Add `paddle_customer_id` to profiles
- [ ] Create `payment_events` table (audit log)
- [ ] Add indexes for webhook queries

#### 3.8 Error Handling & Retry Logic

- [ ] Implement idempotency (handle duplicate webhooks)
- [ ] Add retry logic for failed database operations
- [ ] Log all webhook events for debugging
- [ ] Alert on critical webhook failures

**Files to Create/Modify:**

- `app/api/billing/webhook/route.ts` (major updates)
- `lib/paddle-webhooks.ts` (new)
- `supabase/migrations/add_paddle_fields.sql` (new)
- `supabase/migrations/create_payment_events.sql` (new)

**Deliverables:**

- Secure webhook endpoint
- All subscription events handled
- Database schema updated
- Audit logging in place

---

## Phase 4: Customer Portal & Subscription Management

**Duration:** 5-7 days  
**Type:** Full-Stack Development

### Tasks:

#### 4.1 Customer Portal Integration

- [ ] Add "Manage Subscription" button to settings
- [ ] Open Paddle-hosted customer portal
- [ ] Allow users to:
  - Update payment method
  - View invoices/receipts
  - Cancel subscription
  - Resume subscription
  - Download receipts

#### 4.2 Subscription Status Display

- [ ] Show current subscription status
- [ ] Display next billing date
- [ ] Show payment method (last 4 digits)
- [ ] Display subscription history

#### 4.3 Cancel Subscription Flow (Pro Users)

- [ ] Update `CancelSubscriptionDialog` to use Paddle API
- [ ] Option 1: Cancel at period end (keep Paddle subscription)
- [ ] Option 2: Cancel immediately (call Paddle cancel API)
- [ ] Show refund policy (if applicable)
- [ ] Confirm cancellation

#### 4.4 Reactivate Subscription

- [ ] Add "Resume Pro" button for cancelled subs
- [ ] Call Paddle API to resume subscription
- [ ] Update entitlements immediately
- [ ] Show success confirmation

#### 4.5 Failed Payment Recovery

- [ ] Display banner when payment fails
- [ ] Show retry button
- [ ] Link to update payment method
- [ ] Display grace period countdown

**Files to Create/Modify:**

- `components/subscription-management.tsx` (new)
- `app/api/subscription/manage/route.ts` (new)
- `components/cancel-subscription-dialog.tsx` (update)
- `components/payment-failed-banner.tsx` (new)

**Deliverables:**

- Customer portal access
- Self-service subscription management
- Failed payment recovery UI
- Cancellation flow using Paddle

---

## Phase 5: Admin Tools & Monitoring

**Duration:** 3-5 days  
**Type:** Admin Dashboard Development

### Tasks:

#### 5.1 Admin Subscription View

- [ ] Add Paddle subscription info to admin panel
- [ ] Show subscription status (active/cancelled/past_due)
- [ ] Display payment history
- [ ] Show customer portal link
- [ ] Display revenue metrics

#### 5.2 Manual Subscription Management

- [ ] Add "Refund" button (calls Paddle API)
- [ ] Add "Cancel" button (admin override)
- [ ] Add "Extend trial" functionality
- [ ] Add "Apply discount" feature

#### 5.3 Webhook Monitoring

- [ ] Create webhook logs viewer
- [ ] Show recent webhook events
- [ ] Display webhook processing status
- [ ] Alert on webhook failures
- [ ] Retry failed webhooks

#### 5.4 Revenue Dashboard

- [ ] Show MRR (Monthly Recurring Revenue)
- [ ] Display churn rate
- [ ] Show new subscriptions
- [ ] Display cancellations
- [ ] Revenue graphs (optional)

**Files to Create/Modify:**

- `components/admin/paddle-management.tsx` (new)
- `components/admin/webhook-logs.tsx` (new)
- `components/admin/revenue-dashboard.tsx` (new)
- `app/api/admin/paddle/route.ts` (new)

**Deliverables:**

- Admin subscription management
- Webhook monitoring
- Revenue insights

---

## Phase 6: Testing, Security & Production Launch

**Duration:** 5-7 days  
**Type:** Testing & Deployment

### Tasks:

#### 6.1 Comprehensive Testing

- [ ] **Sandbox Testing:**

  - [ ] Test successful payment
  - [ ] Test failed payment
  - [ ] Test subscription cancellation
  - [ ] Test subscription reactivation
  - [ ] Test payment method updates
  - [ ] Test webhook retry logic
  - [ ] Test edge cases (duplicate webhooks, etc.)

- [ ] **End-to-End Testing:**
  - [ ] Free → Pro upgrade flow
  - [ ] Pro → Cancelled → Free flow
  - [ ] Failed payment → Grace → Enforcement
  - [ ] Customer portal access
  - [ ] Admin management tools

#### 6.2 Security Audit

- [ ] Verify webhook signature validation
- [ ] Check for SQL injection vulnerabilities
- [ ] Validate user authorization checks
- [ ] Ensure sensitive data is not logged
- [ ] Review API key security
- [ ] Test rate limiting on webhooks

#### 6.3 Error Handling & Edge Cases

- [ ] Handle network failures gracefully
- [ ] Test Paddle service downtime scenarios
- [ ] Handle malformed webhooks
- [ ] Test concurrent webhook processing
- [ ] Verify idempotency works correctly

#### 6.4 Documentation

- [ ] Document Paddle setup process
- [ ] Write webhook event handling guide
- [ ] Create troubleshooting guide
- [ ] Document environment variables
- [ ] Write runbook for common issues

#### 6.5 Production Preparation

- [ ] Switch from sandbox to production Paddle account
- [ ] Update environment variables in Vercel
- [ ] Configure production webhook URL
- [ ] Test production webhook delivery
- [ ] Set up monitoring/alerting (Sentry, etc.)

#### 6.6 Production Launch

- [ ] Deploy to production
- [ ] Monitor first real transactions
- [ ] Watch webhook processing
- [ ] Verify entitlements update correctly
- [ ] Check email notifications
- [ ] Monitor error logs

#### 6.7 Post-Launch Monitoring (First Week)

- [ ] Monitor conversion rate
- [ ] Track failed payments
- [ ] Monitor webhook delivery success
- [ ] Check customer support tickets
- [ ] Review error logs daily
- [ ] Verify revenue reconciliation

**Deliverables:**

- Fully tested payment system
- Security audit passed
- Production deployment
- Monitoring in place
- Documentation complete

---

## 🗂️ Database Schema Changes

### New Tables:

#### `payment_events`

```sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  paddle_event_id TEXT UNIQUE NOT NULL,
  paddle_subscription_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Updated Tables:

#### `entitlements`

```sql
ALTER TABLE entitlements
ADD COLUMN paddle_subscription_id TEXT,
ADD COLUMN paddle_customer_id TEXT,
ADD COLUMN paddle_plan_id TEXT,
ADD COLUMN last_payment_at TIMESTAMPTZ,
ADD COLUMN next_payment_at TIMESTAMPTZ;
```

#### `profiles`

```sql
ALTER TABLE profiles
ADD COLUMN paddle_customer_id TEXT;
```

---

## 🔐 Security Considerations

1. **Webhook Signature Verification:** Always verify Paddle webhook signatures
2. **HTTPS Only:** Never process payments over HTTP
3. **API Key Protection:** Store Paddle keys in environment variables only
4. **User Authorization:** Verify user owns subscription before allowing changes
5. **Idempotency:** Handle duplicate webhooks gracefully
6. **Rate Limiting:** Implement rate limits on webhook endpoint
7. **Audit Logging:** Log all payment events for compliance
8. **PCI Compliance:** Paddle handles this (we never touch card data)

---

## 💰 Pricing & Revenue

**Pro Plan Pricing:**

- **Price:** $6/month USD
- **Billing:** Monthly recurring
- **Trial:** Optional 14-day free trial
- **Taxes:** Handled by Paddle (automatic)
- **Refunds:** 30-day refund policy (configurable)

**Revenue Projections:**

- **Target:** 100 paying users in first 6 months
- **MRR:** $600/month (at 100 users)
- **Annual Revenue:** $7,200/year (at 100 users)
- **Paddle Fees:** ~5% + $0.50 per transaction
- **Net Revenue:** ~$5.70 per user/month

---

## 📊 Success Metrics

### Phase Completion Metrics:

- [ ] **Phase 1:** Paddle account approved ✅
- [ ] **Phase 2:** Checkout converts successfully ✅
- [ ] **Phase 3:** Webhooks process 100% of events ✅
- [ ] **Phase 4:** Customer portal accessible ✅
- [ ] **Phase 5:** Admin tools functional ✅
- [ ] **Phase 6:** Production launch successful ✅

### Business Metrics (Post-Launch):

- **Conversion Rate:** % of users who upgrade (target: 5-10%)
- **Churn Rate:** % of users who cancel (target: <5% monthly)
- **Payment Success Rate:** % of successful payments (target: >95%)
- **MRR Growth:** Month-over-month revenue increase
- **Customer Lifetime Value (LTV):** Average revenue per customer

---

## 🚨 Risk Mitigation

### Technical Risks:

1. **Webhook Failures:** Implement retry logic + manual reconciliation
2. **Paddle Downtime:** Cache subscription state, graceful degradation
3. **Payment Failures:** Grace period + dunning management
4. **Security Breach:** Regular security audits, key rotation

### Business Risks:

1. **High Churn:** Improve product value, add features
2. **Low Conversion:** A/B test pricing, improve onboarding
3. **Refund Requests:** Clear value proposition, good support
4. **Compliance Issues:** Work with legal, follow Paddle guidelines

---

## 📚 Resources & Documentation

### Paddle Documentation:

- [Paddle Developer Docs](https://developer.paddle.com/)
- [Paddle.js SDK](https://developer.paddle.com/paddlejs/overview)
- [Webhook Reference](https://developer.paddle.com/webhooks/overview)
- [Subscription Lifecycle](https://developer.paddle.com/concepts/subscriptions/subscription-lifecycle)

### Code Examples:

- [Next.js + Paddle Example](https://github.com/PaddleHQ/paddle-nextjs-starter)
- [Webhook Signature Verification](https://developer.paddle.com/webhooks/signature-verification)

### Support:

- **Paddle Support:** support@paddle.com
- **Paddle Sandbox:** Use for all testing
- **Paddle Community:** Discord/Slack (check Paddle docs)

---

## ✅ Definition of Done

### Phase 1 Complete When:

- Paddle account verified and approved
- Product created with correct pricing
- All environment variables configured

### Phase 2 Complete When:

- Users can successfully checkout from pricing page
- Upgrade modal opens Paddle checkout
- Success/error states handled properly

### Phase 3 Complete When:

- All webhook events processed correctly
- Entitlements auto-update on payment
- Failed payments trigger grace period
- Audit logs capture all events

### Phase 4 Complete When:

- Customer portal accessible from settings
- Users can cancel/resume subscriptions
- Payment method updates work
- Failed payment recovery flow complete

### Phase 5 Complete When:

- Admin can view all subscriptions
- Revenue metrics displayed
- Webhook logs viewable
- Manual subscription management works

### Phase 6 Complete When:

- All sandbox tests pass
- Security audit complete
- Production deployment successful
- First real payment processed
- Monitoring/alerting active

---

## 🎉 Success Criteria

**Project considered successful when:**

1. ✅ Users can upgrade to Pro with real payments
2. ✅ Webhooks auto-update entitlements reliably
3. ✅ Failed payments handled with grace period
4. ✅ Users can self-manage subscriptions
5. ✅ Admin has full visibility into payments
6. ✅ Zero security vulnerabilities
7. ✅ >95% payment success rate
8. ✅ <1% webhook processing failures

---

## 📅 Timeline Summary

| Phase                       | Duration  | Start  | End    |
| --------------------------- | --------- | ------ | ------ |
| Phase 1: Paddle Setup       | 3-5 days  | Week 1 | Week 1 |
| Phase 2: Frontend Checkout  | 5-7 days  | Week 1 | Week 2 |
| Phase 3: Webhook Processing | 7-10 days | Week 2 | Week 3 |
| Phase 4: Customer Portal    | 5-7 days  | Week 3 | Week 4 |
| Phase 5: Admin Tools        | 3-5 days  | Week 4 | Week 5 |
| Phase 6: Testing & Launch   | 5-7 days  | Week 5 | Week 6 |

**Total Estimated Time:** 4-6 weeks

---

## 🔄 Next Steps

1. **Review this plan** - Ensure all requirements are captured
2. **Create Paddle account** - Start Phase 1
3. **Set up project board** - Track progress (optional)
4. **Schedule check-ins** - Weekly progress reviews
5. **Prepare test scenarios** - Define test cases upfront

---

**Status:** Ready to begin Phase 1 🚀  
**Questions?** Review each phase and flag any concerns before starting.
