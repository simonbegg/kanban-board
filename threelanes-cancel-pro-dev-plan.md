# ThreeLanes — Dev Plan: User Cancels a Pro Plan

> No-code overview of what needs to happen when a user cancels a Pro plan. Focused on product states, user flows, data flags, notifications, and enforcement.

---

## 0) Assumptions & knobs (set these once)
- **Free limits:** 1 board; 100 active tasks per board; 1,000 archived tasks total; archive retention 90 days.
- **Cancellation options:** “Cancel at period end” (default) and “Cancel now” (only if eligible per business policy).
- **Courtesy period:** 14 days after Pro ends before enforcing Free limits.
- **Billing provider:** generic “billing provider” integration (handles renewal/cancel webhooks).

---

## 1) Data + states to support the flow

### Subscription
- `plan` (pro|free)
- `status` (active|cancel_scheduled|grace|lapsed)
- `current_period_end` (datetime)
- `cancel_at_period_end` (bool)
- `cancel_effective_at` (datetime) // equals current_period_end, unless “cancel now”
- `courtesy_until` (datetime) // cancel_effective_at + 14 days

### Account usage
- `board_count`
- `active_task_counts` (per board)
- `archived_task_total`
- `primary_board_id` (nullable)
- `over_limit` (bool) // computed nightly and on write
- `enforcement_state` (none|soft_warn|enforced) // transitions after courtesy

### Event log (audit)
- `event_type` (cancel_requested|cancel_rescinded|plan_downgraded|enforcement_applied|export_requested|export_ready)
- `event_time`, metadata (who, counts, limits snapshot)

---

## 2) User flow — “Cancel Pro” (at period end)
**Trigger (T0):** User clicks “Cancel Pro” → cancellation screen.

**Immediate actions**
- Mark `cancel_at_period_end = true`.
- Set `status = cancel_scheduled`.
- Set `cancel_effective_at = current_period_end`.
- Show success state + email: “Pro ends on **[date]**. You’ll get a 14-day tidy-up period before Free limits apply.”
- In-app banner until effective date with **Undo** option.

**Undo path (any time before effective date)**
- If user clicks “Keep Pro”: clear `cancel_at_period_end` and `cancel_effective_at`; set `status = active`. Remove banners; log event.

---

## 3) Optional path — “Cancel now”
**Guardrails**
- Only show if user is within your “money-back” or immediate-cancel eligibility window (business rule).
- Confirmation modal: consequences + eligibility.

**Immediate actions**
- Set `cancel_effective_at = now`.
- Flip to Free at once (see §4). Start courtesy timer from now.
- Trigger refund/cancellation to billing provider per policy.
- Show confirmation + email: “Pro cancelled today. Courtesy period ends **[date]**.”

---

## 4) On effective date (Pro ends, Tₑ)
**Automatic transition (via scheduler or webhook)**
- Set `plan = free`; `status = active` (or `lapsed` if you differentiate).
- Set `courtesy_until = now + 14 days`.
- Set `enforcement_state = soft_warn` (no locks yet).
- Fire email + in-app banner:
  - “You’re on Free. Nothing is deleted. You have **14 days** to tidy up before limits are enforced.”  
  - CTA: **“Resolve over-limit” wizard**.

**Resolve wizard (available immediately)**
- **Step 1:** Choose **primary board** (preselect most recent).
- **Step 2:** For extra boards → options: **Make read-only**, **Export CSV/JSON**, **Merge into primary**, **Delete**.
- **Step 3:** For active task overages → bulk **Archive/Delete**; disable only *creation* on over-limit boards once enforcement kicks in (see §5).
- **Step 4:** Archive summary → show total archived count and items older than 90 days; advise retention applies after courtesy; offer export now.

---

## 5) Enforcement after courtesy (Tₑ + 14d)
**Transition**
- Set `enforcement_state = enforced`.

**Apply read/write rules**
- **Boards:** Keep only **primary board** fully editable. All other boards = **read-only** and **hidden by default** (toggle “Show over-limit items”).
- **Tasks:** On boards with >100 active tasks, **disable Create Task**; allow moving/archiving/deleting to get under the limit.
- **Archives:** If archived total >1,000, archives become **view-only** until reduced. Begin applying **90-day retention** going forward (see §6).
- **UI copy:** Clear banners on boards list and board page with links to “Resolve” and “Upgrade”.

**Comms**
- Email + in-app: “Free limits now enforced. Nothing was deleted. Some items are read-only/hidden until you resolve or upgrade.”

---

## 6) Archive retention (ongoing while on Free)
**Policy start**
- From the moment `plan=free` **and** after courtesy, begin **aging** archived tasks against the 90-day limit.
- **Warning cadence:** 14 days before the first purge window and again 3 days before.
- **Purge job:** Remove archived items older than 90 days (batch with safeguards + event log).
- **Export option:** Always provide quick CSV/JSON export before purge.

---

## 7) Notifications & surfaces (what needs wiring)
**In-app**
- Top-of-app banner states: cancel scheduled, courtesy, enforced.
- Boards list chips: “Hidden over-limit boards” + toggle.
- Board header badge: “Read-only on Free (over limit)”. 
- Resolve wizard entry points in Settings and banners.

**Email**
- Cancel scheduled (with effective date).
- Pro ended → courtesy started.
- Enforcement started.
- Archive retention warning(s).
- Export ready (link with expiry).

---

## 8) Exports (self-serve; behavior only)
- **Per-board CSV** (category, title, description, lane, created_at, updated_at, archived_at).
- **Full-account JSON** (boards[], tasks[]).
- **Delivery:** Download immediately if small; otherwise “We’ll email a link when ready.”
- **Security:** Link expires (e.g., 7 days); single-use tokens; require re-auth if clicked while logged out.

---

## 9) Billing provider & webhooks (high-level)
- **Inputs:** “Cancel at period end” API call; “Cancel now” call (if supported); renewal/final-period webhooks.
- **Outputs:** Update subscription fields (`cancel_at_period_end`, `cancel_effective_at`).
- **Guards:** If the provider unexpectedly renews before effective date (user reactivated), clear cancellation flags and banners.

---

## 10) Admin/support tooling
- View and edit: `cancel_effective_at`, `courtesy_until`, `primary_board_id`.
- Force-apply or extend courtesy (e.g., add 7 days).
- Trigger exports on behalf of a user.
- See over-limit snapshot and last comms sent.

---

## 11) Analytics to instrument
- Cancels started vs completed; “Cancel now” vs “at period end”.
- Courtesy → enforcement conversion and time to resolution.
- Actions in resolve wizard (export/merge/delete/upgrade).
- Upgrade recapture within 30 days of enforcement.

---

## 12) QA scenarios
- Cancel at period end → effective → courtesy → enforcement (over and under limit).
- Cancel now (eligible) and refund path.
- Undo cancellation before effective date.
- User upgrades during courtesy (clear all locks; return to Pro).
- Archive retention warnings and first purge.
- Export on big accounts (email flow + token expiry).
- Timezone correctness for all dates (user timezone vs UTC).

---
