'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function TodayScheduleSimple() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = React.useState('')

  React.useEffect(() => {
    try {
const now = new Date()
      setCurrentTime(now.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }))
      
      const timer = setInterval(() => {
        const now = new Date()
        setCurrentTime(now.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }))
      }, 60000)
      
      return () => clearInterval(timer)
    } catch (error) {
}
  }, [])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            今日の予定
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('ja-JP', { 
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">現在時刻</p>
          <p className="text-2xl font-bold text-blue-600">{currentTime || '--:--'}</p>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🧞‍♂️</div>
        <h2 className="text-2xl font-bold text-blue-700 mb-2">
          魔法のような一日を！
        </h2>
        <p className="text-gray-600">
          今日は0件の予定があります
        </p>
      </div>

      {/* Empty state */}
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✨</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          今日の予定はありません
        </h3>
        <p className="text-gray-500 mb-6">
          新しい予定を作成して、魔法のような一日を始めましょう
        </p>
        <button 
          onClick={() => router.push('/groups')}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          予定を作成
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/groups/create')}
          className="p-6 bg-blue-500 text-white rounded-xl flex flex-col items-center gap-2 hover:bg-blue-600 transition-colors"
        >
          <div className="text-2xl">👥</div>
          <span>グループ作成</span>
        </button>
        
        <button
          onClick={() => router.push('/groups')}
          className="p-6 bg-purple-500 text-white rounded-xl flex flex-col items-center gap-2 hover:bg-purple-600 transition-colors"
        >
          <div className="text-2xl">📅</div>
          <span>予定作成</span>
        </button>
      </div>
    </div>
  )
}