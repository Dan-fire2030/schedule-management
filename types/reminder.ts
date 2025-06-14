export interface Reminder {
  id: string
  event_id: string
  user_id: string
  title: string
  message?: string
  reminder_time: string
  notification_type: 'push' | 'email' | 'both'
  is_sent: boolean
  created_at: string
  updated_at: string
}

export interface ReminderTemplate {
  id: string
  name: string
  description: string
  timing_minutes: number
  is_default: boolean
}

export interface NotificationSettings {
  id: string
  user_id: string
  push_enabled: boolean
  email_enabled: boolean
  sound_enabled: boolean
  vibration_enabled: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  created_at: string
  updated_at: string
}

export type ReminderTiming = 
  | 'immediate'
  | '5min'
  | '15min'
  | '30min'
  | '1hour'
  | '2hour'
  | '1day'
  | '1week'
  | 'custom'

export interface CreateReminderRequest {
  event_id: string
  title: string
  message?: string
  timing: ReminderTiming
  custom_minutes?: number
  notification_type: 'push' | 'email' | 'both'
}

export interface ReminderWithEvent {
  id: string
  event_id: string
  event_title: string
  event_start_time: string
  title: string
  message?: string
  reminder_time: string
  notification_type: 'push' | 'email' | 'both'
  is_sent: boolean
}