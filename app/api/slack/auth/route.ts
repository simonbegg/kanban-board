import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getSlackAuthUrl } from '@/lib/slack'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Generate Slack OAuth URL
  const authUrl = getSlackAuthUrl(user.id)

  // Redirect to Slack authorization
  return NextResponse.redirect(authUrl)
}
