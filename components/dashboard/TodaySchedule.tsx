'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { textStyles, spacing } from '@/lib/design-system/styles'
import { animations } from '@/lib/design-system/animations'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { EventService } from '@/lib/supabase/events'
import { GroupService } from '@/lib/supabase/groups'
import type { Event } from '@/types/event'
import { format, isToday, startOfDay, endOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'

// Color mapping for better performance
const colorClasses = {
  primary: 'text-primary-600 border-primary-400',
  secondary: 'text-secondary-600 border-secondary-400', 
  accent: 'text-accent-600 border-accent-400'
}

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

export function TodaySchedule() {
  const router = useRouter()
  const { user } = useAuthSimplified()
  const [currentTime, setCurrentTime] = React.useState<string>('')
  const [hasError, setHasError] = React.useState(false)
  const [todayEvents, setTodayEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [groups, setGroups] = React.useState<any[]>([])
  
  // 今日のイベントを取得
  React.useEffect(() => {
    async function loadTodayEvents() {
      if (!user) return

      try {
        setLoading(true)

        // ユーザーのグループを取得
        const { groups: userGroups } = await GroupService.getUserGroups()
        setGroups(userGroups || [])

        // 各グループの今日のイベントを取得
        const today = new Date()
        const startTime = format(startOfDay(today), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        const endTime = format(endOfDay(today), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')

        const allTodayEvents: Event[] = []

        for (const group of userGroups || []) {
          try {
            const { events } = await EventService.getGroupEvents(group.id, {
              start_time_from: startTime,
              start_time_to: endTime
            })
            allTodayEvents.push(...events)
          } catch (error) {
            // Ignore individual group event fetch errors
          }
        }

        // 時間順にソート
        const sortedEvents = allTodayEvents.sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )

        setTodayEvents(sortedEvents)

      } catch (error) {
        setHasError(true)
      } finally {
        setLoading(false)
      }
    }

    loadTodayEvents()
  }, [user])
  
  React.useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }))
    
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }))
    }, 60000) // Update every minute
    
    return () => clearInterval(timer)
  }, [])

  if (hasError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
        <p className="text-gray-600">ダッシュボードの読み込みに失敗しました。</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          再読み込み
        </button>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      {...animations.stagger}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        {...animations.slideIn}
      >
        <div>
          <h1 className={`${textStyles.display['3']} ${textStyles.gradient} dark:text-white`}>
            今日の予定
          </h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-400 mt-1"
            {...animations.fadeIn}
          >
            {currentTime ? new Date().toLocaleDateString('ja-JP', { 
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            }) : ''}
          </motion.p>
        </div>
        <motion.div 
          className="text-right"
          {...animations.scaleIn}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">現在時刻</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{currentTime || '--:--'}</p>
        </motion.div>
      </motion.div>

      {/* Welcome Card */}
      <motion.div
        {...animations.listItem}
      >
        <Card variant="glow" className="bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20">
          <CardContent className="text-center py-8">
            <motion.div 
              className="inline-block mb-4"
              animate={{ 
                y: [0, -10, 0],
                transition: { 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <div className="text-6xl">🧞‍♂️</div>
            </motion.div>
            <h2 className={`${textStyles.heading['2']} text-primary-700 dark:text-primary-300 mb-2`}>
              魔法のような一日を！
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {loading ? '予定を読み込み中...' : `今日は${todayEvents.length}件の予定があります`}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Schedule List */}
      <div className="space-y-4">
        {loading ? (
          // ローディング表示
          [...Array(3)].map((_, index) => (
            <Card key={index} variant="default" className="overflow-hidden">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : todayEvents.length === 0 ? (
          // 予定がない場合
          <Card variant="default" className="overflow-hidden">
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                今日の予定はありません
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                ゆっくりとした一日をお過ごしください
              </p>
              <Button
                onClick={() => router.push('/calendar')}
                variant="magic"
                size="sm"
              >
                カレンダーを見る
              </Button>
            </CardContent>
          </Card>
        ) : (
          // 実際のイベント表示
          todayEvents.map((event, index) => {
            const group = groups.find(g => g.id === event.group_id)
            const eventTime = format(new Date(event.start_time), 'HH:mm', { locale: ja })
            const eventEndTime = event.end_time ? format(new Date(event.end_time), 'HH:mm', { locale: ja }) : null
            
            return (
              <motion.div
                key={event.id}
                {...animations.listItem}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="default" className="overflow-hidden">
                  <div className="flex">
                    {/* Time indicator */}
                    <div className="w-2 bg-primary-500 dark:bg-primary-400" />
                    
                    <CardContent className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                              {eventTime}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                              {event.title}
                            </h3>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <ClockIcon />
                              <span>
                                {eventEndTime ? `${eventTime} - ${eventEndTime}` : eventTime}
                              </span>
                            </div>
                            {event.location?.name && (
                              <div className="flex items-center gap-1">
                                <LocationIcon />
                                <span>{event.location.name}</span>
                              </div>
                            )}
                          </div>
                          
                          {group && (
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm">
                              {group.icon_emoji && <span className="mr-2">{group.icon_emoji}</span>}
                              {group.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="flex flex-wrap gap-4 justify-center"
        {...animations.slideIn}
      >
        <Button 
          variant="magic"
          onClick={() => router.push('/calendar')}
          className="flex-1 max-w-xs"
        >
          📅 カレンダーを見る
        </Button>
        <Button 
          variant="secondary"
          onClick={() => router.push('/groups')}
          className="flex-1 max-w-xs"
        >
          👥 グループを見る
        </Button>
      </motion.div>
    </motion.div>
  )
}