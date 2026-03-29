# ThreeLanes Signup and Upgrade Flow

This document describes the intended behaviour for user signup and upgrade from Free to Pro in ThreeLanes.

---

## 0. Core concepts

- **Key ideas**
  - All new users sign up as Free by default.
  - Users can signal Pro intent during signup. Actual payment and plan change always happen inside the app.
  - Upgrade to Pro always happens when the user is logged in.

---

## 1. Entry points to signup

### 1.1 Home page: `https://www.threelanes.app`

**UI**

- Primary CTA: `Start for free`
- Optional supporting text under button, for example:
  - `No credit card required. Upgrade to Pro any time.`

**Behaviour**

1. User clicks `Start for free`.
2. User is taken to the signup page.  
   Example URL:
   - `/signup`
   - No special plan information is needed in the query string.

---

### 1.2 Pricing page: `https://www.threelanes.app/pricing`

**UI**

Pricing page displays two cards:

- **Free plan card**

  - Button text: `Get started free`

- **Pro plan card**
  - Button text: `Get started on Pro`

**Behaviour**

1. User clicks `Get started free` on the Free plan.

   - Redirect to signup page with a query string indicating Free intent.  
     Example: `/signup?plan=free`

2. User clicks `Get started on Pro` on the Pro plan.
   - Redirect to signup page with a query string indicating Pro intent.  
     Example: `/signup?plan=pro`

---

## 2. Signup page

**URL examples**

- Direct from home page
  - `/signup`
- From pricing Free button
  - `/signup?plan=free`
- From pricing Pro button
  - `/signup?plan=pro`

**Internal handling**

- Determine `plan_intent` based on query string:
  - If `plan=pro` then `plan_intent = "pro"`
  - If `plan=free` or missing then `plan_intent = "free"`

**UI messaging**

- For users arriving with `plan_intent = "pro"`:

  - Show a small note near the form, for example:
    - `You selected the Pro plan. You will be able to confirm or change this after creating your account.`

- For users with `plan_intent = "free"` or no parameter:
  - Show default copy, for example:
    - `Create your free ThreeLanes account.`

**On successful signup**

- Create user record in the database with:

  - `plan_status = "free"`  
    (this is the actual current plan)
  - `plan_intent = "free"` or `"pro"`  
    (based on the query string as above)
  - `onboarding_state` as needed, for example `"signed_up"` or `"first_login"`

- Log the user in.
- Redirect to the main app interface.  
  Example URL: `/app`

---

## 3. First experience inside the app

### 3.1 Landing experience when `plan_intent = "free"`

**Scenario**

- User came from:
  - Home page `Start for free`, or
  - Pricing Free button, or
  - Any route that resolves to `plan_intent = "free"`

**Behaviour**

1. On first load of `/app`:

   - User is on their default Free workspace.
   - `plan_status = "free"`.

2. Optionally show a short welcome modal or inline message:

   - Title: `Welcome to ThreeLanes`
   - Body: a short sentence explaining they are on the Free plan and can upgrade later.
   - Primary button: `Create your first board` or similar.
   - Dismiss option: `Skip for now`.

3. No Pro specific upgrade prompt is shown immediately for Free intent users.

---

### 3.2 Landing experience when `plan_intent = "pro"`

**Scenario**

- User clicked `Get started on Pro` on the pricing page.
- Signed up.
- Internally:
  - `plan_status = "free"`
  - `plan_intent = "pro"`

**Behaviour**

On first load of `/app`:

1. Show a **Pro intent modal** before or alongside the main app content.

   Example content:

   - Title: `Finish setting up ThreeLanes Pro`
   - Body: short list of Pro benefits in bullet form.
   - Buttons:
     - Primary: `Upgrade to Pro`
     - Secondary: `Continue on Free for now`

2. If the user clicks `Upgrade to Pro`:

   - Proceed to the **Upgrade flow** (see section 5).

3. If the user clicks `Continue on Free for now` or closes the modal:
   - Dismiss modal.
   - Keep `plan_status = "free"`.
   - Optionally keep `plan_intent = "pro"` in the database for analytics.
   - User can still upgrade later via app settings or when hitting limits.

---

## 4. In app Free vs Pro indicators

### 4.1 Plan badge in the UI

**Top bar or account menu**

- Show current plan in a small badge, for example:
  - `Free plan` with an adjacent link `Upgrade`.
  - If `plan_status = "pro"` show `Pro plan`.

**Behaviour**

- Clicking `Upgrade` or `Manage plan` opens the Billing or Upgrade screen (see section 5).

---

### 4.2 Usage indicators and limits

#### 4.2.1 Board limit (Free)

- Free users can have up to 1 active board.

Behaviour when user attempts to create another board:

1. User with `plan_status = "free"` attempts to create a second active board.
2. Instead of silently blocking, show a modal or inline message.

   Example:

   - Title: `You have reached your Free board limit`
   - Body: `The Free plan includes 1 active board. Upgrade to Pro to create more boards, or archive or delete an existing board.`
   - Buttons:
     - Primary: `Upgrade to Pro`
     - Secondary: `Manage boards` or `Cancel`

3. If they choose `Upgrade to Pro`:

   - Open the Upgrade flow (section 5).

4. If they choose `Manage boards`:
   - Navigate them to their boards list so they can archive or delete a board.

#### 4.2.2 Task limit (Free)

- Free users have up to 100 active tasks.

Behaviour when user tries to exceed 100 tasks:

1. On creating task number 101 (or equivalent threshold):

   - Block the action and display a similar upgrade modal:

   Example:

   - Title: `You have reached your Free task limit`
   - Body: `The Free plan includes up to 100 active tasks. Upgrade to Pro to add more, or complete or archive some existing tasks.`
   - Buttons:
     - Primary: `Upgrade to Pro`
     - Secondary: `View tasks`

2. `Upgrade to Pro` again starts Upgrade flow (section 5).

3. `View tasks` filters or lists tasks so they can reduce the count.

---

## 5. Upgrade to Pro flow (inside the app)

The upgrade flow is triggered from:

- The Pro intent modal after signup.
- The plan badge or account menu.
- Any Free limit paywall modal (board limit, task limit, archive limit etc).

### 5.1 Upgrade screen

**UI elements**

- Plan summary
  - Current plan: `Free`
  - New plan: `Pro`
  - Key benefits list.
- Pricing details
  - For example `£X per month billed monthly` or `£Y per year billed annually`.
- Button to start payment:
  - `Upgrade to Pro`

**Behaviour**

1. User clicks `Upgrade to Pro` on this screen.
2. App opens Paddle checkout (likely in a modal or new window) with:

   - User email.
   - Selected Pro plan.
   - Any relevant metadata (user id, workspace id etc).

3. If payment succeeds:

   - Receive Paddle webhook or client side confirmation.
   - Update the user or workspace in your database:
     - `plan_status = "pro"`
     - Store subscription id and relevant billing data.
   - Show success message in the app, for example:
     - `You are now on the Pro plan. Enjoy unlimited boards and higher limits.`

4. If payment fails or is cancelled:
   - Keep `plan_status = "free"`.
   - Show a non intrusive message:
     - `We could not complete your upgrade. You remain on the Free plan.`

---

## 6. Post upgrade experience

Once `plan_status = "pro"`:

- The UI should:

  - Replace any `Upgrade` labels with `Manage plan` or similar.
  - Remove Free limit modals.
  - Show updated limits in any usage indicators.

- Billing settings page should now show:
  - `Current plan: Pro`
  - Renewal date.
  - Link or button to manage the subscription in Paddle (update card, cancel etc).
  - Any relevant legal text that mirrors your Terms.

---

## 7. Summary of key rules

1. **All new accounts start as Free.**
2. **Plan intent is captured via pricing page CTAs but does not change plan status on its own.**
3. **Pro upgrades only happen inside the app while the user is logged in.**
4. **Upgrade entry points**
   - Pro intent modal on first login.
   - Plan badge or account menu.
   - Paywall modals when hitting Free limits.
5. **Upgrade mechanics**
   - Pavddle checkout.
   - On success update `plan_status` to Pro and store subscription data.
6. **No separate pre paid Pro signup flow is required.**

This document should be treated as the canonical description of how signup and upgrade work for ThreeLanes version 1.
