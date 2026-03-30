import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { type Database } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code       = requestUrl.searchParams.get('code')
  const tokenHash  = requestUrl.searchParams.get('token_hash')
  const type       = requestUrl.searchParams.get('type')
  const next       = requestUrl.searchParams.get('next') ?? '/board'

  // Validate next is a relative path to prevent open-redirect
  const redirectPath = next.startsWith('/') ? next : '/board'

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

  if (code) {
    // PKCE flow — OAuth and some password-reset configurations
    await supabase.auth.exchangeCodeForSession(code)
  } else if (tokenHash && type) {
    // Email OTP / token-hash flow — Supabase v2 default for email links
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email',
    })
  }

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
