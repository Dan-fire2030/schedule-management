import { createClient } from './client'
import { cache, createCacheKey, withCache } from '@/lib/cache'

// スキーマキャッシュをクリア（一時的な対処）
if (typeof window !== 'undefined') {
  const clearSupabaseCache = () => {
    try {
      // Supabaseのローカルキャッシュをクリア
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
    } catch (error) {
      // Ignore errors during cache clearing
    }
  }
  
  // 開発環境でのみ実行
  if (process.env.NODE_ENV === 'development') {
    clearSupabaseCache()
  }
}

import type { 
  Event, 
  CreateEventInput, 
  UpdateEventInput, 
  EventSummary,
  EventParticipant,
  EventsResponse,
  EventResponse,
  EventFilter,
  ParticipationStatus
} from '@/types/event'

const supabase = createClient()

export class EventService {
  
  /**
   * 新しいイベントを作成
   */
  static async createEvent(groupId: string, input: CreateEventInput): Promise<EventResponse> {
    try {
      const supabase = createClient()
      
      // 現在のユーザーID取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { event: null, error: 'ユーザー認証に失敗しました' }
      }

      // 実際のスキーマに合わせてstart_timeとend_timeを作成
      // Check for either new format (start_time) or legacy format (start_date)
      let startDateTime: string
      let endDateTime: string | null = null

      // Validate that start_time is a proper timestamp
      const isValidTimestamp = (ts: any): ts is string => {
        return typeof ts === 'string' && ts.length > 0 && ts !== 'Invalid Date' && !ts.includes('undefined')
      }
      
      if (isValidTimestamp(input.start_time)) {
        // New format - already has proper timestamps
        startDateTime = input.start_time
        endDateTime = input.end_time && isValidTimestamp(input.end_time) ? input.end_time : null
      } else if ((input as any).start_date) {
        // Legacy format - build timestamps from separate date/time fields
        const inputLegacy = input as any
        if (!inputLegacy.start_date) {
          return { event: null, error: '開始日は必須です' }
        }

        if (input.is_all_day) {
          startDateTime = `${inputLegacy.start_date}T00:00:00+09:00`
        } else {
          const startTime = inputLegacy.start_time_only || '00:00:00'
          startDateTime = `${inputLegacy.start_date}T${startTime}+09:00`
        }
        
        if (inputLegacy.end_date) {
          if (input.is_all_day) {
            endDateTime = `${inputLegacy.end_date}T23:59:59+09:00`
          } else {
            const endTime = inputLegacy.end_time_only || inputLegacy.start_time_only || '23:59:59'
            endDateTime = `${inputLegacy.end_date}T${endTime}+09:00`
          }
        }
      } else {
        return { event: null, error: '開始日時情報が不足しています。日付と時刻を確認してください。' }
      }

      const eventData = {
        title: input.title.trim(),
        group_id: groupId,
        start_time: startDateTime,
        description: input.description?.trim() || null,
        event_type: input.type || 'single',
        end_time: endDateTime,
        is_all_day: input.is_all_day,
        priority: input.priority || 'medium'
      }

      // 直接INSERTでイベントを作成（確実性を優先）

      // @ts-ignore - 型定義の不一致を無視
      const { data, error } = await supabase
        .from('events')
        .insert({
          group_id: groupId,
          created_by: user.id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          event_type: input.type || 'single',
          start_time: startDateTime,
          end_time: endDateTime,
          location_name: typeof input.location === 'string' ? input.location : input.location?.name || null
        })
        .select()
        .single()

      if (error) {
        return { event: null, error: `イベントの作成に失敗しました: ${error.message}` }
      }

      if (!data) {
        return { event: null, error: 'イベントの作成に失敗しました: データが返されませんでした' }
      }

      // 作成者を参加者として追加（オプション機能）
      await this.addEventParticipant(data.id, user.id)

      // イベント関連のキャッシュをクリアして即座に反映
      this.clearEventCache(groupId)

      return { event: data as Event }
    } catch (error) {
      return { event: null, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * イベント一覧を取得（グループ別）
   */
  static async getGroupEvents(
    groupId: string, 
    filter?: EventFilter,
    page: number = 1,
    limit: number = 50
  ): Promise<EventsResponse> {
    try {
      const cacheKey = createCacheKey('group-events', groupId, JSON.stringify(filter), page, limit)
      
      return await withCache(cacheKey, async () => {
        // @ts-ignore - 型定義の不一致を無視
        let query = supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            event_type,
            start_time,
            end_time,
            location_name,
            location_lat,
            location_lng,
            location,
            max_participants,
            allow_maybe,
            require_response,
            recurrence_rule,
            timezone,
            created_by,
            created_at,
            updated_at
          `)
          .eq('group_id', groupId)
          .order('start_time', { ascending: true })

      // フィルター適用
      if (filter) {
        if (filter.type && filter.type.length > 0) {
          query = query.in('event_type', filter.type)
        }
        if (filter.start_time_from) {
          query = query.gte('start_time', filter.start_time_from)
        }
        if (filter.start_time_to) {
          query = query.lte('start_time', filter.start_time_to)
        }
        if (filter.created_by) {
          query = query.eq('created_by', filter.created_by)
        }
        if (filter.search_text) {
          query = query.or(`title.ilike.%${filter.search_text}%,description.ilike.%${filter.search_text}%`)
        }
      }

      // ページネーション
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: events, error, count } = await query

      if (error) {
        return { events: [], total: 0, page, limit, error: `イベントの取得に失敗しました: ${error.message}` }
      }

        return { 
          // @ts-ignore - 型定義の不一致を無視
          events: events as Event[], 
          total: count || events.length, 
          page, 
          limit 
        }
      }, 1 * 60 * 1000) // 1分間キャッシュ
    } catch (error) {
      return { events: [], total: 0, page, limit, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * 特定のイベントを取得（参加者情報含む）
   */
  static async getEvent(eventId: string): Promise<EventResponse> {
    try {
      const cacheKey = createCacheKey('event', eventId)
      
      return await withCache(cacheKey, async () => {
        // まずイベントのみを取得（event_participantsテーブルが存在しない可能性に対応）
        // @ts-ignore - 型定義の不一致を無視
        const { data: event, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (error) {
          throw new Error('イベントの取得に失敗しました')
        }

        // 参加者データを別途取得（event_participantsテーブルが存在しない場合は空配列）
        let participants: EventParticipant[] = []
        try {
          // @ts-ignore - 型定義の不一致を無視
          const { data: participantsData, error: participantsError } = await supabase
            .from('event_participants')
            .select(`
              id,
              event_id,
              user_id,
              status,
              response_message,
              responded_at,
              created_at,
              updated_at,
              profiles!event_participants_user_id_fkey (
                username,
                nickname,
                avatar_url
              )
            `)
            .eq('event_id', eventId)

          if (!participantsError && participantsData) {
            participants = participantsData.map((p: any) => ({
              id: p.id,
              event_id: eventId,
              user_id: p.user_id,
              status: p.status,
              response_message: p.response_message,
              responded_at: p.responded_at,
              created_at: p.created_at,
              updated_at: p.updated_at,
              profile: p.profiles ? {
                username: p.profiles.username,
                nickname: p.profiles.nickname,
                avatar_url: p.profiles.avatar_url
              } : undefined
            }))
          }
        } catch (participantsError) {
          // Ignore participants fetch errors
        }

        return { 
          // @ts-ignore - 型定義の不一致を無視
          event: event as Event, 
          participants 
        }
      }, 2 * 60 * 1000) // 2分間キャッシュ
    } catch (error) {
      return { event: null, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * イベントを更新
   */
  static async updateEvent(eventId: string, input: UpdateEventInput): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          ...input,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)

      if (error) {
        return { success: false, error: 'イベントの更新に失敗しました' }
      }

      // イベント更新時もキャッシュをクリア
      // まずイベントの詳細を取得してグループIDを特定
      const { data: eventData } = await supabase
        .from('events')
        .select('group_id')
        .eq('id', eventId)
        .single()
      
      if (eventData) {
        this.clearEventCache(eventData.group_id)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * イベントを削除
   */
  static async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 削除前にグループIDを取得
      const { data: eventData } = await supabase
        .from('events')
        .select('group_id')
        .eq('id', eventId)
        .single()

      // 関連する参加者レコードも削除される（CASCADE設定想定）
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) {
        return { success: false, error: 'イベントの削除に失敗しました' }
      }

      // 削除後にキャッシュをクリア
      if (eventData) {
        this.clearEventCache(eventData.group_id)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * イベントに参加表明
   */
  static async updateParticipation(
    eventId: string, 
    status: ParticipationStatus,
    responseMessage?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'ユーザー認証に失敗しました' }
      }

      const { error } = await supabase
        .from('event_participants')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status,
          response_message: responseMessage,
          responded_at: new Date().toISOString()
        }, {
          onConflict: 'event_id,user_id'
        })

      if (error) {
        return { success: false, error: '参加状況の更新に失敗しました' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * 参加者一覧を取得
   */
  static async getEventParticipants(eventId: string): Promise<{ participants: EventParticipant[]; error?: string }> {
    try {
      // @ts-ignore - 型定義の不一致を無視
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          user_id,
          status,
          response_message,
          responded_at,
          created_at,
          updated_at,
          profiles!event_participants_user_id_fkey (
            username,
            nickname,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) {
        return { participants: [], error: '参加者一覧の取得に失敗しました' }
      }

      const participants: EventParticipant[] = data.map((p: any) => ({
        id: p.id,
        event_id: p.event_id,
        user_id: p.user_id,
        status: p.status,
        response_message: p.response_message,
        responded_at: p.responded_at,
        created_at: p.created_at,
        updated_at: p.updated_at,
        profile: p.profiles ? {
          username: p.profiles.username,
          nickname: p.profiles.nickname,
          avatar_url: p.profiles.avatar_url
        } : undefined
      }))

      return { participants }
    } catch (error) {
      return { participants: [], error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * イベント関連キャッシュをクリア
   */
  private static clearEventCache(groupId: string): void {
    // グループ関連のイベントキャッシュをクリア
    cache.clearPattern(`group-events:${groupId}`)
    cache.clearPattern(`calendar-events:${groupId}`)
  }

  /**
   * イベント参加者を追加（内部用ヘルパーメソッド）
   */
  private static async addEventParticipant(eventId: string, userId: string): Promise<void> {
    try {
      const supabase = createClient()
      
      // event_participantsテーブルの存在確認
      // @ts-ignore - 型定義の不一致を無視
      const { data: tableCheck, error: tableError } = await supabase
        .from('event_participants')
        .select('count')
        .limit(1)

      if (tableError) {
        if (tableError.code === '42P01') {
          // Table does not exist
        } else {
          // Other error
        }
        return
      }

      // テーブルが存在する場合、参加者を追加
      // @ts-ignore - 型定義の不一致を無視
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'attending'
        })

      if (participantError) {
        // Ignore participant addition errors
      } else {
        // Participant added successfully
      }
    } catch (error) {
      // Ignore errors in participant addition
    }
  }

  /**
   * カレンダー表示用のイベント一覧を取得
   */
  static async getCalendarEvents(
    groupId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{ events: Event[]; error?: string }> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('group_id', groupId)
        .or(`start_time.gte.${startDate},end_time.lte.${endDate}`)
        .order('start_time', { ascending: true })

      if (error) {
        return { events: [], error: 'カレンダーイベントの取得に失敗しました' }
      }

      return { events: events as Event[] }
    } catch (error) {
      return { events: [], error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * ユーザーの参加予定イベント一覧
   */
  static async getUserEvents(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ events: Event[]; error?: string }> {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          event_participants!inner (
            status
          )
        `)
        .eq('event_participants.user_id', userId)
        .eq('event_participants.status', 'attending')

      if (startDate) {
        query = query.gte('start_time', startDate)
      }
      if (endDate) {
        query = query.lte('start_time', endDate)
      }

      const { data: events, error } = await query.order('start_time', { ascending: true })

      if (error) {
        return { events: [], error: 'ユーザーイベントの取得に失敗しました' }
      }

      return { events: events as Event[] }
    } catch (error) {
      return { events: [], error: '予期しないエラーが発生しました' }
    }
  }
}

// エクスポート用のヘルパー関数
export const createEvent = EventService.createEvent.bind(EventService)
export const getGroupEvents = EventService.getGroupEvents.bind(EventService)
export const getEvent = EventService.getEvent.bind(EventService)
export const updateEvent = EventService.updateEvent.bind(EventService)
export const deleteEvent = EventService.deleteEvent.bind(EventService)
export const updateParticipation = EventService.updateParticipation.bind(EventService)
export const getEventParticipants = EventService.getEventParticipants.bind(EventService)
export const getCalendarEvents = EventService.getCalendarEvents.bind(EventService)
export const getUserEvents = EventService.getUserEvents.bind(EventService)