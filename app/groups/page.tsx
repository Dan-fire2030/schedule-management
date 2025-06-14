'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ResponsiveContainer, ResponsiveGrid } from '@/components/ui/ResponsiveContainer'
import { GroupService } from '@/lib/supabase/groups'
import { THEME_COLOR_MAP } from '@/types/group'
import type { GroupSummary } from '@/types/group'
import { cn } from '@/lib/utils'
import { textStyles, backgrounds } from '@/lib/design-system/styles'
import { animations } from '@/lib/design-system/animations'

const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

export default function GroupsPage() {
  const { isAuthenticated, loading } = useAuthSimplified()
  const router = useRouter()
  const [groups, setGroups] = useState<GroupSummary[]>([])
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
    setGroupsLoading(true)
    setError('')

    try {
      const { groups: groupsData, error: groupsError } = await GroupService.getUserGroups()
      
      if (groupsError) {
        setError(groupsError)
      } else {
        setGroups(groupsData)
      }
    } catch (err) {
      setError('グループの取得に失敗しました')
    } finally {
      setGroupsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${backgrounds.magic} flex items-center justify-center`}>
        <LoadingSpinner message="読み込み中..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Sidebar>
      <ResponsiveContainer>
        <motion.div 
          className="space-y-6"
          {...animations.stagger}
        >
          {/* ヘッダー */}
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            {...animations.slideIn}
          >
            <div>
              <h1 className={`${textStyles.display['3']} ${textStyles.gradient} dark:text-white mb-2`}>
                グループ
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                参加中のグループ一覧
              </p>
            </div>
            
            <motion.div className="flex-shrink-0">
              <Button
                onClick={() => router.push('/groups/create')}
                variant="magic"
                icon={<PlusIcon />}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">新規作成</span>
                <span className="sm:hidden">グループ作成</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* エラー表示 */}
          {error && (
            <motion.div 
              className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200"
              {...animations.fadeIn}
            >
              {error}
            </motion.div>
          )}

          {/* ローディング */}
          {groupsLoading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* グループ一覧 */}
          {!groupsLoading && (
            <>
              {groups.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  {...animations.fadeIn}
                >
                  <motion.div 
                    className="text-6xl mb-4"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      transition: { 
                        duration: 2,
                        repeat: Infinity
                      }
                    }}
                  >
                    👥
                  </motion.div>
                  <h3 className={`${textStyles.heading['3']} text-gray-700 dark:text-gray-300 mb-2`}>
                    まだグループがありません
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    新しいグループを作成して、友達と一緒に予定を管理しましょう
                  </p>
                  <Button
                    onClick={() => router.push('/groups/create')}
                    variant="magic"
                    icon={<PlusIcon />}
                  >
                    最初のグループを作成
                  </Button>
                </motion.div>
              ) : (
                <ResponsiveGrid 
                  cols={{ sm: 1, md: 2, lg: 2, xl: 3 }}
                  gap={6}
                >
                  {groups.map((group, index) => {
                    const themeColor = THEME_COLOR_MAP[group.theme_color] || THEME_COLOR_MAP.primary
                    
                    return (
                      <motion.div
                        key={group.id}
                        {...animations.listItem}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link href={`/groups/${group.id}`}>
                          <Card 
                            hover 
                            className="cursor-pointer transition-all duration-300 hover:shadow-glow min-h-[120px] relative overflow-hidden"
                            style={{ borderTopColor: themeColor.primary, borderTopWidth: '4px' }}
                          >
                            <CardContent className="p-5 sm:p-6">
                              <div className="flex items-start gap-4">
                                {/* アイコン */}
                                <motion.div 
                                  className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md"
                                  style={{ backgroundColor: themeColor.primary }}
                                  whileHover={{ scale: 1.05, rotate: 3 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {group.icon_type === 'emoji' && group.icon_emoji ? (
                                    <span className="text-2xl sm:text-3xl">{group.icon_emoji}</span>
                                  ) : group.icon_type === 'image' && group.icon_image_url ? (
                                    <Image
                                      src={group.icon_image_url}
                                      alt={group.name}
                                      width={64}
                                      height={64}
                                      className="w-full h-full rounded-2xl object-cover"
                                    />
                                  ) : (
                                    <span className="text-2xl">👥</span>
                                  )}
                                </motion.div>

                                {/* グループ情報 */}
                                <div className="flex-1 min-w-0 space-y-2">
                                  {/* グループ名 - 改行を許可して完全表示 */}
                                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg leading-tight line-clamp-2">
                                    {group.name}
                                  </h3>
                                  
                                  {/* メンバー数とその他の情報 */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                      <UsersIcon />
                                      <span className="font-medium">{group.member_count || 0}人</span>
                                    </div>

                                    {/* 未読メッセージバッジ */}
                                    {group.unread_messages && group.unread_messages > 0 && (
                                      <motion.div 
                                        className="inline-flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full px-1.5"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                      >
                                        {group.unread_messages > 99 ? '99+' : group.unread_messages}
                                      </motion.div>
                                    )}
                                  </div>

                                  {/* 最終更新日 */}
                                  {group.last_activity && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      最終更新: {new Date(group.last_activity).toLocaleDateString('ja-JP', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* テーマカラーのアクセント */}
                              <div className="absolute top-0 right-0 w-8 h-8 opacity-10 rounded-bl-2xl"
                                   style={{ backgroundColor: themeColor.primary }}
                              />
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    )
                  })}
                </ResponsiveGrid>
              )}
            </>
          )}

          {/* フローティングアクションボタン（モバイル） */}
          <motion.div 
            className="fixed bottom-24 right-6 sm:hidden"
            {...animations.scaleIn}
          >
            <Button
              onClick={() => router.push('/groups/create')}
              variant="magic"
              size="lg"
              className="rounded-full w-14 h-14 p-0 shadow-glow"
            >
              <PlusIcon />
            </Button>
          </motion.div>
        </motion.div>
      </ResponsiveContainer>
    </Sidebar>
  )
}