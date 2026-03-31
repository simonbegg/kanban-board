import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { type Database } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code      = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type      = requestUrl.searchParams.get('type')

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

  if (code) {
    // PKCE flow — used by OAuth sign-in and some password-reset configurations
    await supabase.auth.exchangeCodeForSession(code)
  } else if (tokenHash && type) {
    // Email OTP / token-hash flow — Supabase v2 default for email links
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email',
    })
  }

  // Always redirect to /board. For password reset flows, the board page
  // detects the reset_pending localStorage flag and redirects to /auth/reset-password.
  return NextResponse.redirect(new URL('/board', requestUrl.origin))
}
