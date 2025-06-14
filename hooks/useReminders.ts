'use client'

import { useState, useEffect } from 'react'
import { useAuthSimplified } from './useAuthSimplified'
import { 
  createReminder, 
  getUserReminders, 
  deleteReminder,
  getNotificationSettings,
  updateNotificationSettings
} from '@/lib/supabase/reminders'
import { 
  subscribeToPush, 
  unsubscribeFromPush, 
  requestNotificationPermission,
  showLocalNotification,
  isPushSupported,
  getNotificationPermission
} from '@/lib/notifications/push-notifications'
import { 
  Reminder, 
  CreateReminderRequest, 
  NotificationSettings, 
  ReminderWithEvent 
} from '@/types/reminder'

export function useReminders() {
  const { user } = useAuthSimplified()
  const [reminders, setReminders] = useState<ReminderWithEvent[]>([])
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load reminders
  const loadReminders = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const data = await getUserReminders(user.id)
      setReminders(data)
    } catch (err) {
      setError('リマインダーの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // Load notification settings
  const loadNotificationSettings = async () => {
    if (!user) return

    try {
      const settings = await getNotificationSettings(user.id)
      setNotificationSettings(settings)
    } catch (err) {
      // Silent error handling for notification settings
    }
  }

  // Create a new reminder
  const addReminder = async (data: CreateReminderRequest): Promise<boolean> => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const reminder = await createReminder(data, user.id)
      if (reminder) {
        await loadReminders()
        return true
      }
      return false
    } catch (err) {
      setError('リマインダーの作成に失敗しました')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Delete a reminder
  const removeReminder = async (reminderId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const success = await deleteReminder(reminderId)
      if (success) {
        await loadReminders()
        return true
      }
      return false
    } catch (err) {
      setError('リマインダーの削除に失敗しました')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Update notification settings
  const updateSettings = async (settings: Partial<NotificationSettings>): Promise<boolean> => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const updated = await updateNotificationSettings(user.id, settings)
      if (updated) {
        setNotificationSettings(updated)
        return true
      }
      return false
    } catch (err) {
      setError('通知設定の更新に失敗しました')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Enable push notifications
  const enablePushNotifications = async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setError('お使いのブラウザはプッシュ通知をサポートしていません')
      return false
    }

    try {
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        setError('プッシュ通知の許可が必要です')
        return false
      }

      const subscription = await subscribeToPush()
      if (!subscription) {
        setError('プッシュ通知の登録に失敗しました')
        return false
      }

      // Update settings to enable push notifications
      await updateSettings({ push_enabled: true })
      return true
    } catch (err) {
      setError('プッシュ通知の有効化に失敗しました')
      return false
    }
  }

  // Disable push notifications
  const disablePushNotifications = async (): Promise<boolean> => {
    try {
      await unsubscribeFromPush()
      await updateSettings({ push_enabled: false })
      return true
    } catch (err) {
      setError('プッシュ通知の無効化に失敗しました')
      return false
    }
  }

  // Show test notification
  const showTestNotification = async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setError('お使いのブラウザはプッシュ通知をサポートしていません')
      return false
    }

    const permission = getNotificationPermission()
    if (permission !== 'granted') {
      setError('プッシュ通知の許可が必要です')
      return false
    }

    try {
      await showLocalNotification({
        title: 'スケマネ テスト通知',
        body: 'プッシュ通知が正常に動作しています！',
        icon: '/icons/icon-192x192.png',
        tag: 'test-notification'
      })
      return true
    } catch (err) {
      setError('テスト通知の表示に失敗しました')
      return false
    }
  }

  // Check if push notifications are enabled
  const isPushEnabled = (): boolean => {
    return (
      isPushSupported() &&
      getNotificationPermission() === 'granted' &&
      (notificationSettings?.push_enabled ?? false)
    )
  }

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadReminders()
      loadNotificationSettings()
    }
  }, [user])

  return {
    reminders,
    notificationSettings,
    loading,
    error,
    addReminder,
    removeReminder,
    updateSettings,
    enablePushNotifications,
    disablePushNotifications,
    showTestNotification,
    isPushEnabled,
    loadReminders,
    loadNotificationSettings
  }
}