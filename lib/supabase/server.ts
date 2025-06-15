import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getCleanSupabaseUrl, getCleanSupabaseKey } from '@/lib/utils/env'

export async function createClient() {
  const supabaseUrl = getCleanSupabaseUrl()
  const supabaseAnonKey = getCleanSupabaseKey()

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}