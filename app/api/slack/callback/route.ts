import { NextRequest, NextResponse } from 'next/server'
import { exchangeSlackCode, saveSlackCredentials, getSlackDMChannel } from '@/lib/slack'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // This is the user ID
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/board?slack_error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/board?slack_error=missing_params', request.url)
    )
  }

  try {
    const supabase = createServerClient()
    
    // Exchange code for access token
    const slackProfile = await exchangeSlackCode(code)

    // Get DM channel ID for notifications
    const dmChannelId = await getSlackDMChannel(slackProfile.access_token, slackProfile.user_id)
    slackProfile.channel_id = dmChannelId

    // Save to database
    await saveSlackCredentials(supabase, state, slackProfile)

    // Redirect back to board with success message
    return NextResponse.redirect(
      new URL('/board?slack_connected=true', request.url)
    )
  } catch (err) {
    console.error('Slack OAuth error:', err)
    return NextResponse.redirect(
      new URL(`/board?slack_error=${encodeURIComponent((err as Error).message)}`, request.url)
    )
  }
}
