// 認証関連のユーティリティ関数

export function getBaseUrl() {
  // 本番環境では固定のメインドメインを使用
  if (process.env.NODE_ENV === 'production') {
    return 'https://schedule-management-ujwr.vercel.app'
  }
  
  // 開発環境
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  return 'http://localhost:3001'
}

export function getAuthCallbackUrl() {
  return `${getBaseUrl()}/auth/callback`
}