'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== AUTH CALLBACK DEBUG ===')
        console.log('Full URL:', window.location.href)
        console.log('Hash:', window.location.hash)
        console.log('Search params:', window.location.search)
        
        const supabase = createClient()
        
        // URLフラグメントからパラメータを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        // URLクエリパラメータからも確認
        const searchParams = new URLSearchParams(window.location.search)
        const queryError = searchParams.get('error')
        const queryErrorDescription = searchParams.get('error_description')

        console.log('Hash params:', {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          error,
          errorDescription,
          allHashParams: Array.from(hashParams.entries())
        })

        console.log('Query params:', {
          error: queryError,
          errorDescription: queryErrorDescription,
          allQueryParams: Array.from(searchParams.entries())
        })

        // エラーハンドリング（ハッシュパラメータとクエリパラメータ両方をチェック）
        const finalError = error || queryError
        const finalErrorDescription = errorDescription || queryErrorDescription
        
        if (finalError) {
          console.error('OAuth error:', finalError, finalErrorDescription)
          router.push(`/auth?error=${encodeURIComponent(finalErrorDescription || finalError)}`)
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
        console.log('No access token found, checking for existing session...')
        const { data: sessionData, error: authError } = await supabase.auth.getSession()
        
        console.log('Session check result:', {
          hasSession: !!sessionData.session,
          hasUser: !!sessionData.session?.user,
          error: authError
        })
        
        if (authError) {
          console.error('Auth error:', authError)
          router.push(`/auth?error=${encodeURIComponent('認証に失敗しました')}`)
        } else if (sessionData.session?.user) {
          console.log('Existing session found, redirecting to dashboard')
          router.push('/dashboard')
        } else {
          console.log('No session found, redirecting to auth with error')
          router.push(`/auth?error=${encodeURIComponent('認証情報が見つかりませんでした')}`)
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