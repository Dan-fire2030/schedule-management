import { createClient } from './client'
import { Database } from '@/types/database.types'
import { Reminder, CreateReminderRequest, NotificationSettings, ReminderWithEvent } from '@/types/reminder'

export async function createReminder(data: CreateReminderRequest, userId: string): Promise<Reminder | null> {
  try {
    const supabase = createClient()
    // Calculate reminder time based on timing
    const reminderTime = calculateReminderTime(data.timing, data.custom_minutes)
    
    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        event_id: data.event_id,
        user_id: userId,
        title: data.title,
        message: data.message,
        reminder_time: reminderTime,
        notification_type: data.notification_type,
        is_sent: false
      })
      .select()
      .single()

    if (error) {
return null
    }

    return reminder as Reminder
  } catch (error) {
return null
  }
}

export async function getUserReminders(userId: string): Promise<ReminderWithEvent[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        events (
          title,
          start_time
        )
      `)
      .eq('user_id', userId)
      .eq('is_sent', false)
      .order('reminder_time', { ascending: true })

    if (error) {
return []
    }

    return data.map(item => ({
      id: item.id,
      event_id: item.event_id,
      event_title: item.events?.title || '',
      event_start_time: item.events?.start_time || '',
      title: item.title,
      message: item.message,
      reminder_time: item.reminder_time,
      notification_type: item.notification_type,
      is_sent: item.is_sent
    })) as ReminderWithEvent[]
  } catch (error) {
return []
  }
}

export async function markReminderAsSent(reminderId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('reminders')
      .update({ is_sent: true, updated_at: new Date().toISOString() })
      .eq('id', reminderId)

    if (error) {
return false
    }

    return true
  } catch (error) {
return false
  }
}

export async function deleteReminder(reminderId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)

    if (error) {
return false
    }

    return true
  } catch (error) {
return false
  }
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
return null
    }

    return data as NotificationSettings
  } catch (error) {
return null
  }
}

export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
return null
    }

    return data as NotificationSettings
  } catch (error) {
return null
  }
}

// Helper function to calculate reminder time
function calculateReminderTime(timing: string, customMinutes?: number): string {
  const now = new Date()
  
  switch (timing) {
    case 'immediate':
      return now.toISOString()
    case '5min':
      return new Date(now.getTime() + 5 * 60 * 1000).toISOString()
    case '15min':
      return new Date(now.getTime() + 15 * 60 * 1000).toISOString()
    case '30min':
      return new Date(now.getTime() + 30 * 60 * 1000).toISOString()
    case '1hour':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    case '2hour':
      return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
    case '1day':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    case '1week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'custom':
      if (customMinutes) {
        return new Date(now.getTime() + customMinutes * 60 * 1000).toISOString()
      }
      return now.toISOString()
    default:
      return now.toISOString()
  }
}

// Get pending reminders that should be sent now
export async function getPendingReminders(): Promise<ReminderWithEvent[]> {
  try {
    const supabase = createClient()
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        events (
          title,
          start_time
        )
      `)
      .eq('is_sent', false)
      .lte('reminder_time', now)
      .order('reminder_time', { ascending: true })

    if (error) {
return []
    }

    return data.map(item => ({
      id: item.id,
      event_id: item.event_id,
      event_title: item.events?.title || '',
      event_start_time: item.events?.start_time || '',
      title: item.title,
      message: item.message,
      reminder_time: item.reminder_time,
      notification_type: item.notification_type,
      is_sent: item.is_sent
    })) as ReminderWithEvent[]
  } catch (error) {
return []
  }
}