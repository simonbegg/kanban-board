# ThreeLanes — CLAUDE.md

## Project Overview

ThreeLanes is a SaaS Kanban board application with a fixed three-lane workflow (To Do → Doing → Done). It is a monetised product with Free and Pro tiers. Users can manage tasks, set categories, archive completed work, receive email/Slack notifications, and upgrade via Paddle.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.2.4 (App Router) + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + Shadcn UI (Radix UI) |
| Database / Auth | Supabase (PostgreSQL + RLS + Auth) |
| Payments | Paddle (subscription billing) |
| Drag & Drop | dnd-kit |
| Forms | React Hook Form + Zod |
| Notifications | Email summaries + Slack OAuth |
| Analytics | Vercel Analytics + Speed Insights |
| Error Tracking | Seline |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |

---

## Commands

```bash
npm run dev            # Start local dev server
npm run build          # Production build
npm run start          # Run production server locally
npm run lint           # ESLint check
npm run test           # Run Vitest tests
npm run test:ui        # Vitest with browser UI
npm run test:coverage  # Coverage report
npm run security:check # Run security audit script
```

> **Note:** `next.config.mjs` sets `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` — TypeScript and ESLint errors do NOT fail the build.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Paddle
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_PRICE_ID=
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox   # or production

# Slack OAuth
NEXT_PUBLIC_SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
NEXT_PUBLIC_SLACK_REDIRECT_URI=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

---

## Project Structure

```
app/
  api/email/           # Email notification routes
  api/slack/           # Slack OAuth routes
  api/debug*/          # Debug endpoints (remove before prod)
  auth/callback/       # Supabase OAuth redirect handler
  board/               # Protected main app page
  pricing/             # Public pricing page
  privacy|refund-policy|terms-and-conditions/
  layout.tsx           # Root layout (providers, analytics)
  page.tsx             # Public landing page

components/
  ui/                  # Shadcn primitives (18+ components)
  auth/                # AuthForm, UserMenu
  boards/              # BoardSelector, BoardActions
  supabase-kanban-board.tsx  # Main board controller (state, queries, DnD)
  kanban-column.tsx / kanban-card.tsx
  add-task-dialog.tsx / edit-task-dialog.tsx
  archived-tasks-dialog.tsx
  paddle-provider.tsx / upgrade-modal.tsx
  email-settings.tsx / slack-integration.tsx
  usage-meter.tsx / cap-warning.tsx
  resolve-overlimit-wizard.tsx
  cancel-subscription-dialog.tsx / cancellation-banner.tsx
  export-data-buttons.tsx

contexts/
  auth-context.tsx     # Global auth state (useAuth hook)

lib/
  supabase.ts          # Full DB type definitions (Database type)
  supabase-server.ts   # Server-side Supabase client
  cap-enforcement.ts   # Plan limit checks
  rate-limit.ts        # In-memory rate limiting
  validation.ts        # Input sanitisation helpers
  email.ts / slack.ts  # Notification service logic
  logger.ts            # Dev-only console logger
  utils.ts             # cn() helper
  api/boards.ts        # Board CRUD helpers
  api/categories.ts    # Category CRUD helpers

supabase/migrations/   # Raw SQL migration files
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User metadata, Slack tokens, email notification settings |
| `boards` | User-owned boards |
| `columns` | Three columns per board (To Do, Doing, Done) with position |
| `tasks` | Individual tasks: title, description, category, position, archived |
| `categories` | User-defined label + hex colour pairs |
| `entitlements` | Plan limits per user (managed by Paddle webhook) |
| `notifications_log` | Audit trail for sent notifications |

All tables use **Row-Level Security** — users can only read/write their own rows.

**DB Functions:**
- `bulk_update_task_positions(jsonb)` — batch position update for drag-drop
- `increment_task_positions(uuid)` — shift all positions in a column

---

## Authentication

- Supabase Auth: email/password + Google OAuth
- Sessions stored in cookies (httpOnly, secure)
- `AuthProvider` (`contexts/auth-context.tsx`) wraps the entire app
- `useAuth()` exposes: `user`, `loading`, `signIn`, `signUp`, `signInWithGoogle`, `signOut`
- `/auth/callback` exchanges OAuth code for session, then redirects to `/board`
- `/board` redirects to `/` if user is not authenticated

---

## Billing (Paddle)

| | Free | Pro ($6/mo) |
|---|---|---|
| Boards | 1 | Unlimited |
| Active tasks/board | 100 | 100 |
| Archived tasks | 1,000 | 200,000 |
| Archive retention | 90 days | Unlimited |

- `PaddleProvider` initialises the Paddle.js script
- `usePaddle().openCheckout(email)` triggers the overlay
- Entitlements are written to the `entitlements` table by a Paddle webhook (server-side, not in this repo)
- Cap checks happen client-side via `lib/cap-enforcement.ts`
- `ResolveOverlimitWizard` guides users through downgrading gracefully

---

## Notifications

**Email:**
- Daily or weekly summaries of To Do tasks
- Opt-in per user; stores `notification_frequency` and `last_notification_sent` in `profiles`
- Routes: `GET/POST /api/email/settings`, `POST /api/email/send-task-summary`

**Slack:**
- OAuth flow: `/api/slack/auth` → `/api/slack/callback`
- Stores `slack_access_token`, `slack_user_id`, `slack_team_id`, `slack_channel_id` in `profiles`
- Sends DMs with formatted task blocks
- Disconnect: `GET /api/slack/disconnect` (clears tokens)

---

## Security

Middleware (`middleware.ts`) applies to all routes except static assets:
- HTTPS redirect in production
- `X-Frame-Options: DENY` — clickjacking protection
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- CSP: allows `unsafe-inline`/`unsafe-eval` (required by Next.js + Seline)

Rate limiting (`lib/rate-limit.ts`): in-memory, per-user, per-operation:
- READ: 30/min, WRITE: 10/min, DELETE: 5/min

---

## State Management

- **React Context** — auth state only (`AuthProvider`)
- **Local component state** — all board/task/UI state lives in `SupabaseKanbanBoard`
- **localStorage** — persists `selectedBoardId` across page reloads
- **React Hook Form** — form state in dialogs
- No Redux, no Zustand, no real-time Supabase subscriptions (single-user design)

---

## Key Patterns

- **Smart container + dumb presenters**: `SupabaseKanbanBoard` owns state; `KanbanColumn`/`KanbanCard` are presentational
- **Client-side Supabase queries**: all DB access uses `createClientComponentClient()` — no server actions
- **Nested board fetch**: boards → columns → tasks in a single Supabase query
- **Soft deletion**: tasks are archived (`archived: true`), not deleted
- **Category sync**: categories are auto-created from task labels via `upsertCategory()`
- **`cn()` utility**: always use `cn()` from `@/lib/utils` for conditional Tailwind class merging

---

## Testing

```bash
npm run test           # Run all tests
npm run test:coverage  # With coverage report
```

- Config: `vitest.config.ts` (jsdom, v8 coverage)
- Tests live in `test/` and `test/integration/`
- Setup file: `test/setup.ts`
- Path alias `@/` is mapped in vitest config

---

## Known Gotchas

1. **Build errors are silenced** — TypeScript and ESLint errors won't fail `npm run build`. Always lint/type-check manually.
2. **`@dnd-kit` uses `"latest"`** — pin these if the app breaks unexpectedly after a fresh install.
3. **Cap enforcement is client-side only** — there are no server-side API guards; entitlement checks in `lib/cap-enforcement.ts` run in the browser.
4. **Debug routes exist** — `/api/debug` and `/api/debug-boards` should be removed or restricted before scaling up production traffic.
5. **`calculateUsageStats` runs two sequential Supabase queries** — acceptable at current scale but is an N+1 pattern.
6. **No Supabase real-time** — board data is fetched on load only; no live collaboration.
7. **Paddle webhook handler is external** — entitlement writes after payment happen in a separate service not present in this repo.
