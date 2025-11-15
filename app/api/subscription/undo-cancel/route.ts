import { NextResponse, NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'
import {
  logSubscriptionEvent,
  getUserEntitlements
} from '@/lib/subscription/subscription-helpers'

/**
 * Undo Pro subscription cancellation
 * POST /api/subscription/undo-cancel
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's entitlements
    const entitlements = await getUserEntitlements(user.id, supabase)
    
    // Verify cancellation is scheduled
    if (!entitlements.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'No scheduled cancellation found' },
        { status: 400 }
      )
    }
    
    // Verify cancellation hasn't taken effect yet
    if (entitlements.cancel_effective_at) {
      const effectiveDate = new Date(entitlements.cancel_effective_at)
      if (effectiveDate <= new Date()) {
        return NextResponse.json(
          { error: 'Cancellation has already taken effect. Please upgrade to restore Pro.' },
          { status: 400 }
        )
      }
    }

    // Reactivate Pro subscription
    const { error: updateError } = await supabase
      .from('entitlements')
      .update({
        cancel_at_period_end: false,
        cancel_effective_at: null,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error reactivating subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to undo cancellation' },
        { status: 500 }
      )
    }

    // Log event
    await logSubscriptionEvent(
      user.id,
      'cancel_rescinded',
      {
        previous_effective_date: entitlements.cancel_effective_at
      },
      user.id
    )

    // TODO: Send reactivation confirmation email

    return NextResponse.json({
      success: true,
      message: 'Pro plan reactivated successfully. Your subscription will continue.'
    })

  } catch (err) {
    console.error('Error in undo cancellation:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
