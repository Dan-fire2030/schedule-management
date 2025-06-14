'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  TagIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { ParticipationSection } from './ParticipationSection'
import type { Event, EventParticipant, ParticipationStatus } from '@/types/event'
import { EVENT_TYPES, EVENT_PRIORITIES } from '@/types/event'

interface EventDetailModalProps {
  event: Event | null
  participants: EventParticipant[]
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onParticipationChange: (status: ParticipationStatus, message?: string) => Promise<void>
  currentUserId: string
  canEdit?: boolean
  isLoading?: boolean
}

export function EventDetailModal({
  event,
  participants,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onParticipationChange,
  currentUserId,
  canEdit = false,
  isLoading = false
}: EventDetailModalProps) {
  if (!isOpen || !event) return null

  const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || EVENT_TYPES.single
  const priority = EVENT_PRIORITIES[event.priority as keyof typeof EVENT_PRIORITIES] || EVENT_PRIORITIES.medium

  const formatEventDateTime = () => {
    const startDate = new Date(event.start_time)
    let endDate: Date | undefined
    if (event.end_time) {
      endDate = new Date(event.end_time)
    }

    if (event.is_all_day) {
      if (endDate && format(startDate, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd')) {
        return `${format(startDate, 'M月d日(E)', { locale: ja })} - ${format(endDate, 'M月d日(E)', { locale: ja })} 終日`
      }
      return `${format(startDate, 'M月d日(E)', { locale: ja })} 終日`
    }

    let dateTimeString = format(startDate, 'M月d日(E) HH:mm', { locale: ja })
    
    if (endDate) {
      // Same day check
      if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
        dateTimeString += ` - ${format(endDate, 'HH:mm')}`
      } else {
        dateTimeString += ` - ${format(endDate, 'M月d日(E) HH:mm', { locale: ja })}`
      }
    }

    return dateTimeString
  }

  const getStatusColor = () => {
    switch (event.status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{eventType.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{event.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${eventType.color}20`, color: eventType.color }}
                >
                  {eventType.name}
                </span>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
                >
                  {priority.name}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                  {event.status === 'published' ? '公開中' : 
                   event.status === 'draft' ? '下書き' :
                   event.status === 'cancelled' ? 'キャンセル' : '完了'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="編集"
              >
                <PencilIcon className="w-5 h-5 text-gray-600" />
              </button>
            )}
            {canEdit && onDelete && (
              <button
                onClick={onDelete}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="削除"
              >
                <TrashIcon className="w-5 h-5 text-red-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* 左側: イベント詳細 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 説明 */}
            {event.description && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">説明</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* 日時・場所情報 */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-800">詳細情報</h3>
              
              <div className="space-y-3">
                {/* 日時 */}
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">日時</div>
                    <div className="text-gray-600">{formatEventDateTime()}</div>
                  </div>
                </div>

                {/* 場所 */}
                {event.location?.name && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-800">場所</div>
                      <div className="text-gray-600">{event.location.name}</div>
                      {event.location.address && (
                        <div className="text-sm text-gray-500">{event.location.address}</div>
                      )}
                      {event.location.url && (
                        <a 
                          href={event.location.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          地図を開く →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* 作成者 */}
                <div className="flex items-start gap-3">
                  <UserIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">作成者</div>
                    <div className="text-gray-600">
                      {participants.find(p => p.user_id === event.created_by)?.profile?.nickname || '不明'}
                    </div>
                  </div>
                </div>

                {/* 作成日時 */}
                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">作成日</div>
                    <div className="text-gray-600">
                      {format(new Date(event.created_at), 'yyyy年M月d日 HH:mm', { locale: ja })}
                    </div>
                  </div>
                </div>

                {/* 参加者数制限 */}
                {event.max_participants && (
                  <div className="flex items-start gap-3">
                    <TagIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-800">参加者制限</div>
                      <div className="text-gray-600">最大 {event.max_participants}人</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 繰り返し設定 */}
            {event.recurrence_rule && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  繰り返し設定
                </h3>
                <div className="text-gray-700">
                  {event.recurrence_rule.type === 'daily' && 
                    `${event.recurrence_rule.interval}日毎に繰り返し`
                  }
                  {event.recurrence_rule.type === 'weekly' && 
                    `${event.recurrence_rule.interval}週毎に繰り返し`
                  }
                  {event.recurrence_rule.type === 'monthly' && 
                    `${event.recurrence_rule.interval}ヶ月毎に繰り返し`
                  }
                  {event.recurrence_rule.type === 'yearly' && 
                    `${event.recurrence_rule.interval}年毎に繰り返し`
                  }
                  
                  {event.recurrence_rule.endDate && (
                    <div className="text-sm text-gray-600 mt-1">
                      {format(new Date(event.recurrence_rule.endDate), 'yyyy年M月d日', { locale: ja })}まで
                    </div>
                  )}
                  
                  {event.recurrence_rule.occurrences && (
                    <div className="text-sm text-gray-600 mt-1">
                      {event.recurrence_rule.occurrences}回まで
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 右側: 参加者管理 */}
          <div className="lg:col-span-1">
            <ParticipationSection
              eventId={event.id}
              participants={participants}
              currentUserId={currentUserId}
              allowMaybe={event.allow_maybe}
              requireResponse={event.require_response}
              maxParticipants={event.max_participants}
              onParticipationChange={onParticipationChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}