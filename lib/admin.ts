/**
 * Centralised admin-email check.
 *
 * Admins are identified by email address.  The check is intentionally
 * permissive to the owner's domains so it still works if the sign-in
 * address changes between @teamtwobees.com and @threelanes.app.
 *
 * Override with NEXT_PUBLIC_ADMIN_EMAIL for a single explicit address,
 * or rely on the domain fallback below.
 */

const ADMIN_EMAIL_ENV = process.env.NEXT_PUBLIC_ADMIN_EMAIL

// Domains whose users are treated as admins (all lower-case).
const ADMIN_DOMAINS = ['threelanes.app', 'teamtwobees.com']

// Explicit individual admin addresses (all lower-case).
const ADMIN_ADDRESSES = [
  'simon@teamtwobees.com',
  'simon@threelanes.app',
  'admin@threelanes.app',
]

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const lower = email.toLowerCase()

  // Explicit env var takes highest priority.
  if (ADMIN_EMAIL_ENV && lower === ADMIN_EMAIL_ENV.toLowerCase()) return true

  // Explicit addresses.
  if (ADMIN_ADDRESSES.includes(lower)) return true

  // Domain-based fallback.
  const domain = lower.split('@')[1]
  return ADMIN_DOMAINS.includes(domain)
}
