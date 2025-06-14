// 統一されたスタイルシステム
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Tailwindクラスを統合するユーティリティ
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// カラーテーマ
export const colors = {
  primary: {
    50: 'bg-primary-50 text-primary-900',
    100: 'bg-primary-100 text-primary-900',
    500: 'bg-primary-500 text-white',
    600: 'bg-primary-600 text-white',
    700: 'bg-primary-700 text-white',
  },
  secondary: {
    50: 'bg-secondary-50 text-secondary-900',
    100: 'bg-secondary-100 text-secondary-900',
    500: 'bg-secondary-500 text-white',
    600: 'bg-secondary-600 text-white',
  },
  accent: {
    50: 'bg-accent-50 text-accent-900',
    100: 'bg-accent-100 text-accent-900',
    500: 'bg-accent-500 text-white',
  }
}

// ボタンスタイル
export const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  
  variants: {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 focus:ring-primary-500 shadow-md hover:shadow-lg',
    secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 focus:ring-secondary-500 shadow-md hover:shadow-lg',
    accent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 focus:ring-accent-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-primary-300 text-primary-700 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
    magic: 'bg-gradient-to-r from-pastel-purple via-pastel-pink to-pastel-blue text-primary-700 hover:shadow-glow transition-all duration-300',
  },
  
  sizes: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
    icon: 'h-10 w-10 p-0',
  }
}

// カードスタイル
export const cardStyles = {
  base: 'rounded-2xl transition-all duration-200',
  
  variants: {
    default: 'bg-white dark:bg-gray-800 shadow-soft hover:shadow-md border border-gray-100 dark:border-gray-700',
    glow: 'bg-white dark:bg-gray-800 shadow-glow hover:shadow-glow-lg border border-primary-100 dark:border-primary-900',
    mystic: 'bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900 shadow-mystic border border-purple-100 dark:border-purple-800',
    glass: 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-soft border border-white/20 dark:border-gray-700/20',
  }
}

// インプットスタイル
export const inputStyles = {
  base: 'w-full rounded-xl border-2 px-4 py-3 text-sm transition-all duration-200 focus:outline-none',
  
  variants: {
    default: 'border-gray-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-primary-400',
    error: 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-red-600 dark:bg-red-900/20',
    success: 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-green-600 dark:bg-green-900/20',
  }
}

// テキストスタイル
export const textStyles = {
  display: {
    '1': 'text-4xl md:text-6xl font-bold tracking-tight',
    '2': 'text-3xl md:text-5xl font-bold tracking-tight',
    '3': 'text-2xl md:text-4xl font-bold tracking-tight',
  },
  
  heading: {
    '1': 'text-3xl font-bold',
    '2': 'text-2xl font-bold',
    '3': 'text-xl font-semibold',
    '4': 'text-lg font-semibold',
  },
  
  body: {
    lg: 'text-lg',
    md: 'text-base',
    sm: 'text-sm',
    xs: 'text-xs',
  },
  
  gradient: 'bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent',
}

// スペーシング
export const spacing = {
  section: 'py-12 md:py-16 lg:py-20',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  grid: 'grid gap-6 md:gap-8',
}

// レスポンシブブレークポイント
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// 背景パターン
export const backgrounds = {
  magic: 'bg-gradient-to-br from-pastel-pink via-white to-pastel-blue dark:from-gray-900 dark:via-gray-800 dark:to-purple-900',
  sunset: 'bg-gradient-to-br from-orange-100 via-yellow-50 to-pink-100 dark:from-orange-900 dark:via-yellow-900 dark:to-pink-900',
  mystic: 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900',
}