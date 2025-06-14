'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { respondToGroupInvitation, getGroup } from '@/lib/supabase/groups'
import { createClient } from '@/lib/supabase/client'
import type { Group } from '@/types/group'

export default function InviteAcceptancePage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, user } = useAuthSimplified()
  const [invitation, setInvitation] = useState<any>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invitationId = params.id as string

  const loadInvitation = useCallback(async () => {
    try {
      setLoading(true)
      
      const supabase = createClient()
      
      // 招待情報を取得
      const { data, error } = await supabase
        .from('group_invitations')
        .select('*, groups(*)')
        .eq('id', invitationId)
        .single()

      if (error || !data) {
        setError('招待が見つかりません')
        return
      }

      // 有効期限チェック
      if (new Date(data.expires_at) < new Date()) {
        setError('この招待は有効期限が切れています')
        return
      }

      // 既に使用済みかチェック
      if (data.status !== 'pending') {
        setError('この招待は既に使用されています')
        return
      }

      setInvitation(data)
      setGroup(data.groups)
    } catch (err) {
setError('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [invitationId])

  useEffect(() => {
    if (!authLoading) {
      loadInvitation()
    }
  }, [invitationId, authLoading, loadInvitation])

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // ログインページへリダイレクト（招待IDを保持）
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingInvite', invitationId)
      }
      router.push('/auth')
      return
    }

    try {
      setProcessing(true)
      await respondToGroupInvitation(invitationId, 'accepted')
      router.push(`/groups/${invitation.group_id}`)
    } catch (error: any) {
if (error.message?.includes('already a member')) {
        setError('既にこのグループのメンバーです')
      } else {
        setError('招待の承認に失敗しました')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleDecline = async () => {
    try {
      setProcessing(true)
      await respondToGroupInvitation(invitationId, 'declined')
      router.push('/groups')
    } catch (error) {
setError('エラーが発生しました')
    } finally {
      setProcessing(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">エラー</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/groups')}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-soft hover:shadow-md transition-all duration-300"
          >
            グループ一覧へ
          </button>
        </div>
      </div>
    )
  }

  if (!invitation || !group) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-4 shadow-inner">
            {group.icon_type === 'emoji' && group.icon_emoji ? group.icon_emoji : '👥'}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            グループへの招待
          </h1>
          <p className="text-gray-600">
            「{group.name}」に招待されています
          </p>
        </div>

        {group.description && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700">{group.description}</p>
          </div>
        )}

        <div className="space-y-3">
          {!isAuthenticated ? (
            <>
              <p className="text-sm text-gray-600 text-center mb-4">
                招待を受けるにはログインが必要です
              </p>
              <button
                onClick={handleAccept}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-soft hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
              >
                ログインして参加
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAccept}
                disabled={processing}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-soft hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    処理中...
                  </span>
                ) : (
                  '招待を受ける'
                )}
              </button>
              <button
                onClick={handleDecline}
                disabled={processing}
                className="w-full px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                辞退する
              </button>
            </>
          )}
        </div>
      </div>

      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pastel-pink rounded-full blur-3xl opacity-30 animate-float" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-pastel-blue rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  )
}