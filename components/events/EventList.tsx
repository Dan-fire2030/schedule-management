'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { EventCard } from './EventCard'
import { CreateEventForm } from './CreateEventForm'
import type { Event, EventFilter, ParticipationStatus, EventType, EventPriority } from '@/types/event'
import { EVENT_TYPES, EVENT_PRIORITIES } from '@/types/event'

interface EventListProps {
  groupId: string
  events: Event[]
  loading?: boolean
  onCreateEvent: (eventData: any) => Promise<void>
  onEditEvent?: (event: Event) => void
  onDeleteEvent?: (eventId: string) => void
  onParticipationChange?: (eventId: string, status: ParticipationStatus) => void
  onRefresh?: () => void
  currentUserId?: string
}

export function EventList({
  groupId,
  events,
  loading = false,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onParticipationChange,
  onRefresh,
  currentUserId
}: EventListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState<EventFilter>({})
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events)

  // フィルタリング処理
  useEffect(() => {
    let filtered = [...events]

    // テキスト検索
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(search) ||
        (event.description && event.description.toLowerCase().includes(search)) ||
        (event.location?.name && event.location.name.toLowerCase().includes(search))
      )
    }

    // タイプフィルター
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(event => filters.type!.includes(event.type))
    }

    // 優先度フィルター
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(event => filters.priority!.includes(event.priority))
    }

    // ステータスフィルター
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(event => filters.status!.includes(event.status))
    }

    // 日付範囲フィルター
    if (filters.start_time_from) {
      filtered = filtered.filter(event => event.start_time >= filters.start_time_from!)
    }
    if (filters.start_time_to) {
      filtered = filtered.filter(event => event.start_time <= filters.start_time_to!)
    }

    setFilteredEvents(filtered)
  }, [events, searchText, filters])

  const handleCreateEvent = async (eventData: any) => {
    await onCreateEvent(eventData)
    setShowCreateForm(false)
    onRefresh?.()
  }

  const toggleFilter = (filterType: keyof EventFilter, value: any) => {
    setFilters(prev => {
      const current = prev[filterType] as any[] || []
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      
      return {
        ...prev,
        [filterType]: newValues.length > 0 ? newValues : undefined
      }
    })
  }

  const clearFilters = () => {
    setFilters({})
    setSearchText('')
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  if (loading) {
    return (
      <div className="space-y-4">
        {/* スケルトンローディング */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-800">イベント一覧</h2>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            {filteredEvents.length}件
          </span>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          新しいイベント
        </button>
      </div>

      {/* 検索・フィルター */}
      <div className="space-y-4">
        {/* 検索バー */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="イベントを検索..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors relative ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            フィルター
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* フィルターパネル */}
        {showFilters && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800">フィルター設定</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  すべてクリア
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* イベントタイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  イベントタイプ
                </label>
                <div className="space-y-2">
                  {Object.entries(EVENT_TYPES).map(([key, type]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.type?.includes(key as EventType) || false}
                        onChange={() => toggleFilter('type', key as EventType)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        {type.icon} {type.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 優先度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  優先度
                </label>
                <div className="space-y-2">
                  {Object.entries(EVENT_PRIORITIES).map(([key, priority]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.priority?.includes(key as EventPriority) || false}
                        onChange={() => toggleFilter('priority', key as EventPriority)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {priority.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ステータス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'published', name: '公開中' },
                    { key: 'draft', name: '下書き' },
                    { key: 'completed', name: '完了' },
                    { key: 'cancelled', name: 'キャンセル' }
                  ].map(({ key, name }) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(key as any) || false}
                        onChange={() => toggleFilter('status', key)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* イベント一覧 */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchText || activeFilterCount > 0 ? 'イベントが見つかりません' : 'まだイベントがありません'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchText || activeFilterCount > 0 
                ? '検索条件を変更してもう一度お試しください'
                : '最初のイベントを作成してみましょう'
              }
            </p>
            {!searchText && activeFilterCount === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
              >
                イベントを作成
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                showActions={true}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                onParticipationChange={onParticipationChange}
                currentUserParticipation={undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* イベント作成フォーム */}
      <CreateEventForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateEvent}
        groupId={groupId}
      />
    </div>
  )
}