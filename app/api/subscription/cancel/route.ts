import { NextResponse, NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'
import {
  calculateCourtesyEnd,
  logSubscriptionEvent,
  isEligibleForImmediateCancel,
  getUserEntitlements,
  formatDate
} from '@/lib/subscription/subscription-helpers'

/**
 * Cancel Pro subscription
 * POST /api/subscription/cancel
 * Body: { cancelNow?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    // Ensure cancelNow is a boolean (handle string "false" / "true" from some clients)
    const cancelNow = body.cancelNow === true || body.cancelNow === 'true'

    console.log('Cancel request - User ID:', user.id, 'cancelNow:', cancelNow, 'raw:', body.cancelNow)

    // Get user's entitlements
    const entitlements = await getUserEntitlements(user.id, supabase)
    console.log('Fetched entitlements:', {
      plan: entitlements.plan,
      status: entitlements.status,
      cancel_at_period_end: entitlements.cancel_at_period_end
    })
    
    // Verify user is on Pro plan
    if (entitlements.plan !== 'pro') {
      return NextResponse.json(
        { error: 'Only Pro users can cancel their subscription' },
        { status: 400 }
      )
    }
    
    // Verify not already cancelled
    if (entitlements.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is already scheduled for cancellation' },
        { status: 400 }
      )
    }

    let effectiveDate: Date
    let courtesyUntil: Date
    let updateData: any

    console.log('Checking cancelNow:', cancelNow, 'Type:', typeof cancelNow, 'Truthy:', !!cancelNow)

    if (cancelNow) {
      console.log('>>> Taking IMMEDIATE cancellation branch')
      // Immediate cancellation
      
      // Check eligibility
      const proUpgradedAt = new Date(entitlements.updated_at || entitlements.created_at)
      const periodEnd = entitlements.current_period_end 
        ? new Date(entitlements.current_period_end)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default: 30 days from now
      
      const eligible = isEligibleForImmediateCancel(proUpgradedAt, periodEnd)
      
      if (!eligible) {
        return NextResponse.json(
          { 
            error: 'Not eligible for immediate cancellation',
            message: 'Immediate cancellation is only available within 30 days of upgrade or 7 days before renewal'
          },
          { status: 400 }
        )
      }
      
      // Cancel immediately
      effectiveDate = new Date()
      courtesyUntil = calculateCourtesyEnd(effectiveDate)
      
      updateData = {
        plan: 'free',
        status: 'grace',
        board_cap: 1,
        active_cap_per_board: 100,
        archive_retention_days: 90,
        archived_cap_per_user: 1000,
        cancel_at_period_end: false,
        cancel_effective_at: effectiveDate.toISOString(),
        courtesy_until: courtesyUntil.toISOString(),
        enforcement_state: 'soft_warn',
        updated_at: new Date().toISOString()
      }
      
    } else {
      console.log('>>> Taking SCHEDULED cancellation branch (at period end)')
      // Cancel at period end (default)
      
      // Use current_period_end or default to 30 days from now
      effectiveDate = entitlements.current_period_end
        ? new Date(entitlements.current_period_end)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      
      courtesyUntil = calculateCourtesyEnd(effectiveDate)
      
      updateData = {
        cancel_at_period_end: true,
        status: 'cancel_scheduled',
        cancel_effective_at: effectiveDate.toISOString(),
        courtesy_until: courtesyUntil.toISOString(), // Set courtesy period for scheduled cancellations too
        updated_at: new Date().toISOString()
      }
    }

    // Update entitlements
    console.log('Updating entitlements with data:', updateData)
    const { data: updatedData, error: updateError } = await supabase
      .from('entitlements')
      .update(updateData)
      .eq('user_id', user.id)
      .select()

    if (updateError) {
      console.error('Error updating entitlements:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      )
    }
    
    console.log('Successfully updated entitlements:', updatedData)

    // Log event
    await logSubscriptionEvent(
      user.id,
      'cancel_requested',
      {
        cancel_now: cancelNow,
        effective_date: effectiveDate.toISOString(),
        courtesy_until: courtesyUntil.toISOString()
      },
      user.id
    )

    // TODO: Send cancellation email

    return NextResponse.json({
      success: true,
      effectiveDate: effectiveDate.toISOString(),
      courtesyUntil: courtesyUntil.toISOString(),
      message: cancelNow
        ? `Pro plan cancelled immediately. You have until ${formatDate(courtesyUntil)} to resolve over-limit items.`
        : `Pro plan will end on ${formatDate(effectiveDate)}. You'll have until ${formatDate(courtesyUntil)} to resolve over-limit items.`
    })

  } catch (err) {
    console.error('Error in cancel subscription:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
