// 認証関連のユーティリティ関数

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // ブラウザ環境
    return window.location.origin
  }
  
  // サーバー環境
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  return 'http://localhost:3001'
}

export function getAuthCallbackUrl() {
  return `${getBaseUrl()}/auth/callback`
}