'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import Link from 'next/link'

function HomeContent() {
  const { isAuthenticated, loading } = useAuthSimplified()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)

  useEffect(() => {
    // OAuthコードがある場合の処理
    const code = searchParams.get('code')
    if (code && !isProcessingAuth) {
      setIsProcessingAuth(true)
      // auth/callbackにリダイレクト
      router.push(`/auth/callback?code=${code}`)
    }
  }, [searchParams, router, isProcessingAuth])

  useEffect(() => {
    if (!loading && isAuthenticated && !isProcessingAuth) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router, isProcessingAuth])

  if (loading) {
    return (
      <div className="min-h-screen bg-magic flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 animate-in">
        <h1 className="text-5xl md:text-7xl font-display font-bold text-gradient">
          スケマネ
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
          友達と楽しく予定を管理しよう✨
        </p>
        <div className="pt-8">
          <Link href="/auth">
            <button className="px-8 py-4 bg-gradient-to-r from-pastel-pink to-pastel-purple text-white rounded-full font-medium text-lg shadow-dream hover:shadow-lg transition-all duration-300 hover:scale-105">
              はじめる
            </button>
          </Link>
        </div>
      </div>
      
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pastel-pink rounded-full blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-pastel-blue rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pastel-purple rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-magic flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}