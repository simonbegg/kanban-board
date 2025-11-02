import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'

export async function POST() {
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Reset last notification sent to null (or a very old date)
    const { error } = await supabase
      .from('profiles')
      .update({ 
        last_notification_sent: null 
      })
      .eq('id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notification timestamp reset. You can now test email sending again.'
    })
  } catch (err) {
    console.error('Error resetting notification:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
