import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
if (error) {
return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const supabase = await createClient()
    
    try {
const { data, error } = await supabase.auth.exchangeCodeForSession(code)
if (error) {
return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('認証に失敗しました')}`)
      }

      if (data.user) {
// Google認証の場合、プロフィールを作成または更新
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
if (!existingProfile && profileError?.code === 'PGRST116') {
          // 新規ユーザーの場合、プロフィールを作成
          const username = data.user.email?.split('@')[0] || `user_${data.user.id.slice(0, 8)}`
          const nickname = data.user.user_metadata?.full_name || data.user.user_metadata?.name || username
const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username,
              nickname,
              avatar_url: data.user.user_metadata?.avatar_url,
            })

          if (insertError) {
} else {
}
        }

        // 認証成功時はダッシュボードにリダイレクト
const redirectUrl = new URL('/dashboard', origin)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
}
  }

  // エラーの場合は認証ページにリダイレクト
return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('認証に失敗しました')}`)
}