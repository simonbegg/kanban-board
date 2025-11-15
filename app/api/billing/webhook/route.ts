import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import crypto from 'crypto'

/**
 * Billing webhook handler
 * POST /api/billing/webhook
 * 
 * Currently accepts webhooks but doesn't process payments
 * Logs all events for future payment provider integration
 * 
 * Expected events:
 * - subscription_created -> Grant Pro plan
 * - subscription_cancelled -> Revoke Pro plan
 * - subscription_payment_failed -> Handle payment issues
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('webhook-signature')
    
    // TODO: Verify webhook signature when you integrate a payment provider
    // const webhookSecret = process.env.WEBHOOK_SECRET
    // if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const event = JSON.parse(body)
    console.log('=== BILLING WEBHOOK RECEIVED ===', {
      type: event.type,
      id: event.id,
      timestamp: new Date().toISOString()
    })

    const supabase = createServerClient()

    switch (event.type) {
      case 'subscription_created':
        await handleSubscriptionCreated(event.data, supabase)
        break
        
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event.data, supabase)
        break
        
      case 'subscription_payment_failed':
        await handlePaymentFailed(event.data, supabase)
        break
        
      case 'invoice_payment_succeeded':
        await handlePaymentSucceeded(event.data, supabase)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log the webhook for audit purposes
    await logWebhookEvent(event, supabase)

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Error processing billing webhook:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle subscription creation - grant Pro plan
 */
async function handleSubscriptionCreated(data: any, supabase: any) {
  try {
    const userId = data.customer?.userId || data.user_id
    
    if (!userId) {
      console.error('No user ID in subscription_created event')
      return
    }

    console.log(`Granting Pro plan to user: ${userId}`)

    const { error } = await supabase
      .from('entitlements')
      .upsert({
        user_id: userId,
        plan: 'pro',
        board_cap: 500,
        active_cap_per_board: 100,
        archive_retention_days: 36500,
        archived_cap_per_user: 200000,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error granting Pro via webhook:', error)
    } else {
      console.log(`Successfully granted Pro to user: ${userId}`)
    }

  } catch (err) {
    console.error('Error handling subscription_created:', err)
  }
}

/**
 * Handle subscription cancellation - revoke Pro plan
 */
async function handleSubscriptionCancelled(data: any, supabase: any) {
  try {
    const userId = data.customer?.userId || data.user_id
    
    if (!userId) {
      console.error('No user ID in subscription_cancelled event')
      return
    }

    console.log(`Revoking Pro plan from user: ${userId}`)

    // Check if user can be downgraded (has 1 or fewer boards)
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id')
      .eq('user_id', userId)

    if (boardsError) {
      console.error('Error checking boards before downgrade:', boardsError)
      return
    }

    if (boards && boards.length > 1) {
      console.warn(`Cannot revoke Pro from user ${userId}: has ${boards.length} boards`)
      // TODO: Send notification to user about needing to delete boards
      return
    }

    const { error } = await supabase
      .from('entitlements')
      .upsert({
        user_id: userId,
        plan: 'free',
        board_cap: 1,
        active_cap_per_board: 100,
        archive_retention_days: 90,
        archived_cap_per_user: 1000,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error revoking Pro via webhook:', error)
    } else {
      console.log(`Successfully revoked Pro from user: ${userId}`)
    }

  } catch (err) {
    console.error('Error handling subscription_cancelled:', err)
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(data: any, supabase: any) {
  try {
    const userId = data.customer?.userId || data.user_id
    
    console.log(`Payment failed for user: ${userId}`)
    
    // TODO: Implement grace period logic
    // TODO: Send payment failure notification
    // TODO: Schedule account downgrade if payment not resolved
    
    console.log('Payment failure handling not yet implemented')

  } catch (err) {
    console.error('Error handling payment_failed:', err)
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(data: any, supabase: any) {
  try {
    const userId = data.customer?.userId || data.user_id
    
    console.log(`Payment succeeded for user: ${userId}`)
    
    // TODO: Extend subscription
    // TODO: Send payment confirmation
    
    console.log('Payment success handling not yet implemented')

  } catch (err) {
    console.error('Error handling invoice_payment_succeeded:', err)
  }
}

/**
 * Log webhook events for audit
 */
async function logWebhookEvent(event: any, supabase: any) {
  try {
    // TODO: Create a webhook_logs table to store events
    console.log('Webhook event logged:', {
      id: event.id,
      type: event.type,
      created: new Date().toISOString()
    })

  } catch (err) {
    console.error('Error logging webhook event:', err)
  }
}

/**
 * Verify webhook signature (for future payment provider integration)
 */
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}
