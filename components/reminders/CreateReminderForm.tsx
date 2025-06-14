'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { CreateReminderRequest, ReminderTiming } from '@/types/reminder'
import { useReminders } from '@/hooks/useReminders'

interface CreateReminderFormProps {
  eventId: string
  onSuccess?: () => void
  onCancel?: () => void
}

const TIMING_OPTIONS: { value: ReminderTiming; label: string; description: string }[] = [
  { value: 'immediate', label: '今すぐ', description: '即座に通知' },
  { value: '5min', label: '5分前', description: '5分前に通知' },
  { value: '15min', label: '15分前', description: '15分前に通知' },
  { value: '30min', label: '30分前', description: '30分前に通知' },
  { value: '1hour', label: '1時間前', description: '1時間前に通知' },
  { value: '2hour', label: '2時間前', description: '2時間前に通知' },
  { value: '1day', label: '1日前', description: '1日前に通知' },
  { value: '1week', label: '1週間前', description: '1週間前に通知' },
  { value: 'custom', label: 'カスタム', description: '任意の時間を指定' }
]

export function CreateReminderForm({ 
  eventId, 
  onSuccess, 
  onCancel 
}: CreateReminderFormProps) {
  const { addReminder, loading } = useReminders()
  const [formData, setFormData] = useState<CreateReminderRequest>({
    event_id: eventId,
    title: '',
    message: '',
    timing: '30min',
    notification_type: 'push'
  })
  const [customMinutes, setCustomMinutes] = useState<number>(60)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const requestData: CreateReminderRequest = {
      ...formData,
      custom_minutes: formData.timing === 'custom' ? customMinutes : undefined
    }

    const success = await addReminder(requestData)
    if (success) {
      onSuccess?.()
      // Reset form
      setFormData({
        event_id: eventId,
        title: '',
        message: '',
        timing: '30min',
        notification_type: 'push'
      })
    }
  }

  const handleInputChange = (field: keyof CreateReminderRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        リマインダーを作成
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            タイトル *
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="リマインダーのタイトル"
            required
            className="w-full"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            メッセージ
          </label>
          <Textarea
            value={formData.message || ''}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="追加のメッセージ（任意）"
            rows={3}
            className="w-full"
          />
        </div>

        {/* Timing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            通知タイミング
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TIMING_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`
                  flex flex-col p-3 border rounded-lg cursor-pointer transition-all duration-200
                  ${formData.timing === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500'
                  }
                `}
              >
                <input
                  type="radio"
                  name="timing"
                  value={option.value}
                  checked={formData.timing === option.value}
                  onChange={(e) => handleInputChange('timing', e.target.value as ReminderTiming)}
                  className="sr-only"
                />
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                  {option.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {option.description}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom timing input */}
        {formData.timing === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              カスタム時間（分）
            </label>
            <Input
              type="number"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 0)}
              min="1"
              max="43200"
              placeholder="分数を入力"
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              1分〜30日（43200分）まで設定可能
            </p>
          </div>
        )}

        {/* Notification type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            通知方法
          </label>
          <div className="flex gap-2">
            <label className={`
              flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200
              ${formData.notification_type === 'push'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500'
              }
            `}>
              <input
                type="radio"
                name="notification_type"
                value="push"
                checked={formData.notification_type === 'push'}
                onChange={(e) => handleInputChange('notification_type', e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                プッシュ通知
              </span>
            </label>
            
            <label className={`
              flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200
              ${formData.notification_type === 'email'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500'
              }
            `}>
              <input
                type="radio"
                name="notification_type"
                value="email"
                checked={formData.notification_type === 'email'}
                onChange={(e) => handleInputChange('notification_type', e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                メール
              </span>
            </label>
            
            <label className={`
              flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200
              ${formData.notification_type === 'both'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500'
              }
            `}>
              <input
                type="radio"
                name="notification_type"
                value="both"
                checked={formData.notification_type === 'both'}
                onChange={(e) => handleInputChange('notification_type', e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                両方
              </span>
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={!formData.title.trim()}
            className="flex-1"
          >
            リマインダーを作成
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              キャンセル
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}