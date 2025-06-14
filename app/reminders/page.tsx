'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { useReminders } from '@/hooks/useReminders'
import { Bell, Settings, Plus, RefreshCw } from 'lucide-react'
import dynamic from 'next/dynamic'

// 重いコンポーネントを動的インポート
const RemindersList = dynamic(() => import('@/components/reminders/RemindersList').then(mod => ({ default: mod.RemindersList })), {
  loading: () => <div className="bg-white rounded-2xl p-6 shadow-sm h-64 animate-pulse" />,
  ssr: false
})

const NotificationSettings = dynamic(() => import('@/components/reminders/NotificationSettings').then(mod => ({ default: mod.NotificationSettings })), {
  loading: () => <div className="bg-white rounded-2xl p-6 shadow-sm h-96 animate-pulse" />,
  ssr: false
})

const CreateReminderForm = dynamic(() => import('@/components/reminders/CreateReminderForm').then(mod => ({ default: mod.CreateReminderForm })), {
  loading: () => <div className="bg-white rounded-2xl p-6 shadow-sm h-48 animate-pulse" />,
  ssr: false
})

export default function RemindersPage() {
  const { reminders, loading, loadReminders } = useReminders()
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleRefresh = () => {
    loadReminders()
  }

  const tabs = [
    { id: 'list' as const, label: 'リマインダー一覧', icon: Bell },
    { id: 'settings' as const, label: '通知設定', icon: Settings }
  ]

  return (
    <Sidebar>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              リマインダー管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              イベントのリマインダーと通知設定を管理
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </Button>
            
            {activeTab === 'list' && (
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                リマインダー作成
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'list' && (
            <div className="space-y-6">
              {showCreateForm && (
                <div className="relative">
                  <CreateReminderForm
                    eventId="temp-event-id" // This would be dynamic in real use
                    onSuccess={() => {
                      setShowCreateForm(false)
                      loadReminders()
                    }}
                    onCancel={() => setShowCreateForm(false)}
                  />
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    設定済みリマインダー
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {reminders.length}件
                  </span>
                </div>
                
                <RemindersList reminders={reminders} />
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <NotificationSettings />
          )}
        </div>
      </div>
    </Sidebar>
  )
}