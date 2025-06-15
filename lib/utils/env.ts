// 環境変数のクリーニング用ユーティリティ

export function cleanEnvVar(value: string | undefined): string {
  if (!value) return ''
  
  return value
    .trim()                    // 前後の空白を削除
    .replace(/\s+/g, '')       // すべての空白文字を削除
    .replace(/\n/g, '')        // 改行文字を削除
    .replace(/\r/g, '')        // キャリッジリターンを削除
    .replace(/\t/g, '')        // タブ文字を削除
}

export function getCleanSupabaseUrl(): string {
  const url = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URLが設定されていません')
  }
  return url
}

export function getCleanSupabaseKey(): string {
  const key = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEYが設定されていません')
  }
  return key
}