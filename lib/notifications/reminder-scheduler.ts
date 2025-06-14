'use client'

import { createClient } from '@/lib/supabase/client'
import { showLocalNotification } from './push-notifications'
import type { Reminder } from '@/types/reminder'

export interface ScheduledReminder {
  reminderId: string
  eventTitle: string
  eventDate: Date
  reminderTime: Date
  timeoutId?: NodeJS.Timeout
}

export class ReminderScheduler {
  private scheduledReminders: Map<string, ScheduledReminder> = new Map()
  private checkInterval?: NodeJS.Timeout

  constructor() {
    this.startPeriodicCheck()
  }

  // 定期的なリマインダーチェックを開始
  private startPeriodicCheck() {
    // 初回チェックは1秒後、その後は5分ごとにチェック（負荷軽減）
    setTimeout(() => {
      this.checkPendingReminders()
    }, 1000)
    
    this.checkInterval = setInterval(() => {
      this.checkPendingReminders()
    }, 5 * 60 * 1000) // 5分ごとにチェック
  }

  // 定期チェックを停止
  public stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = undefined
    }
  }

  // ユーザーのリマインダーを読み込み、スケジュール
  public async loadAndScheduleReminders(userId: string) {
    // リマインダー機能を一時的に無効化
return
    
    /* 
    try {
      const supabase = createClient()
      
      // remindersテーブルの存在確認を先に行う
      // @ts-ignore - 型定義の不一致を無視
      const { data: tableCheck, error: tableError } = await supabase
        .from('reminders')
        .select('count')
        .limit(1)
        
      if (tableError && tableError.code === '42P01') {
return
      }
      
      // 未来のリマインダーを取得
      // @ts-ignore - 型定義の不一致を無視
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_at', new Date().toISOString())
        .eq('sent', false)
        
      if (error) {
// remindersテーブルが存在しない場合は処理をスキップ
        if (error.code === '42P01') { // relation does not exist
return
        }
        return
      }
    
      // 関連イベントを別途取得
      const enrichedReminders = await Promise.all(
        (reminders || []).map(async (reminder) => {
          if (reminder.event_id) {
            const { data: event } = await supabase
              .from('events')
              .select('title, start_date, end_date, event_type')
              .eq('id', reminder.event_id)
              .single()
            
            return { ...reminder, event }
          }
          return { ...reminder, event: null }
        })
      )

      // 既存のスケジュールをクリア
      this.clearAllScheduled()

      // 新しいリマインダーをスケジュール
      enrichedReminders.forEach(reminder => {
        this.scheduleReminder(reminder)
      })
    } catch (error) {
      // Silent error handling - reminder feature disabled
    }
    */
  }

  // 個別のリマインダーをスケジュール
  public scheduleReminder(reminder: any) {
    const reminderTime = new Date(reminder.scheduled_at)
    const now = new Date()

    // 既に過去の時刻の場合はスキップ
    if (reminderTime <= now) {
      return
    }

    const delay = reminderTime.getTime() - now.getTime()
    
    // 最大setTimeout遅延（約24.8日）を超える場合は定期チェックに委ねる
    if (delay > 2147483647) {
      return
    }

    const scheduledReminder: ScheduledReminder = {
      reminderId: reminder.id,
      eventTitle: reminder.event?.title || reminder.title || 'リマインダー',
      eventDate: new Date(reminder.event?.start_date || reminder.scheduled_at),
      reminderTime: reminderTime
    }

    // タイマーを設定
    scheduledReminder.timeoutId = setTimeout(() => {
      this.triggerReminder(scheduledReminder)
    }, delay)

    this.scheduledReminders.set(reminder.id, scheduledReminder)
  }

  // リマインダーをキャンセル
  public cancelReminder(reminderId: string) {
    const scheduled = this.scheduledReminders.get(reminderId)
    if (scheduled?.timeoutId) {
      clearTimeout(scheduled.timeoutId)
    }
    this.scheduledReminders.delete(reminderId)
  }

  // 全てのスケジュールをクリア
  public clearAllScheduled() {
    this.scheduledReminders.forEach(scheduled => {
      if (scheduled.timeoutId) {
        clearTimeout(scheduled.timeoutId)
      }
    })
    this.scheduledReminders.clear()
  }

  // リマインダーを発火
  private async triggerReminder(scheduled: ScheduledReminder) {
    try {
// ローカル通知を表示
      await showLocalNotification({
        title: '📅 リマインダー',
        body: `${scheduled.eventTitle} が ${this.formatTimeUntil(scheduled.eventDate)} に予定されています`,
        icon: '/icons/icon-192x192.png',
        tag: `reminder-${scheduled.reminderId}`,
        data: {
          type: 'reminder',
          reminderId: scheduled.reminderId,
          eventTitle: scheduled.eventTitle,
          eventDate: scheduled.eventDate.toISOString()
        }
      })

      // データベースでリマインダーを送信済みにマーク
      const supabase = createClient()
      await supabase
        .from('reminders')
        .update({ 
          sent: true, 
          sent_at: new Date().toISOString() 
        })
        .eq('id', scheduled.reminderId)

      // スケジュールから削除
      this.scheduledReminders.delete(scheduled.reminderId)
    } catch (error) {
      // Silent error handling - reminder feature disabled
    }
  }

  // 定期的にデータベースをチェックして新しいリマインダーを探す
  private async checkPendingReminders() {
    // リマインダー機能を一時的に無効化
return
    
    /*
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
return
      }
      
      if (!user) {
return
      }

      const now = new Date()
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
// remindersテーブルの存在確認を先に行う
      // @ts-ignore - 型定義の不一致を無視
      const { data: tableCheck, error: tableError } = await supabase
        .from('reminders')
        .select('count')
        .limit(1)
        
      if (tableError && tableError.code === '42P01') {
return
      }

      // 今から5分以内の未送信リマインダーを取得
      // @ts-ignore - 型定義の不一致を無視
      const { data: pendingReminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('sent', false)
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', fiveMinutesFromNow.toISOString())

      if (error) {
// remindersテーブルが存在しない場合は処理をスキップ
        if (error.code === '42P01') { // relation does not exist
return
        }
        return
      }
if (!pendingReminders || pendingReminders.length === 0) {
        return
      }

      // 関連イベントを取得
      const enrichedReminders = await Promise.all(
        pendingReminders.map(async (reminder) => {
          try {
            if (reminder.event_id) {
              const { data: event, error: eventError } = await supabase
                .from('events')
                .select('title, start_date, end_date, event_type')
                .eq('id', reminder.event_id)
                .single()
              
              if (eventError) {
return { ...reminder, event: null }
              }
              
              return { ...reminder, event }
            }
            return { ...reminder, event: null }
          } catch (err) {
return { ...reminder, event: null }
          }
        })
      )

      // 新しいリマインダーをスケジュール
      enrichedReminders.forEach(reminder => {
        try {
    
          if (!this.scheduledReminders.has(reminder.id)) {
this.scheduleReminder(reminder)
          }
        } catch (err) {
          // Ignore individual reminder scheduling errors
        }
      })
        } catch (error) {
      // Silent error handling - reminder feature disabled
    }
    */
  }

  // イベントまでの時間を人間が読める形式でフォーマット
  private formatTimeUntil(eventDate: Date): string {
    const now = new Date()
    const diff = eventDate.getTime() - now.getTime()
    
    if (diff < 0) return '開始時刻を過ぎています'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}日${hours % 24}時間後`
    } else if (hours > 0) {
      return `${hours}時間${minutes % 60}分後`
    } else if (minutes > 0) {
      return `${minutes}分後`
    } else {
      return 'まもなく'
    }
  }

  // 現在のスケジュール状況を取得
  public getScheduledCount(): number {
    return this.scheduledReminders.size
  }

  // デバッグ用：スケジュールされたリマインダー一覧を取得
  public getScheduledReminders(): ScheduledReminder[] {
    return Array.from(this.scheduledReminders.values())
  }
}

// シングルトンインスタンス
let schedulerInstance: ReminderScheduler | null = null

export function getReminderScheduler(): ReminderScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new ReminderScheduler()
  }
  return schedulerInstance
}

// クリーンアップ用
export function cleanupReminderScheduler() {
  if (schedulerInstance) {
    schedulerInstance.stopPeriodicCheck()
    schedulerInstance.clearAllScheduled()
    schedulerInstance = null
  }
}