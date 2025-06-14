'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { Sidebar } from '@/components/layout/Sidebar'
import { EventCalendar } from '@/components/events/EventCalendar'
import { EventService } from '@/lib/supabase/events'
import { GroupService } from '@/lib/supabase/groups'
import type { Event } from '@/types/event'
import type { GroupSummary } from '@/types/group'
import { THEME_COLOR_MAP } from '@/types/group'

export default function CalendarPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, user } = useAuthSimplified()
  const [events, setEvents] = useState<Event[]>([])
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [authLoading, isAuthenticated, router])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // グループ一覧を取得
      const { groups: userGroups } = await GroupService.getUserGroups()
      setGroups(userGroups)
      
      // 最初のグループを選択
      if (userGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(userGroups[0].id)
      }
      
      // 選択されたグループのイベントを取得
      if (selectedGroupId) {
        const { events: groupEvents } = await EventService.getGroupEvents(selectedGroupId)
        setEvents(groupEvents || [])
      }
    } catch (error) {
      // Silent error handling for data loading
    } finally {
      setLoading(false)
    }
  }, [selectedGroupId])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData()
    }
  }, [isAuthenticated, user, loadData])

  const loadEvents = useCallback(async () => {
    if (!selectedGroupId) return
    
    try {
      const { events: groupEvents } = await EventService.getGroupEvents(selectedGroupId)
      setEvents(groupEvents || [])
    } catch (error) {
      // Silent error handling for event loading
    }
  }, [selectedGroupId])

  useEffect(() => {
    if (selectedGroupId) {
      loadEvents()
    }
  }, [selectedGroupId, loadEvents])

  const handleCreateEvent = () => {
    // Handle create event navigation
    router.push(`/groups/${selectedGroupId}?tab=events&action=create`)
  }

  const handleCreateEventWithData = async (eventData: any) => {
    if (!selectedGroupId) return
    
    try {
      await EventService.createEvent(selectedGroupId, eventData)
      await loadEvents()
    } catch (error) {
throw error
    }
  }

  const handleParticipationChange = async (eventId: string, status: any) => {
    // Participation change functionality to be implemented
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId)

  return (
    <Sidebar>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                カレンダー
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                全グループのスケジュールを管理
              </p>
            </div>
            
            {/* グループ選択 */}
            {groups.length > 0 && (
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  グループ:
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 rounded-2xl flex items-center justify-center text-6xl mx-auto mb-6">
                📅
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                グループに参加してください
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                カレンダーを使用するには、まずグループに参加する必要があります
              </p>
              <button
                onClick={() => router.push('/groups')}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
              >
                グループを探す
              </button>
            </div>
          ) : selectedGroup ? (
            <div className="max-w-7xl mx-auto">
              <EventCalendar
                groupId={selectedGroupId}
                events={events}
                themeColor={THEME_COLOR_MAP[selectedGroup.theme_color] || THEME_COLOR_MAP.primary}
                onCreateEvent={handleCreateEvent}
                onParticipationChange={handleParticipationChange}
                onRefresh={loadEvents}
                currentUserId={user?.id || ''}
                loading={false}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">カレンダーを読み込み中...</p>
            </div>
          )}
        </main>
      </div>
    </Sidebar>
  )
}