import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URLが設定されていません')
  }
  
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEYが設定されていません')
  }
  
  return createBrowserClient<Database>(url, key)
}