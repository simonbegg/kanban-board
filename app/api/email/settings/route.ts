import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'
import { updateEmailSettings, getEmailSettings } from '@/lib/email'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const settings = await getEmailSettings(supabase, user.id)
    return NextResponse.json(settings)
  } catch (err) {
    console.error('Error getting email settings:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { enabled, email, frequency } = body

    // Validate email format if provided
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate frequency
    if (frequency && !['daily', 'weekly'].includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency. Must be daily or weekly' }, { status: 400 })
    }

    // Update settings
    await updateEmailSettings(supabase, user.id, { enabled, email, frequency })

    // Return updated settings
    const updatedSettings = await getEmailSettings(supabase, user.id)
    return NextResponse.json(updatedSettings)
  } catch (err) {
    console.error('Error updating email settings:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
