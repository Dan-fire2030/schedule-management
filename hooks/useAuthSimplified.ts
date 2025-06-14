'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useAuthSimplified() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let isCancelled = false
    let timeoutId: NodeJS.Timeout

    const initAuth = async () => {
      try {
        timeoutId = setTimeout(() => {
          if (!isCancelled) {
            setError('認証の初期化がタイムアウトしました。ネットワーク接続を確認してください。')
            setLoading(false)
          }
        }, 10000)

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!isCancelled) {
          clearTimeout(timeoutId)
          
          if (sessionError) {
            setError('セッション取得に失敗しました')
            setLoading(false)
            return
          }
          
          setUser(session?.user || null)
          
          // プロフィール取得を追加
          if (session?.user) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
              
              if (!isCancelled) {
                setProfile(profileData)
              }
            } catch (profileError) {
              // プロフィール取得エラーは無視して続行
            }
          }
          
          setLoading(false)
        }
        
      } catch (err) {
        if (!isCancelled) {
          clearTimeout(timeoutId)
          setError('認証の初期化に失敗しました')
          setLoading(false)
        }
      }
    }

    initAuth().catch((err) => {
      if (!isCancelled) {
        setError('認証の初期化に失敗しました')
        setLoading(false)
      }
    })

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isCancelled) {
          setUser(session?.user || null)
          setError(null)
          
          // SIGNED_INイベント時はローディング終了
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    const supabase = createClient()
    
    // 本番環境とローカル環境でリダイレクトURLを適切に設定
    let redirectTo: string | undefined
    if (typeof window !== 'undefined') {
      // クライアントサイドでは現在のオリジンを使用
      redirectTo = `${window.location.origin}/auth/callback`
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    return { data, error }
  }

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@schedule-management.local`,
        password,
      })

      if (error) throw error

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  const signUpWithUsername = async (username: string, password: string, nickname: string) => {
    try {
      const supabase = createClient()
      
      // ユーザー名の重複チェック
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existingProfile) {
        throw new Error('このユーザー名は既に使用されています')
      }

      // アカウント作成
      const { data, error } = await supabase.auth.signUp({
        email: `${username}@schedule-management.local`,
        password,
        options: {
          data: {
            username,
            nickname,
          }
        }
      })

      if (error) throw error

      // プロフィール作成
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            nickname,
          })

        if (profileError) throw profileError
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setError(null)
    setLoading(false)
  }

  return {
    user,
    profile,
    loading,
    error,
    signInWithGoogle,
    signInWithUsername,
    signUpWithUsername,
    signOut,
    isAuthenticated: !!user,
  }
}