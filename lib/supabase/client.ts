import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getCleanSupabaseUrl, getCleanSupabaseKey } from '@/lib/utils/env'

// シングルトンパターンでクライアントを管理
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  // 既存のクライアントがあれば再利用
  if (supabaseClient) {
    return supabaseClient
  }

  const url = getCleanSupabaseUrl()
  const key = getCleanSupabaseKey()
  
  supabaseClient = createSupabaseClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token'
    }
  })

  return supabaseClient
}