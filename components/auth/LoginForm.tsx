'use client'

import { useState, lazy, Suspense } from 'react'
const MotionDiv = lazy(() => import('framer-motion').then(mod => ({ default: mod.motion.div })))
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'

interface LoginFormProps {
  onSwitchToSignup: () => void
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signInWithGoogle, signInWithUsername } = useAuthSimplified()

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('ユーザー名とパスワードを入力してください')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await signInWithUsername(username, password)
    
    if (error) {
      setError('ユーザー名またはパスワードが正しくありません')
    }
    
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await signInWithGoogle()
    
    if (error) {
      setError('Googleログインに失敗しました')
      setLoading(false)
    }
  }

  return (
    <Suspense fallback={<div className="w-full max-w-md mx-auto opacity-0"><div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-dream p-8 border border-white/20 h-96" /></div>}>
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-dream p-8 border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-gradient mb-2">
            おかえりなさい！
          </h2>
          <p className="text-gray-600">
            アカウントにログインしてください
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleUsernameLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200 bg-white/50"
              placeholder="ユーザー名を入力"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200 bg-white/50"
                placeholder="パスワードを入力"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-400 to-primary-600 text-white py-3 rounded-2xl font-medium hover:from-primary-500 hover:to-primary-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>ログイン中...</span>
              </div>
            ) : (
              'ログイン'
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-gray-500">または</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-4 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            <FaGoogle className="text-red-500" />
            <span>Googleでログイン</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            まだアカウントをお持ちでない方は{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
              disabled={loading}
            >
              新規登録
            </button>
          </p>
        </div>
      </div>
      </MotionDiv>
    </Suspense>
  )
}