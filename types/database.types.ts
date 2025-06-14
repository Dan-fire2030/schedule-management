export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          nickname: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          nickname: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          nickname?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          invite_code: string
          icon_type: 'emoji' | 'image'
          icon_emoji: string | null
          icon_image_url: string | null
          theme_color: string
          recurring_schedule: Json | null
          created_by: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          invite_code: string
          icon_type?: 'emoji' | 'image'
          icon_emoji?: string | null
          icon_image_url?: string | null
          theme_color?: string
          recurring_schedule?: Json | null
          created_by: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          invite_code?: string
          icon_type?: 'emoji' | 'image'
          icon_emoji?: string | null
          icon_image_url?: string | null
          theme_color?: string
          recurring_schedule?: Json | null
          created_by?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'creator' | 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'creator' | 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'creator' | 'admin' | 'member'
          joined_at?: string
        }
      }
      group_invitations: {
        Row: {
          id: string
          group_id: string
          invited_by: string
          invited_user_id: string | null
          invite_type: 'link' | 'qr' | 'username'
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          expires_at: string | null
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          invited_by: string
          invited_user_id?: string | null
          invite_type?: 'link' | 'qr' | 'username'
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          expires_at?: string | null
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          invited_by?: string
          invited_user_id?: string | null
          invite_type?: 'link' | 'qr' | 'username'
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          expires_at?: string | null
          created_at?: string
          responded_at?: string | null
        }
      }
      events: {
        Row: {
          id: string
          group_id: string
          created_by: string
          title: string
          description: string | null
          type: 'single' | 'all_day' | 'recurring' | 'task'
          start_date: string
          end_date: string | null
          start_time: string | null
          end_time: string | null
          is_all_day: boolean
          location_name: string | null
          location_lat: number | null
          location_lng: number | null
          recurrence_rule: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          created_by: string
          title: string
          description?: string | null
          type: 'single' | 'all_day' | 'recurring' | 'task'
          start_date: string
          end_date?: string | null
          start_time?: string | null
          end_time?: string | null
          is_all_day?: boolean
          location_name?: string | null
          location_lat?: number | null
          location_lng?: number | null
          recurrence_rule?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          created_by?: string
          title?: string
          description?: string | null
          type?: 'single' | 'all_day' | 'recurring' | 'task'
          start_date?: string
          end_date?: string | null
          start_time?: string | null
          end_time?: string | null
          is_all_day?: boolean
          location_name?: string | null
          location_lat?: number | null
          location_lng?: number | null
          recurrence_rule?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'attending' | 'not_attending' | 'pending'
          response_message: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'attending' | 'not_attending' | 'pending'
          response_message?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'attending' | 'not_attending' | 'pending'
          response_message?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          group_id: string
          user_id: string
          content: string | null
          message_type: 'text' | 'stamp'
          stamp_id: string | null
          edited_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          content?: string | null
          message_type?: 'text' | 'stamp'
          stamp_id?: string | null
          edited_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          content?: string | null
          message_type?: 'text' | 'stamp'
          stamp_id?: string | null
          edited_at?: string | null
          created_at?: string
        }
      }
      stamps: {
        Row: {
          id: string
          name: string
          image_url: string
          category: string
          created_by: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          image_url: string
          category?: string
          created_by?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string
          category?: string
          created_by?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          read_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          event_id: string
          user_id: string
          remind_at: string
          is_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          remind_at: string
          is_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          remind_at?: string
          is_sent?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      cleanup_old_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_invitation_expiry: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_expire_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}