// グループ関連の型定義

export type ThemeColor = 'primary' | 'secondary' | 'accent' | 'sand' | 'mystic'

export type IconType = 'emoji' | 'image'

export type GroupRole = 'creator' | 'admin' | 'member'

export type InvitationType = 'link' | 'qr' | 'username'

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

// 定期開催スケジュールの型
export interface RecurringSchedule {
  type: 'weekly' | 'monthly' | 'custom'
  dayOfWeek?: number // 0-6 (Sunday-Saturday)
  dayOfMonth?: number // 1-31
  time?: string // HH:mm format
  description?: string
}

// グループの基本情報
export interface Group {
  id: string
  name: string
  description?: string
  icon_type: IconType
  icon_emoji?: string
  icon_image_url?: string
  theme_color: ThemeColor
  invite_code: string
  member_count: number
  recurring_schedule?: RecurringSchedule
  created_by: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

// グループ作成時の入力データ
export interface CreateGroupInput {
  name: string
  description?: string
  icon_type: IconType
  icon_emoji?: string
  icon_image_file?: File
  theme_color: ThemeColor
  recurring_schedule?: RecurringSchedule
}

// グループメンバー
export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: GroupRole
  joined_at: string
  profile?: {
    username: string
    nickname: string
    avatar_url?: string
  }
}

// グループ招待
export interface GroupInvitation {
  id: string
  group_id: string
  invited_by: string
  invited_user_id?: string
  invite_type: InvitationType
  status: InvitationStatus
  expires_at?: string
  created_at: string
  responded_at?: string
  group?: Pick<Group, 'name' | 'icon_type' | 'icon_emoji' | 'icon_image_url' | 'theme_color'>
  inviter?: {
    nickname: string
    username: string
    avatar_url?: string
  }
}

// グループ一覧表示用の簡略化された型
export interface GroupSummary {
  id: string
  name: string
  icon_type: IconType
  icon_emoji?: string
  icon_image_url?: string
  theme_color: ThemeColor
  member_count: number
  last_activity?: string
  unread_messages?: number
}

// グループ設定
export interface GroupSettings {
  allow_member_invite: boolean
  allow_member_edit: boolean
  message_retention_days: number
  notification_enabled: boolean
}

// プリセット絵文字
export const PRESET_EMOJIS = [
  '🎉', '❤️', '👍', '👏', '🔥', '⭐', '🌈', '✨', '☀️', '🌙',
  '🎊', '💫', '🎯', '🏆', '🎨', '🎭', '🎪', '🎸', '🎺', '🎵',
  '👥', '👫', '👬', '👭', '💪', '🤝', '👋', '✋', '🤟', '✌️',
  '🏠', '🏫', '🏢', '🏪', '🏨', '⛺', '🏰', '🗼', '🎡', '🎢',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏓', '🏸', '🏒', '🏑', '🥅',
  '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🍱', '🍜'
] as const

export type PresetEmoji = typeof PRESET_EMOJIS[number]

// テーマカラーのカラーマップ
export const THEME_COLOR_MAP: Record<ThemeColor, { name: string; primary: string; light: string }> = {
  primary: { name: '夕日オレンジ', primary: '#f97316', light: '#fed7aa' },
  secondary: { name: '夜空パープル', primary: '#a855f7', light: '#e9d5ff' },
  accent: { name: 'ジャスミンブルー', primary: '#06b6d4', light: '#a5f3fc' },
  sand: { name: '砂漠ゴールド', primary: '#f59e0b', light: '#fde68a' },
  mystic: { name: '神秘ブルー', primary: '#0ea5e9', light: '#bae6fd' }
}