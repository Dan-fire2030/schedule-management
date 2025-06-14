'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import type { CreateEventInput, EventType, EventPriority } from '@/types/event'
import { EVENT_TYPES, EVENT_PRIORITIES } from '@/types/event'

interface CreateEventFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventData: CreateEventInput) => Promise<void>
  onSuccess?: () => void // 成功時のコールバック
  groupId: string
  isLoading?: boolean
}

export function CreateEventForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onSuccess,
  groupId,
  isLoading = false 
}: CreateEventFormProps) {
  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    description: '',
    type: 'single',
    priority: 'medium',
    start_time: '', // Will be populated from form inputs
    end_time: '',
    is_all_day: false,
    max_participants: undefined,
    allow_maybe: true,
    require_response: false
  })
  
  // Helper state for form inputs
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Debug logging

// バリデーション
    if (!formData.title.trim()) {
alert('イベント名を入力してください')
      return
    }

    if (!startDate) {
alert('開始日を選択してください')
      return
    }

    // Create proper TIMESTAMPTZ values
let startDateTime: string
    try {
      if (formData.is_all_day) {
        startDateTime = new Date(startDate + 'T00:00:00').toISOString()
      } else {
        const timeValue = startTime || '00:00:00'
        startDateTime = new Date(startDate + 'T' + timeValue).toISOString()
      }
      
      // Validate the created timestamp
      if (startDateTime === 'Invalid Date' || !startDateTime) {
        throw new Error('Invalid start date/time combination')
      }
    } catch (error) {
alert('開始日時が正しくありません。日付と時刻を確認してください。')
      return
    }
    
    let endDateTime: string | undefined
    try {
      if (endDate || endTime) {
        const finalEndDate = endDate || startDate
        const finalEndTime = formData.is_all_day ? '23:59:59' : (endTime || startTime || '23:59:59')
        endDateTime = new Date(finalEndDate + 'T' + finalEndTime).toISOString()
        
        // Validate the created timestamp
        if (endDateTime === 'Invalid Date') {
          throw new Error('Invalid end date/time combination')
        }
      }
    } catch (error) {
alert('終了日時が正しくありません。日付と時刻を確認してください。')
      return
    }
// Additional validation for non-all-day events
    if (!formData.is_all_day && !startTime) {
      alert('開始時刻を入力してください')
      return
    }
    
    // 日時の整合性チェック
    if (endDateTime) {
      const startDate = new Date(startDateTime)
      const endDate = new Date(endDateTime)
      
      if (startDate >= endDate) {
        alert('開始日時は終了日時より前に設定してください')
        return
      }
    }

    // Create event data - prefer new format (timestamps) over legacy format
    const eventData = {
      ...formData,
      // New format (timestamps) - this should be the primary data
      start_time: startDateTime,
      end_time: endDateTime,
      // Remove legacy format - not needed if we have proper timestamps
      // Only add legacy fields if timestamp creation failed
    }
    
    // Validate that we have valid timestamps
    if (!eventData.start_time || eventData.start_time === 'Invalid Date') {
alert('開始日時の作成に失敗しました')
      return
    }

    try {
await onSubmit(eventData)
// 成功コールバックを実行（リスト更新など）
      if (onSuccess) {
        onSuccess()
      }
      
      // フォームをリセット
      setFormData({
        title: '',
        description: '',
        type: 'single',
        priority: 'medium',
        start_time: '', // Will be populated from form inputs
        end_time: '',
        is_all_day: false,
        max_participants: undefined,
        allow_maybe: true,
        require_response: false
      })
      setStartDate(format(new Date(), 'yyyy-MM-dd'))
      setStartTime('')
      setEndDate('')
      setEndTime('')
      setShowAdvanced(false)
      onClose()
    } catch (error) {
const errorMessage = error instanceof Error ? error.message : 'イベントの作成に失敗しました'
      alert(errorMessage)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">新しいイベントを作成</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            {/* イベント名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                イベント名 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例：チームミーティング"
                required
              />
            </div>

            {/* イベントタイプ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                イベントタイプ
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(EVENT_TYPES).map(([key, type]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: key as EventType })}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.type === key
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type.icon}</span>
                      <span className="font-medium">{type.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="イベントの詳細を入力..."
              />
            </div>
          </div>

          {/* 日時設定 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              日時設定
            </h3>

            {/* 終日フラグ */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="all-day"
                checked={formData.is_all_day}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    is_all_day: e.target.checked
                  })
                  if (e.target.checked) {
                    setStartTime('')
                    setEndTime('')
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="all-day" className="text-sm text-gray-700">
                終日イベント
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 開始日 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">開始日 *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* 終了日 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">終了日</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* 開始時刻 */}
              {!formData.is_all_day && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">開始時刻</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* 終了時刻 */}
              {!formData.is_all_day && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">終了時刻</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 詳細設定（折りたたみ） */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <TagIcon className="w-4 h-4" />
              詳細設定 {showAdvanced ? '▼' : '▶'}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-xl">
                {/* 優先度 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優先度
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(EVENT_PRIORITIES).map(([key, priority]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: key as EventPriority })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.priority === key
                            ? 'text-white'
                            : 'text-gray-600 bg-white hover:bg-gray-100'
                        }`}
                        style={formData.priority === key ? { backgroundColor: priority.color } : {}}
                      >
                        {priority.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 場所 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    場所
                  </label>
                  <input
                    type="text"
                    value={formData.location?.name || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      location: e.target.value ? { name: e.target.value } : undefined 
                    })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="例：会議室A、オンライン"
                  />
                </div>

                {/* 参加者設定 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大参加者数
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_participants || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        max_participants: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="制限なし"
                    />
                  </div>
                </div>

                {/* 参加オプション */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allow-maybe"
                      checked={formData.allow_maybe}
                      onChange={(e) => setFormData({ ...formData, allow_maybe: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="allow-maybe" className="text-sm text-gray-700">
                      「未定」での回答を許可
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="require-response"
                      checked={formData.require_response}
                      onChange={(e) => setFormData({ ...formData, require_response: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="require-response" className="text-sm text-gray-700">
                      回答を必須にする
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? '作成中...' : 'イベントを作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}