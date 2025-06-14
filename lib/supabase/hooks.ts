import { useEffect, useState } from 'react'
import { createClient } from './client'
import type { User } from '@supabase/supabase-js'

// グローバルなSupabaseクライアントインスタンス
const supabase = createClient()

export function useSupabaseClient() {
  return supabase
}

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初期ユーザー情報を取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}