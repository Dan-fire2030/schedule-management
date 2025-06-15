'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { isAuthenticated, loading } = useAuthSimplified()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setAuthError(decodeURIComponent(error))
      console.error('Auth page error:', error)
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // 保留中の招待があるかチェック
      const pendingInvite = sessionStorage.getItem('pendingInvite')
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite')
        router.push(`/invite/${pendingInvite}`)
      } else {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-magic flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
          <p className="text-xs text-gray-400 mt-2">
            読み込みに時間がかかっています...
          </p>
        </div>
      </div>
    )
  }

  if (!loading && isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-magic flex items-center justify-center p-4">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pastel-pink rounded-full blur-3xl opacity-30 animate-float" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-pastel-blue rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pastel-purple rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />
        
        {/* キラキラエフェクト */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-sparkle" />
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-pink-300 rounded-full animate-sparkle" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-300 rounded-full animate-sparkle" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full">
        {authError && (
          <div className="max-w-md mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">認証エラー</h3>
                <p className="text-red-600 text-sm mt-1">{authError}</p>
              </div>
            </div>
          </div>
        )}
        
        {isLogin ? (
          <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
        ) : (
          <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}