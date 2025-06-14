'use client'

import { useState, useEffect } from 'react'
import { 
  UsersIcon,
  ChatBubbleLeftIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import type { EventParticipant, ParticipationStatus } from '@/types/event'
import { PARTICIPATION_STATUS } from '@/types/event'
import Image from 'next/image'

interface ParticipationSectionProps {
  eventId: string
  participants: EventParticipant[]
  currentUserId: string
  allowMaybe: boolean
  requireResponse: boolean
  maxParticipants?: number
  onParticipationChange: (status: ParticipationStatus, message?: string) => Promise<void>
  isLoading?: boolean
}

export function ParticipationSection({
  eventId,
  participants,
  currentUserId,
  allowMaybe,
  requireResponse,
  maxParticipants,
  onParticipationChange,
  isLoading = false
}: ParticipationSectionProps) {
  const [currentUserStatus, setCurrentUserStatus] = useState<ParticipationStatus | undefined>()
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseMessage, setResponseMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 現在のユーザーの参加状況を取得
  useEffect(() => {
    const userParticipation = participants.find(p => p.user_id === currentUserId)
    setCurrentUserStatus(userParticipation?.status)
    setResponseMessage(userParticipation?.response_message || '')
  }, [participants, currentUserId])

  // 参加統計を計算
  const stats = {
    attending: participants.filter(p => p.status === 'attending').length,
    not_attending: participants.filter(p => p.status === 'not_attending').length,
    pending: participants.filter(p => p.status === 'pending').length,
    total: participants.length
  }

  // 参加状況別にグループ化
  const groupedParticipants = {
    attending: participants.filter(p => p.status === 'attending'),
    not_attending: participants.filter(p => p.status === 'not_attending'),
    pending: participants.filter(p => p.status === 'pending')
  }

  const handleStatusChange = async (status: ParticipationStatus) => {
    if (submitting) return
    
    try {
      setSubmitting(true)
      await onParticipationChange(status, responseMessage.trim() || undefined)
      setShowResponseForm(false)
    } catch (error) {
} finally {
      setSubmitting(false)
    }
  }

  const canParticipate = !maxParticipants || stats.attending < maxParticipants

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <UsersIcon className="w-5 h-5" />
          参加者 ({stats.total}人)
        </h3>
        
        {maxParticipants && (
          <span className={`text-sm px-3 py-1 rounded-full ${
            stats.attending >= maxParticipants 
              ? 'bg-red-100 text-red-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {stats.attending}/{maxParticipants}人
          </span>
        )}
      </div>

      {/* 参加統計 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(PARTICIPATION_STATUS).map(([key, info]) => {
          if (key === 'pending' && !allowMaybe) return null
          
          const count = stats[key as keyof typeof stats]
          return (
            <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: info.color }}
              >
                {count}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <span>{info.icon}</span>
                <span>{info.name}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 現在のユーザーの参加状況 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-medium text-gray-800 mb-3">あなたの参加状況</h4>
        
        {currentUserStatus ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span 
                className="px-3 py-1 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: PARTICIPATION_STATUS[currentUserStatus].color }}
              >
                {PARTICIPATION_STATUS[currentUserStatus].icon} {PARTICIPATION_STATUS[currentUserStatus].name}
              </span>
              {responseMessage && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>&quot;{responseMessage}&quot;</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowResponseForm(true)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              変更
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              {requireResponse 
                ? 'このイベントは回答が必要です' 
                : '参加状況を選択してください'
              }
            </p>
            <button
              onClick={() => setShowResponseForm(true)}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              回答する
            </button>
          </div>
        )}
      </div>

      {/* 参加状況変更フォーム */}
      {showResponseForm && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h4 className="font-medium text-gray-800 mb-3">参加状況を選択</h4>
          
          {/* 参加状況ボタン */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => handleStatusChange('attending')}
              disabled={!canParticipate && currentUserStatus !== 'attending' || submitting}
              className={`p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                currentUserStatus === 'attending'
                  ? 'bg-green-500 text-white'
                  : canParticipate
                    ? 'bg-white border-2 border-green-500 text-green-500 hover:bg-green-50'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>{PARTICIPATION_STATUS.attending.icon}</span>
              {PARTICIPATION_STATUS.attending.name}
              {!canParticipate && currentUserStatus !== 'attending' && (
                <span className="text-xs">(満員)</span>
              )}
            </button>

            <button
              onClick={() => handleStatusChange('not_attending')}
              disabled={submitting}
              className={`p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                currentUserStatus === 'not_attending'
                  ? 'bg-red-500 text-white'
                  : 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50'
              }`}
            >
              <span>{PARTICIPATION_STATUS.not_attending.icon}</span>
              {PARTICIPATION_STATUS.not_attending.name}
            </button>

            {allowMaybe && (
              <button
                onClick={() => handleStatusChange('pending')}
                disabled={submitting}
                className={`col-span-2 p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  currentUserStatus === 'pending'
                    ? 'bg-gray-500 text-white'
                    : 'bg-white border-2 border-gray-500 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span>{PARTICIPATION_STATUS.pending.icon}</span>
                {PARTICIPATION_STATUS.pending.name}
              </button>
            )}
          </div>

          {/* メッセージ入力 */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              メッセージ（任意）
            </label>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="コメントがあれば入力してください..."
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowResponseForm(false)
                setResponseMessage('')
              }}
              className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 参加者一覧 */}
      <div className="space-y-4">
        {Object.entries(groupedParticipants).map(([status, statusParticipants]) => {
          if (statusParticipants.length === 0) return null
          if (status === 'pending' && !allowMaybe) return null

          const statusInfo = PARTICIPATION_STATUS[status as ParticipationStatus]

          return (
            <div key={status}>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span style={{ color: statusInfo.color }}>
                  {statusInfo.icon} {statusInfo.name}
                </span>
                <span className="text-sm text-gray-500">({statusParticipants.length}人)</span>
              </h4>
              
              <div className="grid gap-3">
                {statusParticipants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {/* アバター */}
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                      {participant.profile?.avatar_url ? (
                        <Image
                          src={participant.profile.avatar_url}
                          alt={participant.profile.nickname}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                          {participant.profile?.nickname?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* ユーザー情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">
                        {participant.profile?.nickname || 'Unknown User'}
                      </div>
                      {participant.response_message && (
                        <div className="text-sm text-gray-600 truncate">
                          &quot;{participant.response_message}&quot;
                        </div>
                      )}
                      {participant.responded_at && (
                        <div className="text-xs text-gray-500">
                          {new Date(participant.responded_at).toLocaleDateString('ja-JP')} 回答
                        </div>
                      )}
                    </div>

                    {/* 現在のユーザーを示すバッジ */}
                    {participant.user_id === currentUserId && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        あなた
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 参加者がいない場合 */}
      {participants.length === 0 && (
        <div className="text-center py-8">
          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">まだ参加者がいません</p>
        </div>
      )}
    </div>
  )
}