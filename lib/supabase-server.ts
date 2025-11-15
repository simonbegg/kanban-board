import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'

// Server-side Supabase client for API routes (server-only)
export const createServerClient = () => {
  return createRouteHandlerClient<Database>({ cookies: () => cookies() })
}
