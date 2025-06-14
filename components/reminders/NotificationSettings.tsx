'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { NotificationSettings as NotificationSettingsType } from '@/types/reminder'
import { useReminders } from '@/hooks/useReminders'
import {
  isPushSupported,
  requestNotificationPermission,
  getNotificationPermission,
  showLocalNotification,
  subscribeToPush,
  saveSubscriptionToServer
} from '@/lib/notifications/push-notifications'
import { getReminderScheduler } from '@/lib/notifications/reminder-scheduler'
import { 
  Bell, 
  Smartphone, 
  Mail, 
  Volume2, 
  Vibrate, 
  Moon, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

export function NotificationSettings() {
  const { 
    notificationSettings, 
    updateSettings,
    loading 
  } = useReminders()
  
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')
  
  const [settings, setSettings] = useState<Partial<NotificationSettingsType>>({
    push_enabled: false,
    email_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  })

  // Initialize push notification state
  useEffect(() => {
    const supported = isPushSupported()
    setPushSupported(supported)
    
    if (supported) {
      const permission = getNotificationPermission()
      setPermissionStatus(permission)
      setPushEnabled(permission === 'granted')
    }
  }, [])

  // Update local state when notification settings change
  useEffect(() => {
    if (notificationSettings) {
      setSettings({
        push_enabled: notificationSettings.push_enabled,
        email_enabled: notificationSettings.email_enabled,
        sound_enabled: notificationSettings.sound_enabled,
        vibration_enabled: notificationSettings.vibration_enabled,
        quiet_hours_start: notificationSettings.quiet_hours_start || '22:00',
        quiet_hours_end: notificationSettings.quiet_hours_end || '08:00'
      })
    }
  }, [notificationSettings])

  const handleToggle = async (key: keyof NotificationSettingsType, value: boolean) => {
    // Special handling for push notifications
    if (key === 'push_enabled') {
      if (value) {
        const success = await enablePushNotifications()
        if (success) {
          setPushEnabled(true)
          setPermissionStatus('granted')
        }
      } else {
        await disablePushNotifications()
        setPushEnabled(false)
      }
    } else {
      setSettings(prev => ({ ...prev, [key]: value }))
      await updateSettings({ [key]: value })
    }
  }

  const enablePushNotifications = async (): Promise<boolean> => {
    try {
      if (!pushSupported) {
        alert('お使いのブラウザはプッシュ通知をサポートしていません')
        return false
      }

      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        alert('通知の許可が必要です。ブラウザの設定で通知を許可してください。')
        return false
      }

      // Push subscription
      const subscription = await subscribeToPush()
      if (!subscription) {
        alert('プッシュ通知の登録に失敗しました')
        return false
      }

      // Save to server
      const saved = await saveSubscriptionToServer(subscription)
      if (!saved) {
        alert('サーバーへの登録に失敗しました')
        return false
      }

      // Update settings
      await updateSettings({ push_enabled: true })
      
      // Initialize reminder scheduler
      const scheduler = getReminderScheduler()
      // Load user reminders (we'd need user ID here)
      
      return true
    } catch (error) {
      alert('プッシュ通知の有効化に失敗しました')
      return false
    }
  }

  const disablePushNotifications = async () => {
    try {
      await updateSettings({ push_enabled: false })
      // Note: We don't unsubscribe from the server here to allow re-enabling
    } catch (error) {
      // Silent error handling for disabling push notifications
    }
  }

  const handleTimeChange = async (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    await updateSettings({ [key]: value })
  }

  const handleTestNotification = async () => {
    try {
      if (!pushEnabled) {
        alert('プッシュ通知を有効にしてください')
        return
      }

      await showLocalNotification({
        title: '📅 テスト通知',
        body: 'スケマネの通知設定が正常に動作しています！',
        icon: '/icons/icon-192x192.png',
        tag: 'test-notification'
      })

      // Show success message
      setTimeout(() => {
        alert('テスト通知を送信しました！通知が表示されているかご確認ください。')
      }, 500)
    } catch (error) {
      alert('テスト通知の送信に失敗しました')
    }
  }

  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    disabled = false 
  }: { 
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean 
  }) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
        ${checked 
          ? 'bg-primary-500 dark:bg-primary-600' 
          : 'bg-gray-200 dark:bg-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            通知設定
          </h3>
        </div>

        <div className="space-y-6">
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                  プッシュ通知
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ブラウザ通知でリマインダーを受け取る
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!pushSupported ? (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              ) : pushEnabled ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <ToggleSwitch
                checked={pushEnabled}
                onChange={(checked) => handleToggle('push_enabled', checked)}
                disabled={loading || !pushSupported}
              />
            </div>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                  メール通知
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  メールでリマインダーを受け取る
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.email_enabled ?? true}
              onChange={(checked) => handleToggle('email_enabled', checked)}
              disabled={loading}
            />
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                  通知音
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  通知時に音を鳴らす
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.sound_enabled ?? true}
              onChange={(checked) => handleToggle('sound_enabled', checked)}
              disabled={loading}
            />
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                  バイブレーション
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  通知時にバイブレーションを行う
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.vibration_enabled ?? true}
              onChange={(checked) => handleToggle('vibration_enabled', checked)}
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Moon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            サイレント時間
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            指定した時間帯は通知を無効にします
          </p>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                開始時刻
              </label>
              <Input
                type="time"
                value={settings.quiet_hours_start || '22:00'}
                onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                終了時刻
              </label>
              <Input
                type="time"
                value={settings.quiet_hours_end || '08:00'}
                onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Test Notification */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TestTube className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            テスト通知
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          通知設定が正しく動作するかテストできます
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={handleTestNotification}
            variant="outline"
            disabled={!pushEnabled || loading}
            className="w-full md:w-auto"
          >
            <TestTube className="w-4 h-4 mr-2" />
            テスト通知を送信
          </Button>
          
          {!pushSupported && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">ブラウザ非対応</h4>
                  <p className="text-sm text-yellow-700">お使いのブラウザはプッシュ通知をサポートしていません</p>
                </div>
              </div>
            </div>
          )}
          
          {pushSupported && !pushEnabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">通知を許可してください</h4>
                  <p className="text-sm text-blue-700">リマインダー機能を使用するには、ブラウザの通知設定を許可してください</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}