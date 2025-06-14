'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ReminderWithEvent } from '@/types/reminder'
import { useReminders } from '@/hooks/useReminders'
import { Bell, Trash2, Mail, Smartphone, AlertCircle } from 'lucide-react'

interface RemindersListProps {
  reminders: ReminderWithEvent[]
}

export function RemindersList({ reminders }: RemindersListProps) {
  const { removeReminder, loading } = useReminders()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (reminderId: string) => {
    setDeletingId(reminderId)
    const success = await removeReminder(reminderId)
    if (success) {
      // Success feedback handled by parent component
    }
    setDeletingId(null)
  }

  const formatReminderTime = (reminderTime: string) => {
    const date = new Date(reminderTime)
    const now = new Date()
    const diff = date.getTime() - now.getTime()

    if (diff < 0) {
      return '期限切れ'
    }

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}日後`
    } else if (hours > 0) {
      return `${hours}時間後`
    } else if (minutes > 0) {
      return `${minutes}分後`
    } else {
      return '間もなく'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'push':
        return <Smartphone className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'both':
        return (
          <div className="flex gap-1">
            <Smartphone className="w-3 h-3" />
            <Mail className="w-3 h-3" />
          </div>
        )
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  if (reminders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
          リマインダーがありません
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          イベントにリマインダーを設定して、大切な予定を忘れないようにしましょう。
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => {
        const isOverdue = new Date(reminder.reminder_time) < new Date()
        
        return (
          <Card
            key={reminder.id}
            className={`p-4 transition-all duration-200 ${
              isOverdue 
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' 
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isOverdue && (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                    {reminder.title}
                  </h4>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  イベント: {reminder.event_title}
                </p>
                
                {reminder.message && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {reminder.message}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    {getNotificationIcon(reminder.notification_type)}
                    <span>
                      {reminder.notification_type === 'push' && 'プッシュ通知'}
                      {reminder.notification_type === 'email' && 'メール通知'}
                      {reminder.notification_type === 'both' && 'プッシュ + メール'}
                    </span>
                  </div>
                  
                  <div className={`font-medium ${
                    isOverdue 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-primary-600 dark:text-primary-400'
                  }`}>
                    {formatReminderTime(reminder.reminder_time)}
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(reminder.id)}
                isLoading={deletingId === reminder.id}
                disabled={loading}
                className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}