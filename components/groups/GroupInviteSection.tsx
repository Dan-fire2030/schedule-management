'use client'

import { useState, useEffect, useCallback } from 'react'
import QRCode from 'react-qr-code'
import { GroupService } from '@/lib/supabase/groups'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface GroupInviteSectionProps {
  groupId: string
  groupName: string
  onInviteSent?: () => void
}

export function GroupInviteSection({ groupId, groupName, onInviteSent }: GroupInviteSectionProps) {
  const [inviteUrl, setInviteUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [invitations, setInvitations] = useState<any[]>([])

  const loadInvitations = useCallback(async () => {
    try {
      const { invitations: data, error } = await GroupService.getGroupInvitations(groupId)
      if (error) {
setInvitations([])
      } else {
        setInvitations(data || [])
      }
    } catch (error) {
setInvitations([])
    }
  }, [groupId])

  useEffect(() => {
    // 初期読み込みでエラーが発生してもコンポーネントの表示に影響しないようにする
    if (groupId) {
      loadInvitations()
    }
  }, [groupId, loadInvitations])

  const generateInvite = async () => {
    try {
      setLoading(true)
      
      // 7日後の有効期限を設定
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      
      const { invitation } = await GroupService.createInvitation(groupId, 'qr', undefined, expiresAt)
      
      if (!invitation) {
        throw new Error('招待の作成に失敗しました')
      }
      
      // 招待リンクを生成
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${baseUrl}/invite/${invitation.id}`
      // QRコードは招待履歴で表示されるので、ここでのsetShowQRは不要
      
      // 招待一覧を再読み込み（エラーが起きてもQRコードは表示したまま）
      loadInvitations() // awaitを外して非同期実行
      onInviteSent?.()
    } catch (error: any) {
alert(`招待の作成に失敗しました: ${error.message || '不明なエラー'}`)
      // エラー時は特に何もしない（QRコードは履歴で管理されるため）
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
}
  }

  const activeInvitations = invitations.filter(inv => inv.status === 'pending')
  const usedInvitations = invitations.filter(inv => inv.status === 'accepted')

  return (
    <div className="space-y-6">
      {/* 招待生成セクション */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">新しい招待を作成</h2>
        
        <div className="text-center py-8">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p className="text-gray-600">QRコードで友達を招待しよう！</p>
            <button
              onClick={generateInvite}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-soft hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  生成中...
                </span>
              ) : (
                '招待リンクを生成'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 招待履歴 */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">招待履歴</h2>
        
        {invitations.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            まだ招待を送信していません
          </p>
        ) : (
          <div className="space-y-4">
            {/* 有効な招待 */}
            {activeInvitations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">有効な招待</h3>
                <div className="space-y-2">
                  {activeInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                    >
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* 左側: QRコード */}
                        <div className="flex justify-center lg:justify-start">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <QRCode 
                              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${invitation.id}`}
                              size={120}
                              level="M"
                            />
                          </div>
                        </div>
                        
                        {/* 右側: 招待情報 */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-800 mb-2">
                                招待QRコード
                              </h4>
                              <p className="text-xs text-gray-600 mb-1">
                                作成日: {format(new Date(invitation.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                              </p>
                              <p className="text-xs text-gray-600 mb-3">
                                有効期限: {format(new Date(invitation.expires_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                              </p>
                              
                              {/* URL表示とコピー */}
                              <div className="bg-white rounded-lg p-3 border">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${invitation.id}`}
                                    readOnly
                                    className="flex-1 bg-transparent text-xs text-gray-700 outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${invitation.id}`
                                      navigator.clipboard.writeText(url)
                                    }}
                                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                  >
                                    コピー
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                              有効
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 使用済みの招待 */}
            {usedInvitations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">使用済みの招待</h3>
                <div className="space-y-2">
                  {usedInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          招待リンク
                        </p>
                        <p className="text-xs text-gray-600">
                          使用日: {format(new Date(invitation.updated_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          使用済み
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}