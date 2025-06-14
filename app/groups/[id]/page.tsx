'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { Sidebar } from '@/components/layout/Sidebar'
import { GroupService } from '@/lib/supabase/groups'
import { GroupInviteSection } from '@/components/groups/GroupInviteSection'
import { GroupMembersSection } from '@/components/groups/GroupMembersSection'
import { GroupSettingsSection } from '@/components/groups/GroupSettingsSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import dynamic from 'next/dynamic'

const EventList = dynamic(() => import('@/components/events/EventList').then(mod => ({ default: mod.EventList })), {
  loading: () => <div className="bg-white rounded-2xl p-6 shadow-sm h-32 animate-pulse" />,
  ssr: false
})

const EventCalendar = dynamic(() => import('@/components/events/EventCalendar').then(mod => ({ default: mod.EventCalendar })), {
  loading: () => <div className="bg-white rounded-2xl p-6 shadow-sm h-64 animate-pulse" />,
  ssr: false
})

import { EventService } from '@/lib/supabase/events'
import { THEME_COLOR_MAP } from '@/types/group'
import type { Group, GroupMember } from '@/types/group'
import type { Event } from '@/types/event'
import Image from 'next/image'

const ChatContainer = dynamic(() => import('@/components/chat/ChatContainer'), {
  loading: () => <div className="bg-white rounded-2xl p-6 shadow-sm h-96 animate-pulse" />,
  ssr: false
})

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, user } = useAuthSimplified()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'events' | 'invite' | 'chat' | 'settings'>('members')
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const groupId = params.id as string

  const loadGroupData = useCallback(async () => {
    try {
      setLoading(true)
const [groupResult, membersResult] = await Promise.all([
        GroupService.getGroup(groupId),
        GroupService.getGroupMembers(groupId)
      ])

if (groupResult.group && !groupResult.error) {
        setGroup(groupResult.group)
        setMembers(membersResult.members || [])
      } else {

// グループが見つからない場合はグループ一覧に戻る
        router.push('/groups')
      }
    } catch (error) {
// エラーが発生した場合もグループ一覧に戻る
      router.push('/groups')
    } finally {
      setLoading(false)
    }
  }, [groupId, router])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (groupId && user) {
      loadGroupData()
    }
  }, [groupId, user, loadGroupData])

  const loadEvents = useCallback(async () => {
    try {
      setEventsLoading(true)
      const { events: groupEvents } = await EventService.getGroupEvents(groupId)
      setEvents(groupEvents)
    } catch (error) {
} finally {
      setEventsLoading(false)
    }
  }, [groupId])

  const handleCreateEvent = async (eventData: any): Promise<void> => {
    try {
const result = await EventService.createEvent(groupId, eventData)
      
      if (result.error) {
throw new Error(result.error)
      }
await loadEvents()
    } catch (error) {
throw error
    }
  }

  const handleParticipationChange = async (eventId: string, status: any) => {
    try {
      await EventService.updateParticipation(eventId, status)
      await loadEvents()
    } catch (error) {
throw error
    }
  }

  // イベントタブが選択されたときにイベントを読み込む
  useEffect(() => {
    if (activeTab === 'events' && group && events.length === 0) {
      loadEvents()
    }
  }, [activeTab, group, events.length, loadEvents])

  const handleLeaveGroup = async () => {
    if (isLeaving) return
    
    try {
      setIsLeaving(true)
      const { success, error } = await GroupService.leaveGroup(groupId)
      
      if (success) {
        router.push('/groups')
      } else {
        alert(`グループからの退出に失敗しました: ${error}`)
      }
    } catch (error) {
alert('グループからの退出に失敗しました')
    } finally {
      setIsLeaving(false)
    }
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

  if (!isAuthenticated || !group) {
    return null
  }

  const currentMember = members.find(m => m.user_id === user?.id)
  const isCreator = currentMember?.role === 'creator'
  const themeColor = group.theme_color ? THEME_COLOR_MAP[group.theme_color] : THEME_COLOR_MAP.primary

  return (
    <Sidebar>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Group Header */}
        <div className="bg-white rounded-2xl shadow-soft p-6" style={{ borderTopColor: themeColor.primary, borderTopWidth: '4px' }}>
          <div className="flex items-center gap-4">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-inner"
              style={{ backgroundColor: themeColor.light }}
            >
              {group.icon_type === 'emoji' && group.icon_emoji ? (
                <span className="text-5xl">{group.icon_emoji}</span>
              ) : group.icon_type === 'image' && group.icon_image_url ? (
                <Image
                  src={group.icon_image_url}
                  alt={group.name}
                  width={80}
                  height={80}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-5xl">👥</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">{group.name}</h1>
              <p className="text-gray-600 mt-1">{group.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">
                  メンバー: {members.length}人
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">テーマ:</span>
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: themeColor.primary }}
                    />
                    <span className="text-sm text-gray-600">{themeColor.name}</span>
                  </div>
                </div>
                {group.recurring_schedule && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">定期開催:</span>
                    <span className="text-sm text-gray-600">
                      {group.recurring_schedule.type === 'weekly' && `毎週${['日', '月', '火', '水', '木', '金', '土'][group.recurring_schedule.dayOfWeek || 0]}曜日`}
                      {group.recurring_schedule.type === 'monthly' && `毎月${group.recurring_schedule.dayOfMonth}日`}
                      {group.recurring_schedule.time && ` ${group.recurring_schedule.time}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* メンバー用の退出ボタン */}
            {!isCreator && (
              <div className="flex items-start">
                <button
                  onClick={() => setShowLeaveDialog(true)}
                  disabled={isLeaving}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLeaving ? '退出中...' : 'グループから退出'}
                </button>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              メンバー
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'events'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              イベント
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'invite'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              招待
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              チャット
            </button>
            {isCreator && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                設定
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'chat' ? (
          <div className="bg-white rounded-2xl shadow-soft h-[calc(100vh-300px)]">
            <ChatContainer groupId={groupId} />
          </div>
        ) : (
          <div className="animate-in">
            {activeTab === 'members' && (
              <GroupMembersSection 
                members={members} 
                currentUserId={user?.id || ''} 
                isAdmin={isCreator}
                onMembersUpdate={loadGroupData}
              />
            )}
            {activeTab === 'events' && (
              <div className="space-y-6">
                <EventCalendar
                  groupId={groupId}
                  events={events}
                  recurringSchedule={group.recurring_schedule}
                  themeColor={themeColor}
                  currentUserId={user?.id || ''}
                  loading={eventsLoading}
                />
                <EventList
                  groupId={groupId}
                  events={events}
                  loading={eventsLoading}
                  onCreateEvent={handleCreateEvent}
                  onParticipationChange={handleParticipationChange}
                  onRefresh={loadEvents}
                  currentUserId={user?.id}
                />
              </div>
            )}
            {activeTab === 'invite' && (
              <GroupInviteSection 
                groupId={groupId} 
                groupName={group.name}
                onInviteSent={loadGroupData}
              />
            )}
            {activeTab === 'settings' && isCreator && (
              <GroupSettingsSection 
                group={group}
                onUpdate={loadGroupData}
              />
            )}
          </div>
        )}
      </div>

      {/* 退出確認ダイアログ */}
      <ConfirmDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={handleLeaveGroup}
        title="グループから退出しますか？"
        message={`「${group?.name}」から退出します。再度参加するには招待が必要になります。`}
        confirmText="退出する"
        cancelText="キャンセル"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </Sidebar>
  )
}