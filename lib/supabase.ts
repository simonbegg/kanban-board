import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          slack_access_token: string | null
          slack_user_id: string | null
          slack_team_id: string | null
          slack_channel_id: string | null
          slack_connected_at: string | null
          email_notifications_enabled: boolean
          notification_email: string | null
          notification_frequency: 'daily' | 'weekly'
          last_notification_sent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          slack_access_token?: string | null
          slack_user_id?: string | null
          slack_team_id?: string | null
          slack_channel_id?: string | null
          slack_connected_at?: string | null
          email_notifications_enabled?: boolean
          notification_email?: string | null
          notification_frequency?: 'daily' | 'weekly'
          last_notification_sent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          slack_access_token?: string | null
          slack_user_id?: string | null
          slack_team_id?: string | null
          slack_channel_id?: string | null
          slack_connected_at?: string | null
          email_notifications_enabled?: boolean
          notification_email?: string | null
          notification_frequency?: 'daily' | 'weekly'
          last_notification_sent?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      entitlements: {
        Row: {
          user_id: string
          plan: 'free' | 'pro'
          board_cap: number
          active_cap_per_board: number
          archive_retention_days: number
          archived_cap_per_user: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          plan?: 'free' | 'pro'
          board_cap?: number
          active_cap_per_board?: number
          archive_retention_days?: number
          archived_cap_per_user?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          plan?: 'free' | 'pro'
          board_cap?: number
          active_cap_per_board?: number
          archive_retention_days?: number
          archived_cap_per_user?: number
          created_at?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          title: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      columns: {
        Row: {
          id: string
          title: string
          board_id: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          board_id: string
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          board_id?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          column_id: string
          board_id: string
          position: number
          archived: boolean
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          column_id: string
          board_id: string
          position: number
          archived?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          column_id?: string
          board_id?: string
          position?: number
          archived?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications_log: {
        Row: {
          id: string
          user_id: string
          task_id: string
          notification_type: string
          sent_at: string
          metadata: any
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          notification_type: string
          sent_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          notification_type?: string
          sent_at?: string
          metadata?: any
        }
      }
    }
  }
}

// Client-side Supabase client
export const createClient = () => createClientComponentClient<Database>()
