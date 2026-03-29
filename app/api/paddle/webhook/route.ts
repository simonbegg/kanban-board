import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Paddle Billing webhook handler
//
// Required env vars:
//   PADDLE_WEBHOOK_SECRET   — copied from Paddle dashboard → Notifications
//   SUPABASE_SERVICE_ROLE_KEY — needed to write entitlements (bypasses RLS)
//
// Handled events:
//   subscription.activated  → set plan = 'pro'
//   subscription.updated    → set plan = 'pro' (handles reactivations)
//   subscription.canceled   → set plan = 'free', clear subscription id
// ---------------------------------------------------------------------------

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Verify Paddle-Signature header.
 * Format: ts=<unix_timestamp>;h1=<hmac_sha256_hex>
 * HMAC message: "<timestamp>:<raw_body>"
 */
function verifySignature(rawBody: string, signatureHeader: string): boolean {
  if (!PADDLE_WEBHOOK_SECRET) {
    // No secret configured — skip verification (dev / first-run only).
    // Set PADDLE_WEBHOOK_SECRET in production!
    console.warn('PADDLE_WEBHOOK_SECRET not set — skipping signature verification')
    return true
  }

  const parts: Record<string, string> = {}
  for (const segment of signatureHeader.split(';')) {
    const idx = segment.indexOf('=')
    if (idx !== -1) {
      parts[segment.slice(0, idx)] = segment.slice(idx + 1)
    }
  }

  const timestamp = parts['ts']
  const receivedHash = parts['h1']
  if (!timestamp || !receivedHash) return false

  const expected = crypto
    .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
    .update(`${timestamp}:${rawBody}`)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(expected, 'hex'),
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signatureHeader = request.headers.get('Paddle-Signature') ?? ''

  if (!verifySignature(rawBody, signatureHeader)) {
    console.error('Paddle webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType: string = event?.event_type ?? ''
  const data = event?.data ?? {}

  const supabase = createAdminClient()

  // -------------------------------------------------------------------------
  // subscription.activated / subscription.updated → upgrade to Pro
  // -------------------------------------------------------------------------
  if (eventType === 'subscription.activated' || eventType === 'subscription.updated') {
    const subscriptionId: string = data.id ?? ''

    // The checkout passes custom_data.userId — see paddle-provider.tsx.
    const userId: string | undefined = data.custom_data?.userId

    if (!userId) {
      console.error('Paddle webhook: no userId in custom_data', { eventType, subscriptionId })
      // Return 200 so Paddle doesn't keep retrying; log for manual follow-up.
      return NextResponse.json({ warning: 'No userId in custom_data — entitlement not updated' })
    }

    const { error } = await supabase
      .from('entitlements')
      .upsert(
        {
          user_id: userId,
          plan: 'pro',
          paddle_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

    if (error) {
      console.error('Paddle webhook: failed to upsert entitlement', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    console.log(`Paddle webhook: upgraded user ${userId} to Pro (sub ${subscriptionId})`)
    return NextResponse.json({ received: true })
  }

  // -------------------------------------------------------------------------
  // subscription.canceled → downgrade to Free
  // Note: Paddle uses American English "canceled" (one l) in event names.
  // -------------------------------------------------------------------------
  if (eventType === 'subscription.canceled') {
    const subscriptionId: string = data.id ?? ''

    const { error } = await supabase
      .from('entitlements')
      .update({
        plan: 'free',
        paddle_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('paddle_subscription_id', subscriptionId)

    if (error) {
      console.error('Paddle webhook: failed to downgrade entitlement', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    console.log(`Paddle webhook: downgraded subscription ${subscriptionId} to Free`)
    return NextResponse.json({ received: true })
  }

  // Unknown event type — acknowledge receipt so Paddle doesn't retry.
  return NextResponse.json({ received: true, note: 'Event type not handled' })
}
