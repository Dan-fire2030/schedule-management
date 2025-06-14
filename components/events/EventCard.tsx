'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import type { Event, ParticipationStatus } from '@/types/event'
import { EVENT_TYPES, PARTICIPATION_STATUS, EVENT_PRIORITIES } from '@/types/event'

interface EventCardProps {
  event: Event
  showActions?: boolean
  onEdit?: (event: Event) => void
  onDelete?: (eventId: string) => void
  onParticipationChange?: (eventId: string, status: ParticipationStatus) => void
  currentUserParticipation?: ParticipationStatus
  onClick?: () => void
  className?: string
}

export function EventCard({ 
  event, 
  showActions = false,
  onEdit,
  onDelete,
  onParticipationChange,
  currentUserParticipation,
  onClick,
  className = ""
}: EventCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || EVENT_TYPES.single
  const priority = EVENT_PRIORITIES[event.priority] || EVENT_PRIORITIES.medium
  
  const formatEventDateTime = () => {
    const startDate = new Date(event.start_time)
    
    if (event.is_all_day) {
      return `${format(startDate, 'M月d日(E)', { locale: ja })} 終日`
    }
    
    let dateTimeString = format(startDate, 'M月d日(E) HH:mm', { locale: ja })
    
    if (event.end_time) {
      const endDate = new Date(event.end_time)
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
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{eventType.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800 line-clamp-1">{event.title}</h3>
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

        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(event)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    編集
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(event.id)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    削除
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 説明 */}
      {event.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* 日時・場所情報 */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>{formatEventDateTime()}</span>
        </div>
        
        {event.location?.name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4" />
            <span className="line-clamp-1">{event.location.name}</span>
          </div>
        )}
        
        {(event.attending_count !== undefined || event.participant_count !== undefined) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UsersIcon className="w-4 h-4" />
            <span>
              {event.attending_count !== undefined && event.participant_count !== undefined
                ? `${event.attending_count}/${event.participant_count}人参加`
                : `${event.participant_count || 0}人`
              }
              {event.max_participants && ` (最大${event.max_participants}人)`}
            </span>
          </div>
        )}
      </div>

      {/* 参加状況・アクション */}
      {onParticipationChange && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">参加状況:</span>
            <div className="flex gap-1">
              {(['attending', 'not_attending', 'pending'] as ParticipationStatus[]).map((status) => {
                const statusInfo = PARTICIPATION_STATUS[status]
                const isSelected = currentUserParticipation === status
                
                return (
                  <button
                    key={status}
                    onClick={() => onParticipationChange(event.id, status)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected 
                        ? 'text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    style={isSelected ? { backgroundColor: statusInfo.color } : {}}
                  >
                    {statusInfo.icon} {statusInfo.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 繰り返し情報 */}
      {event.recurrence_rule && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ClockIcon className="w-3 h-3" />
            <span>
              {event.recurrence_rule.type === 'daily' && `${event.recurrence_rule.interval}日毎`}
              {event.recurrence_rule.type === 'weekly' && `${event.recurrence_rule.interval}週毎`}
              {event.recurrence_rule.type === 'monthly' && `${event.recurrence_rule.interval}ヶ月毎`}
              {event.recurrence_rule.type === 'yearly' && `${event.recurrence_rule.interval}年毎`}
              に繰り返し
            </span>
          </div>
        </div>
      )}
    </div>
  )
}