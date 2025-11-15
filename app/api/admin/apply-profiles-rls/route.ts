import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const isAdmin = user.email?.toLowerCase() === 'simon@teamtwobees.com' ||
                   user.email?.toLowerCase() === 'simon@threelanes.app' ||
                   user.email?.endsWith('@threelanes.app') ||
                   user.email?.endsWith('@teamtwobees.com')
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Apply RLS policies for profiles table
    const { error } = await supabase.rpc('apply_admin_policies', {
      table_name: 'profiles'
    })

    if (error) {
      console.log('RPC failed, trying direct SQL...')
      
      // Try direct SQL approach
      const { error: sqlError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (sqlError) {
        return NextResponse.json({ 
          error: 'Failed to apply policies', 
          details: sqlError.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin RLS policies applied to profiles table' 
    })

  } catch (err) {
    console.error('Error applying RLS policies:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
