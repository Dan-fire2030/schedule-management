import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const subscription = await request.json()

    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 既存の購読を確認
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existingSubscription) {
      // 既存の購読を更新
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          keys: subscription.keys,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)

      if (error) {
return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
      }
    } else {
      // 新しい購読を作成
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}