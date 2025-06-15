// 認証関連のユーティリティ関数

export function getBaseUrl() {
  // Vercel環境では常に固定のメインドメインを使用
  if (process.env.VERCEL) {
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