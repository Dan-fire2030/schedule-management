'use client'

import React from 'react'
import { Button } from './Button'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: Error
    resetError: () => void
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
this.setState({
      error,
      errorInfo
    })

    // カスタムエラーハンドラがあれば実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // カスタムFallbackコンポーネントがあれば使用
      if (this.props.fallback && this.state.error) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      // デフォルトのエラー表示
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// デフォルトのエラーフォールバックコンポーネント
function DefaultErrorFallback({ 
  error, 
  resetError 
}: { 
  error?: Error
  resetError: () => void 
}) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
        {/* エラーアイコン */}
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* エラーメッセージ */}
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {ERROR_MESSAGES.UNEXPECTED_ERROR}
        </h2>
        
        <p className="text-gray-600 mb-6">
          申し訳ございません。アプリケーションで問題が発生しました。
          <br />
          この問題が続く場合は、お知らせください。
        </p>

        {/* 開発環境でのエラー詳細 */}
        {isDevelopment && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
              エラー詳細（開発者向け）
            </summary>
            <div className="bg-gray-100 rounded-lg p-3 text-xs font-mono text-gray-800 max-h-32 overflow-auto">
              <div className="font-bold mb-1">Error: {error.name}</div>
              <div className="mb-2">{error.message}</div>
              {error.stack && (
                <pre className="whitespace-pre-wrap">{error.stack}</pre>
              )}
            </div>
          </details>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={resetError}
            variant="primary"
            className="flex-1"
          >
            再試行
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex-1"
          >
            ページを再読み込み
          </Button>
        </div>

        {/* ホームに戻るリンク */}
        <div className="mt-4">
          <Button
            onClick={() => window.location.href = '/'}
            variant="ghost"
            size="sm"
          >
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  )
}

// 特定領域用のエラーバウンダリー
export function FeatureErrorBoundary({ 
  children, 
  featureName 
}: { 
  children: React.ReactNode
  featureName: string 
}) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-medium text-red-800">
              {featureName}でエラーが発生しました
            </h3>
          </div>
          
          <p className="text-red-600 text-sm mb-4">
            この機能は一時的に利用できません。しばらく待ってから再試行してください。
          </p>
          
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            再試行
          </Button>
        </div>
      )}
      onError={(error, errorInfo) => {
}}
    >
      {children}
    </ErrorBoundary>
  )
}

// Async Boundary (非同期エラー用)
export function AsyncErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm mb-3">読み込み中にエラーが発生しました</p>
            <Button onClick={resetError} size="sm" variant="outline">
              再試行
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}