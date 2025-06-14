import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

// VAPID keys設定
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId, title, body, data } = await request.json()

    // 管理者権限チェック（必要に応じて）
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ユーザーの購読情報を取得
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys')
      .eq('user_id', userId)

    if (error) {
return NextResponse.json({ error: 'Failed to get subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 })
    }

    // 通知ペイロード作成
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data || {}
    })

    // 各購読に通知を送信
    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys
        }

        await webpush.sendNotification(pushSubscription, payload)
        return { success: true, endpoint: subscription.endpoint }
      } catch (error) {
// 無効な購読は削除
        if ((error as any).statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint)
        }
        
        return { success: false, endpoint: subscription.endpoint, error: error }
      }
    })

    const results = await Promise.all(promises)
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      results
    })
  } catch (error) {
return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}