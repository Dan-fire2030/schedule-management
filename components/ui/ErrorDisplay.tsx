'use client'

import React from 'react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
  error: string | null
  onRetry?: () => void
  variant?: 'inline' | 'modal' | 'toast' | 'card'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  icon?: React.ReactNode
  title?: string
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  variant = 'inline',
  size = 'md',
  className,
  icon,
  title
}: ErrorDisplayProps) {
  if (!error) return null

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm',
    lg: 'p-6 text-base'
  }

  const variantClasses = {
    inline: 'bg-red-50 border border-red-200 text-red-700 rounded-lg',
    modal: 'bg-white border border-red-300 text-red-700 shadow-lg rounded-xl',
    toast: 'bg-red-500 text-white shadow-lg rounded-lg',
    card: 'bg-white border border-red-200 text-red-700 shadow-sm rounded-xl'
  }

  const iconClasses = {
    inline: 'text-red-500',
    modal: 'text-red-500',
    toast: 'text-white',
    card: 'text-red-500'
  }

  const defaultIcon = (
    <svg 
      className={cn('w-5 h-5', iconClasses[variant])} 
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
  )

  return (
    <div className={cn(
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      <div className="flex items-start gap-3">
        {/* アイコン */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || defaultIcon}
        </div>
        
        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn(
              'font-medium mb-1',
              variant === 'toast' ? 'text-white' : 'text-red-800'
            )}>
              {title}
            </h3>
          )}
          
          <p className={cn(
            variant === 'toast' ? 'text-red-100' : 'text-red-600'
          )}>
            {error}
          </p>
          
          {onRetry && (
            <div className="mt-3">
              <Button
                onClick={onRetry}
                variant={variant === 'toast' ? 'secondary' : 'outline'}
                size="sm"
                className={cn(
                  variant === 'toast' 
                    ? 'bg-white/20 text-white border-white/30 hover:bg-white/30' 
                    : 'border-red-300 text-red-700 hover:bg-red-50'
                )}
              >
                再試行
              </Button>
            </div>
          )}
        </div>
        
        {/* 閉じるボタン（トースト用） */}
        {variant === 'toast' && (
          <button
            onClick={() => {/* 閉じる処理 */}}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// 特定用途向けのプリセットコンポーネント
export function NetworkErrorDisplay({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error="ネットワーク接続を確認してください"
      title="接続エラー"
      onRetry={onRetry}
      variant="card"
      icon={
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22m0-12l-8-8m8 8l8-8" />
        </svg>
      }
    />
  )
}

export function AuthErrorDisplay({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error={error}
      title="認証エラー"
      onRetry={onRetry}
      variant="modal"
      icon={
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
    />
  )
}

export function LoadingErrorDisplay({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error="データの読み込みに失敗しました"
      title="読み込みエラー"
      onRetry={onRetry}
      variant="inline"
      icon={
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      }
    />
  )
}