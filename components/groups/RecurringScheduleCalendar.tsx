'use client'

import { useState } from 'react'
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
  getDaysInMonth,
  getDate
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ListBulletIcon, Bars3Icon } from '@heroicons/react/24/outline'
import type { RecurringSchedule } from '@/types/group'

interface RecurringScheduleCalendarProps {
  recurringSchedule?: RecurringSchedule
  themeColor: { primary: string; light: string; name: string }
}

type ViewMode = 'month' | 'week' | 'list'

interface ScheduleEvent {
  date: Date
  time?: string
  description?: string
}

export function RecurringScheduleCalendar({ recurringSchedule, themeColor }: RecurringScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  if (!recurringSchedule) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">定期スケジュールが設定されていません</p>
      </div>
    )
  }

  // 今月と来月の2ヶ月分のスケジュールを生成
  const generateScheduleEvents = (): ScheduleEvent[] => {
    const events: ScheduleEvent[] = []
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(addMonths(currentDate, 1))

    if (recurringSchedule.type === 'weekly' && recurringSchedule.dayOfWeek !== undefined) {
      // 週次スケジュール
      let currentCheckDate = startDate
      while (currentCheckDate <= endDate) {
        if (getDay(currentCheckDate) === recurringSchedule.dayOfWeek) {
          events.push({
            date: new Date(currentCheckDate),
            time: recurringSchedule.time,
            description: recurringSchedule.description
          })
        }
        currentCheckDate = new Date(currentCheckDate.getTime() + 24 * 60 * 60 * 1000)
      }
    } else if (recurringSchedule.type === 'monthly' && recurringSchedule.dayOfMonth) {
      // 月次スケジュール
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), recurringSchedule.dayOfMonth)
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, recurringSchedule.dayOfMonth)
      
      if (currentMonth >= startDate && currentMonth <= endDate) {
        events.push({
          date: currentMonth,
          time: recurringSchedule.time,
          description: recurringSchedule.description
        })
      }
      if (nextMonth >= startDate && nextMonth <= endDate) {
        events.push({
          date: nextMonth,
          time: recurringSchedule.time,
          description: recurringSchedule.description
        })
      }
    }

    return events
  }

  const scheduleEvents = generateScheduleEvents()

  const hasEventOnDate = (date: Date): boolean => {
    return scheduleEvents.some(event => isSameDay(event.date, date))
  }

  const getEventForDate = (date: Date): ScheduleEvent | undefined => {
    return scheduleEvents.find(event => isSameDay(event.date, date))
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const dateFormat = "d"
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
            const dayFormatted = format(day, dateFormat)
            const hasEvent = hasEventOnDate(day)
            const event = getEventForDate(day)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toString()}
                className={`min-h-[80px] p-2 border-r border-b border-gray-100 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } hover:bg-gray-50 transition-colors`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  !isCurrentMonth 
                    ? 'text-gray-400'
                    : isToday 
                      ? 'text-white bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center'
                      : dayIdx % 7 === 0 
                        ? 'text-red-600' 
                        : dayIdx % 7 === 6 
                          ? 'text-blue-600' 
                          : 'text-gray-700'
                }`}>
                  {dayFormatted}
                </div>
                {hasEvent && isCurrentMonth && (
                  <div 
                    className="text-xs p-1 rounded text-white truncate"
                    style={{ backgroundColor: themeColor.primary }}
                    title={`${event?.time || '時間未定'} ${event?.description || ''}`}
                  >
                    <div className="font-medium">
                      {recurringSchedule.type === 'weekly' ? '定期' : '月例'}
                    </div>
                    <div className="opacity-90">
                      {event?.time || '時間未定'}
                    </div>
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
    const sortedEvents = scheduleEvents
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">スケジュール一覧</h3>
          <p className="text-sm text-gray-600 mt-1">
            {format(currentDate, 'yyyy年M月', { locale: ja })} - {format(addMonths(currentDate, 1), 'yyyy年M月', { locale: ja })}
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {sortedEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              この期間にスケジュールはありません
            </div>
          ) : (
            sortedEvents.map((event, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: themeColor.primary }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {format(event.date, 'M月d日(E)', { locale: ja })}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {event.time || '時間未定'}
                      {event.description && ` - ${event.description}`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {recurringSchedule.type === 'weekly' ? '毎週' : '毎月'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-600" />
          <h4 className="font-medium text-gray-800">定期スケジュール</h4>
        </div>
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
      </div>

      {/* Schedule Summary */}
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

      {/* Calendar Content */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'list' && renderListView()}
    </div>
  )
}