'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { GroupService } from '@/lib/supabase/groups'
import { cn } from '@/lib/utils'
import type { CreateGroupInput, ThemeColor, IconType, RecurringSchedule } from '@/types/group'
import { PRESET_EMOJIS, THEME_COLOR_MAP } from '@/types/group'

interface CreateGroupFormProps {
  onSuccess?: (groupId: string) => void
  onCancel?: () => void
}

export function CreateGroupForm({ onSuccess, onCancel }: CreateGroupFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  const [formData, setFormData] = useState<CreateGroupInput>({
    name: '',
    description: '',
    icon_type: 'emoji',
    icon_emoji: '🎉',
    theme_color: 'primary'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('グループ名を入力してください')
      return
    }

    if (formData.icon_type === 'emoji' && !formData.icon_emoji) {
      setError('アイコンを選択してください')
      return
    }

    if (formData.icon_type === 'image' && !formData.icon_image_file) {
      setError('アイコン画像を選択してください')
      return
    }

    setLoading(true)
    setError('')

    try {
const { group, error: createError } = await GroupService.createGroup(formData)
      
      if (createError) {
setError(createError)
        return
      }
// 成功時の処理
      if (onSuccess) {
        onSuccess(group.id)
      } else {
        router.push(`/groups/${group.id}`)
      }
    } catch (err) {
const errorMessage = err instanceof Error ? err.message : 'グループの作成に失敗しました'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
// ファイルサイズチェック (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズは5MB以下にしてください')
        return
      }

      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setError('対応している画像形式: JPEG, PNG, GIF, WebP')
        return
      }

      setFormData(prev => ({ ...prev, icon_image_file: file }))
      setError('')
}
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">新しいグループを作成</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* グループ名 */}
          <div>
            <Input
              label="グループ名"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* 説明 */}
          <div>
            <Textarea
              label="説明（任意）"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* アイコン選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              アイコン
            </label>
            
            {/* アイコンタイプ選択 */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, icon_type: 'emoji' }))}
                className={cn(
                  "flex-1 p-3 rounded-lg border transition-colors",
                  formData.icon_type === 'emoji'
                    ? "border-primary-500 bg-primary-50 text-primary-600"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <span className="text-2xl mb-1 block">😊</span>
                <span className="text-sm">絵文字</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, icon_type: 'image' }))}
                className={cn(
                  "flex-1 p-3 rounded-lg border transition-colors",
                  formData.icon_type === 'image'
                    ? "border-primary-500 bg-primary-50 text-primary-600"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <span className="text-2xl mb-1 block">🖼️</span>
                <span className="text-sm">画像</span>
              </button>
            </div>

            {/* 絵文字選択 */}
            {formData.icon_type === 'emoji' && (
              <div className="grid grid-cols-10 gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon_emoji: emoji }))}
                    className={cn(
                      "p-2 text-2xl rounded-lg transition-all hover:scale-110",
                      formData.icon_emoji === emoji
                        ? "bg-primary-500 shadow-md"
                        : "hover:bg-white"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* 画像アップロード */}
            {formData.icon_type === 'image' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="icon-upload"
                />
                <label htmlFor="icon-upload" className="cursor-pointer">
                  {formData.icon_image_file ? (
                    <div>
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-sm text-gray-600">
                        {formData.icon_image_file.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        クリックして変更
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📁</div>
                      <p className="text-sm text-gray-600">
                        クリックして画像を選択
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG (最大5MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* テーマカラー選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              テーマカラー
            </label>
            
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(THEME_COLOR_MAP).map(([color, info]) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, theme_color: color as ThemeColor }))}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    formData.theme_color === color
                      ? "border-gray-800 shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  style={{ backgroundColor: info.light }}
                >
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: info.primary }}
                  />
                  <p className="text-xs font-medium text-gray-700">
                    {info.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 定期開催スケジュール */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              定期開催スケジュール（任意）
            </label>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, recurring_schedule: undefined }))}
                  className={cn(
                    "flex-1 p-2 text-sm rounded-lg border transition-colors",
                    !formData.recurring_schedule
                      ? "border-primary-500 bg-primary-50 text-primary-600"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  なし
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    recurring_schedule: { type: 'weekly', dayOfWeek: 0, time: '19:00' }
                  }))}
                  className={cn(
                    "flex-1 p-2 text-sm rounded-lg border transition-colors",
                    formData.recurring_schedule?.type === 'weekly'
                      ? "border-primary-500 bg-primary-50 text-primary-600"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  毎週
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    recurring_schedule: { type: 'monthly', dayOfMonth: 1, time: '19:00' }
                  }))}
                  className={cn(
                    "flex-1 p-2 text-sm rounded-lg border transition-colors",
                    formData.recurring_schedule?.type === 'monthly'
                      ? "border-primary-500 bg-primary-50 text-primary-600"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  毎月
                </button>
              </div>

              {/* 週次設定 */}
              {formData.recurring_schedule?.type === 'weekly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">曜日</label>
                    <select
                      value={formData.recurring_schedule.dayOfWeek}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurring_schedule: prev.recurring_schedule ? {
                          ...prev.recurring_schedule,
                          dayOfWeek: parseInt(e.target.value)
                        } : undefined
                      }))}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value={0}>日曜日</option>
                      <option value={1}>月曜日</option>
                      <option value={2}>火曜日</option>
                      <option value={3}>水曜日</option>
                      <option value={4}>木曜日</option>
                      <option value={5}>金曜日</option>
                      <option value={6}>土曜日</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">時間</label>
                    <input
                      type="time"
                      value={formData.recurring_schedule.time || '19:00'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurring_schedule: prev.recurring_schedule ? {
                          ...prev.recurring_schedule,
                          time: e.target.value
                        } : undefined
                      }))}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* 月次設定 */}
              {formData.recurring_schedule?.type === 'monthly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">日付</label>
                    <select
                      value={formData.recurring_schedule.dayOfMonth}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurring_schedule: prev.recurring_schedule ? {
                          ...prev.recurring_schedule,
                          dayOfMonth: parseInt(e.target.value)
                        } : undefined
                      }))}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                    >
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}日</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">時間</label>
                    <input
                      type="time"
                      value={formData.recurring_schedule.time || '19:00'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurring_schedule: prev.recurring_schedule ? {
                          ...prev.recurring_schedule,
                          time: e.target.value
                        } : undefined
                      }))}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* 説明 */}
              {formData.recurring_schedule && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">説明（任意）</label>
                  <input
                    type="text"
                    value={formData.recurring_schedule.description || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurring_schedule: prev.recurring_schedule ? {
                        ...prev.recurring_schedule,
                        description: e.target.value
                      } : undefined
                    }))}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="flex-1"
              >
                キャンセル
              </Button>
            )}
            
            <Button
              type="submit"
              variant="magic"
              isLoading={loading}
              className="flex-1"
            >
              {loading ? '作成中...' : 'グループを作成'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}