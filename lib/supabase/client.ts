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
  
  // @ts-ignore - 型定義の不一致を無視
  return createBrowserClient<Database>(
    url,
    key,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-web'
        }
      },
      db: {
        schema: 'public'
      }
    }
  )
}