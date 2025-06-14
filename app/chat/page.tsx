'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { Sidebar } from '@/components/layout/Sidebar'
import ChatContainer from '@/components/chat/ChatContainer'
import { GroupService } from '@/lib/supabase/groups'
import type { GroupSummary } from '@/types/group'

export default function ChatPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, user } = useAuthSimplified()
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [authLoading, isAuthenticated, router])

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true)
const { groups: userGroups, error } = await GroupService.getUserGroups()
      
      if (error) {
setGroups([])
        return
      }
setGroups(userGroups || [])
      
      // 最初のグループを選択
      if (userGroups && userGroups.length > 0 && !selectedGroupId) {
setSelectedGroupId(userGroups[0].id)
      }
    } catch (error) {
setGroups([])
    } finally {
      setLoading(false)
    }
  }, [selectedGroupId])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadGroups()
    }
  }, [isAuthenticated, user, loadGroups])

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
                チャット
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                グループメンバーとコミュニケーション
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
                      {group.icon_emoji || '👥'} {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          {groups.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 rounded-2xl flex items-center justify-center text-6xl mx-auto mb-6">
                  💬
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  グループに参加してください
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  チャットを使用するには、まずグループに参加する必要があります
                </p>
                <button
                  onClick={() => router.push('/groups')}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                >
                  グループを探す
                </button>
              </div>
            </div>
          ) : selectedGroup ? (
            <div className="h-full">
              <ChatContainer
                groupId={selectedGroupId}
                groupName={selectedGroup.name}
                groupTheme={selectedGroup.theme_color || 'primary'}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">チャットを読み込み中...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </Sidebar>
  )
}