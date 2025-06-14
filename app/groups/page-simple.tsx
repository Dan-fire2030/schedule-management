'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { Sidebar } from '@/components/layout/Sidebar'

export default function GroupsPageSimple() {
  const { isAuthenticated, loading } = useAuthSimplified()
  const router = useRouter()
  const [groups, setGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadGroups()
    }
  }, [isAuthenticated])

  const loadGroups = async () => {
    try {
setGroupsLoading(true)
      setError('')
      
      // モックデータでテスト
      setTimeout(() => {
        setGroups([])
        setGroupsLoading(false)
}, 1000)
      
    } catch (err) {
setError('グループの取得に失敗しました')
      setGroupsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Sidebar>
      <div className="space-y-6 p-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              グループ
            </h1>
            <p className="text-gray-600">
              参加中のグループ一覧
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={() => router.push('/groups/create')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <span className="hidden sm:inline">新規作成</span>
              <span className="sm:hidden">グループ作成</span>
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* ローディング */}
        {groupsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {/* グループ一覧 */}
        {!groupsLoading && (
          <>
            {groups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  まだグループがありません
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  新しいグループを作成して、友達と一緒に予定を管理しましょう
                </p>
                <button
                  onClick={() => router.push('/groups/create')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  最初のグループを作成
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groups.map((group, index) => (
                  <div
                    key={group.id || index}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* アイコン */}
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {group.icon_emoji || '👥'}
                        </div>

                        {/* グループ情報 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate mb-1">
                            {group.name}
                          </h3>
                          
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>{group.member_count || 0}人</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Sidebar>
  )
}