'use client'

import { useState, lazy, Suspense } from 'react'
const MotionDiv = lazy(() => import('framer-motion').then(mod => ({ default: mod.motion.div })))
import { FaGoogle, FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'

interface SignupFormProps {
  onSwitchToLogin: () => void
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signUpWithUsername, signInWithGoogle } = useAuthSimplified()

  const passwordValidation = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  const isFormValid = username && nickname && password && confirmPassword && 
                     isPasswordValid && password === confirmPassword

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('すべての項目を正しく入力してください')
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await signUpWithUsername(username, password, nickname)
    
    if (error) {
      setError(error.message || 'アカウント作成に失敗しました')
    }
    
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await signInWithGoogle()
    
    if (error) {
      setError('Googleアカウントでの登録に失敗しました')
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
            アカウント作成
          </h2>
          <p className="text-gray-600">
            スケマネへようこそ！
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200 bg-white/50"
              placeholder="英数字とアンダースコアのみ"
              disabled={loading}
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              英数字とアンダースコア（_）のみ使用可能
            </p>
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              ニックネーム
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200 bg-white/50"
              placeholder="表示名を入力"
              disabled={loading}
              maxLength={20}
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
            
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  {passwordValidation.length ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                  <span className={passwordValidation.length ? 'text-green-600' : 'text-red-600'}>
                    8文字以上
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  {passwordValidation.hasNumber ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                  <span className={passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}>
                    数字を含む
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  {passwordValidation.hasLetter ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                  <span className={passwordValidation.hasLetter ? 'text-green-600' : 'text-red-600'}>
                    英字を含む
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード確認
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200 bg-white/50"
                placeholder="パスワードを再入力"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-600 text-xs mt-1">パスワードが一致しません</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-gradient-to-r from-secondary-400 to-secondary-600 text-white py-3 rounded-2xl font-medium hover:from-secondary-500 hover:to-secondary-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>アカウント作成中...</span>
              </div>
            ) : (
              'アカウント作成'
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
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full mt-4 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            <FaGoogle className="text-red-500" />
            <span>Googleで登録</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
              disabled={loading}
            >
              ログイン
            </button>
          </p>
        </div>
      </div>
      </MotionDiv>
    </Suspense>
  )
}