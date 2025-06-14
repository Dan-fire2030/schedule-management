'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Group, THEME_COLOR_MAP, PRESET_EMOJIS } from '@/types/group'
import { GroupService } from '@/lib/supabase/groups'
import { RecurringScheduleCalendar } from './RecurringScheduleCalendar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import Image from 'next/image'

interface GroupSettingsSectionProps {
  group: Group
  onUpdate?: () => void
}

export function GroupSettingsSection({ group, onUpdate }: GroupSettingsSectionProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description || '',
    icon_type: group.icon_type || 'emoji',
    icon_emoji: group.icon_emoji || '👥',
    icon_image_url: group.icon_image_url || '',
    theme_color: group.theme_color || 'primary',
    recurring_schedule: group.recurring_schedule || null
  })

  const handleSave = async () => {
    try {
      const updates = {
        name: formData.name,
        description: formData.description,
        icon_type: formData.icon_type,
        icon_emoji: formData.icon_type === 'emoji' ? formData.icon_emoji : undefined,
        icon_image_url: formData.icon_type === 'image' ? formData.icon_image_url : undefined,
        theme_color: formData.theme_color,
        recurring_schedule: formData.recurring_schedule || undefined
      }
      
      const { success, error } = await GroupService.updateGroup(group.id, updates)
      
      if (success) {
        setIsEditing(false)
        onUpdate?.()
      } else {
        alert(`更新に失敗しました: ${error}`)
      }
    } catch (error) {
alert('更新に失敗しました')
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    
    try {
      setIsDeleting(true)
      const { success, error } = await GroupService.deleteGroup(group.id)
      
      if (success) {
        router.push('/groups')
      } else {
        alert(`グループの削除に失敗しました: ${error}`)
      }
    } catch (error) {
alert('グループの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">グループ設定</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium hover:bg-primary-200 transition-colors"
        >
          {isEditing ? 'キャンセル' : '編集'}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            グループ名
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-800">{group.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            説明
          </label>
          {isEditing ? (
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          ) : (
            <p className="text-gray-800">{group.description || '説明なし'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            アイコン
          </label>
          {isEditing ? (
            <div className="space-y-4">
              {/* アイコンタイプ選択 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, icon_type: 'emoji' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.icon_type === 'emoji'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  絵文字
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, icon_type: 'image' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.icon_type === 'image'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  画像
                </button>
              </div>
              
              {/* アイコン設定 */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl overflow-hidden">
                  {formData.icon_type === 'emoji' ? (
                    <span className="text-3xl">{formData.icon_emoji}</span>
                  ) : formData.icon_image_url ? (
                    <Image
                      src={formData.icon_image_url}
                      alt="Group icon"
                      width={64}
                      height={64}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">👥</span>
                  )}
                </div>
                
                {formData.icon_type === 'emoji' ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={formData.icon_emoji}
                      onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="絵文字を入力"
                    />
                    <div className="grid grid-cols-8 gap-2">
                      {PRESET_EMOJIS.slice(0, 16).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon_emoji: emoji })}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={formData.icon_image_url}
                    onChange={(e) => setFormData({ ...formData, icon_image_url: e.target.value })}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="画像URLを入力"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl overflow-hidden">
              {group.icon_type === 'emoji' && group.icon_emoji ? (
                <span className="text-3xl">{group.icon_emoji}</span>
              ) : group.icon_type === 'image' && group.icon_image_url ? (
                <Image
                  src={group.icon_image_url}
                  alt={group.name}
                  width={64}
                  height={64}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-3xl">👥</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            テーマカラー
          </label>
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(THEME_COLOR_MAP).map(([key, color]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, theme_color: key as any })}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    formData.theme_color === key
                      ? 'border-gray-800 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: color.primary }}
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">{color.name}</p>
                      <p className="text-xs text-gray-500">{color.primary}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-xl border-2 border-gray-200"
                style={{ backgroundColor: THEME_COLOR_MAP[group.theme_color]?.primary || '#f97316' }}
              />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {THEME_COLOR_MAP[group.theme_color]?.name || '不明'}
                </p>
                <p className="text-xs text-gray-500">
                  {THEME_COLOR_MAP[group.theme_color]?.primary || group.theme_color}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 定期スケジュール設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            定期スケジュール
          </label>
          {isEditing ? (
            <div className="space-y-4">
              {/* スケジュールタイプ選択 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    recurring_schedule: null 
                  })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !formData.recurring_schedule
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  なし
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    recurring_schedule: { 
                      type: 'weekly', 
                      dayOfWeek: 0, 
                      time: '', 
                      description: '' 
                    } 
                  })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.recurring_schedule?.type === 'weekly'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  毎週
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    recurring_schedule: { 
                      type: 'monthly', 
                      dayOfMonth: 1, 
                      time: '', 
                      description: '' 
                    } 
                  })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.recurring_schedule?.type === 'monthly'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  毎月
                </button>
              </div>

              {/* 週次設定 */}
              {formData.recurring_schedule?.type === 'weekly' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">曜日</label>
                    <div className="grid grid-cols-7 gap-2">
                      {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            recurring_schedule: {
                              ...formData.recurring_schedule!,
                              dayOfWeek: index
                            }
                          })}
                          className={`p-2 rounded text-sm font-medium transition-colors ${
                            formData.recurring_schedule?.dayOfWeek === index
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 月次設定 */}
              {formData.recurring_schedule?.type === 'monthly' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">日</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurring_schedule.dayOfMonth || 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurring_schedule: {
                        ...formData.recurring_schedule!,
                        dayOfMonth: parseInt(e.target.value)
                      }
                    })}
                    className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <span className="ml-2 text-sm text-gray-600">日</span>
                </div>
              )}

              {/* 時間・説明設定 */}
              {formData.recurring_schedule && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">時間（任意）</label>
                    <input
                      type="time"
                      value={formData.recurring_schedule.time || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurring_schedule: {
                          ...formData.recurring_schedule!,
                          time: e.target.value
                        }
                      })}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">説明（任意）</label>
                    <input
                      type="text"
                      value={formData.recurring_schedule.description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurring_schedule: {
                          ...formData.recurring_schedule!,
                          description: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="例：定期ミーティング"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3">
              {group.recurring_schedule ? (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: THEME_COLOR_MAP[group.theme_color]?.primary || '#f97316' }}
                  />
                  <div>
                    <div className="font-medium text-gray-800">
                      {group.recurring_schedule.type === 'weekly' && group.recurring_schedule.dayOfWeek !== undefined && 
                        `毎週${['日', '月', '火', '水', '木', '金', '土'][group.recurring_schedule.dayOfWeek]}曜日`
                      }
                      {group.recurring_schedule.type === 'monthly' && group.recurring_schedule.dayOfMonth &&
                        `毎月${group.recurring_schedule.dayOfMonth}日`
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      {group.recurring_schedule.time || '時間未定'}
                      {group.recurring_schedule.description && ` - ${group.recurring_schedule.description}`}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">定期スケジュールが設定されていません</p>
              )}
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-soft hover:shadow-md transition-all duration-300"
            >
              保存
            </button>
          </div>
        )}

        {/* 定期スケジュールカレンダー */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <RecurringScheduleCalendar 
            key={`calendar-${group.id}-${JSON.stringify(group.recurring_schedule)}`}
            recurringSchedule={group.recurring_schedule}
            themeColor={THEME_COLOR_MAP[group.theme_color] || THEME_COLOR_MAP.primary}
          />
        </div>

        {/* グループ削除セクション */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">危険な操作</h3>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 mb-4">
              グループを削除すると、すべてのメンバー、メッセージ、イベントが完全に削除されます。この操作は取り消すことができません。
            </p>
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? '削除中...' : 'グループを削除'}
            </button>
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="グループを削除しますか？"
        message={`「${group.name}」を削除すると、すべてのデータが完全に削除されます。この操作は取り消すことができません。`}
        confirmText="削除する"
        cancelText="キャンセル"
      />
    </div>
  )
}