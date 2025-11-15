'use server'

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'

// Server-side Supabase client for Server Actions
export const createServerActionClient = () => {
  return createRouteHandlerClient<Database>({ cookies })
}
