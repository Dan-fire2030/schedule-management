'use client'

import { useState, useEffect } from 'react'
import { 
  addMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay,
  getDay,
  isToday
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon, 
  ListBulletIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { EventCard } from './EventCard'
import { EventDetailModal } from './EventDetailModal'
import { EventService } from '@/lib/supabase/events'
import type { Event, EventParticipant, ParticipationStatus, CalendarEvent } from '@/types/event'
import type { RecurringSchedule } from '@/types/group'
import { EVENT_TYPES } from '@/types/event'

interface EventCalendarProps {
  groupId: string
  events: Event[]
  recurringSchedule?: RecurringSchedule
  themeColor: { primary: string; light: string; name: string }
  onCreateEvent?: () => void
  onEditEvent?: (event: Event) => void
  onDeleteEvent?: (eventId: string) => void
  onParticipationChange?: (eventId: string, status: ParticipationStatus) => Promise<void>
  onEventSelect?: (event: Event) => void
  onRefresh?: () => void // イベント更新時のリフレッシュコールバック
  currentUserId: string
  loading?: boolean
}

type ViewMode = 'month' | 'list'

interface DayEvents {
  events: Event[]
  recurringEvent?: boolean
}

export function EventCalendar({ 
  groupId,
  events,
  recurringSchedule,
  themeColor,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onParticipationChange,
  onEventSelect,
  onRefresh,
  currentUserId,
  loading = false
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedEventParticipants, setSelectedEventParticipants] = useState<EventParticipant[]>([])
  const [showEventDetail, setShowEventDetail] = useState(false)

  // 日付別のイベント情報を生成
  const generateDayEvents = (): Map<string, DayEvents> => {
    const dayEventsMap = new Map<string, DayEvents>()
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(addMonths(currentDate, 1))

    // 既存イベントを追加
    events.forEach(event => {
      // start_timeフィールドを使用（実際のDBスキーマに合わせて）
      const startTime = event.start_time
      if (startTime) {
        const eventDate = format(new Date(startTime), 'yyyy-MM-dd')
        const existing = dayEventsMap.get(eventDate) || { events: [] }
        existing.events.push(event)
        dayEventsMap.set(eventDate, existing)
      }
    })

    // 定期スケジュールを追加
    if (recurringSchedule) {
      let currentCheckDate = startDate
      while (currentCheckDate <= endDate) {
        let shouldAddEvent = false
        
        if (recurringSchedule.type === 'weekly' && recurringSchedule.dayOfWeek !== undefined) {
          shouldAddEvent = getDay(currentCheckDate) === recurringSchedule.dayOfWeek
        } else if (recurringSchedule.type === 'monthly' && recurringSchedule.dayOfMonth) {
          shouldAddEvent = currentCheckDate.getDate() === recurringSchedule.dayOfMonth
        }

        if (shouldAddEvent) {
          const dateKey = format(currentCheckDate, 'yyyy-MM-dd')
          const existing = dayEventsMap.get(dateKey) || { events: [] }
          existing.recurringEvent = true
          dayEventsMap.set(dateKey, existing)
        }
        
        currentCheckDate = new Date(currentCheckDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }

    return dayEventsMap
  }

  const dayEventsMap = generateDayEvents()

  const handleEventClick = async (event: Event) => {
    setSelectedEvent(event)
    setShowEventDetail(true)
    onEventSelect?.(event)
    
    // 参加者データを取得
    try {
      const { participants, error } = await EventService.getEvent(event.id)
      if (error) {
setSelectedEventParticipants([])
      } else {
        setSelectedEventParticipants(participants || [])
      }
    } catch (error) {
setSelectedEventParticipants([])
    }
  }

  const handleParticipationChange = async (status: ParticipationStatus, message?: string) => {
    if (!selectedEvent || !onParticipationChange) return
    await onParticipationChange(selectedEvent.id, status)
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weekDays = ['日', '月', '火', '水', '木', '金', '土']

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, -1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-800">
            {format(currentDate, 'yyyy年M月', { locale: ja })}
          </h3>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day, index) => (
            <div key={day} className={`p-3 text-center text-sm font-medium ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, dayIdx) => {
            const dayFormatted = format(day, 'd')
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayEvents = dayEventsMap.get(dateKey)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isDayToday = isToday(day)

            return (
              <div
                key={day.toString()}
                className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } hover:bg-gray-50 transition-colors`}
              >
                {/* 日付 */}
                <div className={`text-sm font-medium mb-2 ${
                  !isCurrentMonth 
                    ? 'text-gray-400'
                    : isDayToday 
                      ? 'text-white bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center'
                      : dayIdx % 7 === 0 
                        ? 'text-red-600' 
                        : dayIdx % 7 === 6 
                          ? 'text-blue-600' 
                          : 'text-gray-700'
                }`}>
                  {dayFormatted}
                </div>

                {/* イベント */}
                {dayEvents && isCurrentMonth && (
                  <div className="space-y-1">
                    {/* 定期スケジュール */}
                    {dayEvents.recurringEvent && (
                      <div 
                        className="text-xs p-1 rounded text-white truncate cursor-pointer"
                        style={{ backgroundColor: themeColor.primary }}
                        title={`定期: ${recurringSchedule?.time || '時間未定'}`}
                      >
                        <div className="font-medium">定期</div>
                        <div className="opacity-90 text-xs">
                          {recurringSchedule?.time || '時間未定'}
                        </div>
                      </div>
                    )}

                    {/* 通常のイベント */}
                    {dayEvents.events.slice(0, 2).map((event) => {
                      const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || EVENT_TYPES.single
                      return (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="text-xs p-1 rounded text-white truncate cursor-pointer hover:shadow-sm transition-all"
                          style={{ backgroundColor: eventType.color }}
                          title={`${event.title} - ${event.start_time || '時間未定'}`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="opacity-90 text-xs">
                            {event.start_time ? format(new Date(event.start_time), 'HH:mm') : '時間未定'}
                          </div>
                        </div>
                      )
                    })}

                    {/* その他のイベント数 */}
                    {dayEvents.events.length > 2 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{dayEvents.events.length - 2}件
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderListView = () => {
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(addMonths(currentDate, 1))
    
    // 期間内のイベントをフィルタリングしてソート
    const filteredEvents = events
      .filter(event => {
        // start_timeフィールドを使用（実際のDBスキーマに合わせて）
        const startTime = event.start_time
        if (!startTime) return false
        
        const eventDate = new Date(startTime)
        const isInRange = eventDate >= startDate && eventDate <= endDate
        
        return isInRange
      })
      .sort((a, b) => {
        const aTime = a.start_time
        const bTime = b.start_time
        return new Date(aTime).getTime() - new Date(bTime).getTime()
      })
return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">イベント一覧</h3>
          <p className="text-sm text-gray-600 mt-1">
            {format(currentDate, 'yyyy年M月', { locale: ja })} - {format(addMonths(currentDate, 1), 'yyyy年M月', { locale: ja })}
          </p>
        </div>
        
        <div className="p-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">この期間にイベントはありません</p>
              {onCreateEvent && (
                <button
                  onClick={onCreateEvent}
                  className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  新しいイベントを作成
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showActions={true}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                  onParticipationChange={onParticipationChange}
                  className="cursor-pointer"
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-600" />
          <h4 className="font-medium text-gray-800">イベントカレンダー</h4>
        </div>
        
        <div className="flex items-center gap-3">
          {/* ビューモード切り替え */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              月表示
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ListBulletIcon className="w-4 h-4 inline mr-1" />
              一覧表示
            </button>
          </div>

          {/* 新規作成ボタン */}
          {onCreateEvent && (
            <button
              onClick={onCreateEvent}
              className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              新規作成
            </button>
          )}
        </div>
      </div>

      {/* 定期スケジュールサマリー */}
      {recurringSchedule && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: themeColor.primary }}
            />
            <div>
              <div className="font-medium text-gray-800">
                {recurringSchedule.type === 'weekly' && recurringSchedule.dayOfWeek !== undefined && 
                  `毎週${['日', '月', '火', '水', '木', '金', '土'][recurringSchedule.dayOfWeek]}曜日`
                }
                {recurringSchedule.type === 'monthly' && recurringSchedule.dayOfMonth &&
                  `毎月${recurringSchedule.dayOfMonth}日`
                }
              </div>
              <div className="text-sm text-gray-600">
                {recurringSchedule.time || '時間未定'}
                {recurringSchedule.description && ` - ${recurringSchedule.description}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* カレンダー表示 */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'list' && renderListView()}

      {/* イベント詳細モーダル */}
      <EventDetailModal
        event={selectedEvent}
        participants={selectedEventParticipants}
        isOpen={showEventDetail}
        onClose={() => {
          setShowEventDetail(false)
          setSelectedEvent(null)
          setSelectedEventParticipants([])
        }}
        onEdit={() => {
          if (selectedEvent && onEditEvent) {
            onEditEvent(selectedEvent)
            setShowEventDetail(false)
          }
        }}
        onDelete={() => {
          if (selectedEvent && onDeleteEvent) {
            onDeleteEvent(selectedEvent.id)
            setShowEventDetail(false)
          }
        }}
        onParticipationChange={handleParticipationChange}
        currentUserId={currentUserId}
        canEdit={selectedEvent?.created_by === currentUserId}
      />
    </div>
  )
}