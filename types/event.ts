// イベント・予定関連の型定義

export type EventType = 'single' | 'all_day' | 'recurring' | 'task'

export type ParticipationStatus = 'attending' | 'not_attending' | 'pending'

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export type EventPriority = 'low' | 'medium' | 'high' | 'urgent'

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

// 繰り返し設定
export interface RecurrenceRule {
  type: RecurrenceType
  interval: number // 間隔（例: 2週間毎 = 2）
  daysOfWeek?: number[] // 曜日指定（0-6: 日-土）
  dayOfMonth?: number // 月の何日か（1-31）
  monthOfYear?: number // 年の何月か（1-12）
  endDate?: string // 終了日
  occurrences?: number // 繰り返し回数
}

// 場所情報
export interface EventLocation {
  name: string
  address?: string
  latitude?: number
  longitude?: number
  url?: string // Google Maps URL等
}

// リマインダー設定
export interface EventReminder {
  id: string
  minutes_before: number // 何分前に通知するか
  method: 'notification' | 'email' // 通知方法
  is_enabled: boolean
}

// イベント参加者
export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  status: ParticipationStatus
  response_message?: string
  responded_at?: string
  created_at: string
  updated_at: string
  // プロフィール情報（JOIN結果）
  profile?: {
    username: string
    nickname: string
    avatar_url?: string
  }
}

// メインのイベント型
export interface Event {
  id: string
  group_id: string
  title: string
  description?: string
  type: EventType
  status: EventStatus
  priority: EventPriority
  
  // 日時設定
  start_time: string // TIMESTAMPTZ format
  end_time?: string // TIMESTAMPTZ format
  is_all_day: boolean
  timezone?: string
  
  // 繰り返し設定
  recurrence_rule?: RecurrenceRule
  
  // 場所・詳細
  location?: EventLocation
  
  // 参加者管理
  max_participants?: number
  allow_maybe: boolean // 未定を許可するか
  require_response: boolean // 回答必須か
  
  // 作成者・管理
  created_by: string
  created_at: string
  updated_at: string
  
  // 集計情報（計算プロパティ）
  participant_count?: number
  attending_count?: number
  not_attending_count?: number
  pending_count?: number
}

// イベント作成時の入力データ
export interface CreateEventInput {
  title: string
  description?: string
  type: EventType
  priority?: EventPriority
  
  start_time: string
  end_time?: string
  is_all_day: boolean
  
  recurrence_rule?: RecurrenceRule
  location?: Omit<EventLocation, 'id'>
  
  max_participants?: number
  allow_maybe?: boolean
  require_response?: boolean
  
  // Legacy fields for compatibility (optional)
  start_date?: string
  end_date?: string
  start_time_only?: string
  end_time_only?: string
}

// イベント更新時の入力データ
export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus
}

// イベント一覧表示用の簡略化された型
export interface EventSummary {
  id: string
  title: string
  type: EventType
  status: EventStatus
  priority: EventPriority
  start_time: string
  is_all_day: boolean
  location_name?: string
  participant_count: number
  attending_count: number
  my_status?: ParticipationStatus
}

// カレンダー表示用のイベント
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  type: EventType
  status: EventStatus
  priority: EventPriority
  color: string // テーマカラーから生成
  participantCount: number
  myStatus?: ParticipationStatus
}

// イベント検索・フィルター
export interface EventFilter {
  type?: EventType[]
  status?: EventStatus[]
  priority?: EventPriority[]
  start_time_from?: string
  start_time_to?: string
  participant_status?: ParticipationStatus
  created_by?: string
  search_text?: string
}

// API レスポンス型
export interface EventsResponse {
  events: Event[]
  total: number
  page: number
  limit: number
  error?: string
}

export interface EventResponse {
  event: Event | null
  participants?: EventParticipant[]
  error?: string
}

// 定数
export const EVENT_TYPES: { [key in EventType]: { name: string; icon: string; color: string } } = {
  single: { name: '単発イベント', icon: '📅', color: '#3b82f6' },
  all_day: { name: '終日イベント', icon: '🌅', color: '#10b981' },
  recurring: { name: '定期イベント', icon: '🔄', color: '#8b5cf6' },
  task: { name: 'タスク', icon: '✅', color: '#f59e0b' }
}

export const PARTICIPATION_STATUS: { [key in ParticipationStatus]: { name: string; icon: string; color: string } } = {
  attending: { name: '参加', icon: '✅', color: '#10b981' },
  not_attending: { name: '不参加', icon: '❌', color: '#ef4444' },
  pending: { name: '未定', icon: '❓', color: '#6b7280' }
}

export const EVENT_PRIORITIES: { [key in EventPriority]: { name: string; color: string } } = {
  low: { name: '低', color: '#6b7280' },
  medium: { name: '中', color: '#3b82f6' },
  high: { name: '高', color: '#f59e0b' },
  urgent: { name: '緊急', color: '#ef4444' }
}

// ヘルパー関数の型
export interface EventHelpers {
  formatEventDate: (event: Event) => string
  getEventColor: (event: Event, themeColor: string) => string
  isEventActive: (event: Event) => boolean
  canEditEvent: (event: Event, userId: string) => boolean
  getParticipationSummary: (participants: EventParticipant[]) => {
    attending: number
    not_attending: number
    pending: number
    total: number
  }
}