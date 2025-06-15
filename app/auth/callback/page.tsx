'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        
        // URLフラグメントからパラメータを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        console.log('Auth callback params:', {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          error,
          errorDescription
        })

        if (error) {
          console.error('OAuth error:', error, errorDescription)
          router.push(`/auth?error=${encodeURIComponent(errorDescription || error)}`)
          return
        }

        if (accessToken) {
          // トークンを使用してセッションを設定
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            router.push(`/auth?error=${encodeURIComponent('セッションの設定に失敗しました')}`)
            return
          }

          if (data.user) {
            // プロフィール作成または更新
            const { data: existingProfile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (!existingProfile && profileError?.code === 'PGRST116') {
              const username = data.user.email?.split('@')[0] || `user_${data.user.id.slice(0, 8)}`
              const nickname = data.user.user_metadata?.full_name || data.user.user_metadata?.name || username

              await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  username,
                  nickname,
                  avatar_url: data.user.user_metadata?.avatar_url,
                })
            }

            console.log('Authentication successful, redirecting to dashboard')
            router.push('/dashboard')
            return
          }
        }

        // 通常のコールバック処理（コードベース）
        const { error: authError } = await supabase.auth.getSession()
        if (authError) {
          console.error('Auth error:', authError)
          router.push(`/auth?error=${encodeURIComponent('認証に失敗しました')}`)
        } else {
          router.push('/dashboard')
        }

      } catch (error) {
        console.error('Callback error:', error)
        router.push(`/auth?error=${encodeURIComponent('認証処理中にエラーが発生しました')}`)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-magic flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>
  )
}