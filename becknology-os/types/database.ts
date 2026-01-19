export type Database = {
  public: {
    Tables: {
      entries: {
        Row: {
          id: string
          type: string | null
          title: string | null
          content: string | null
          project: string | null
          priority: string
          status: string
          file_url: string | null
          file_type: string | null
          keywords: string[] | null
          source_url: string | null
          ocr_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type?: string | null
          title?: string | null
          content?: string | null
          project?: string | null
          priority?: string
          status?: string
          file_url?: string | null
          file_type?: string | null
          keywords?: string[] | null
          source_url?: string | null
          ocr_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string | null
          title?: string | null
          content?: string | null
          project?: string | null
          priority?: string
          status?: string
          file_url?: string | null
          file_type?: string | null
          keywords?: string[] | null
          source_url?: string | null
          ocr_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          title: string | null
          description: string | null
          project: string | null
          timeframe: string | null
          due_date: string | null
          progress: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          description?: string | null
          project?: string | null
          timeframe?: string | null
          due_date?: string | null
          progress?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          description?: string | null
          project?: string | null
          timeframe?: string | null
          due_date?: string | null
          progress?: number
          status?: string
          created_at?: string
        }
      }
      insights: {
        Row: {
          id: string
          type: string | null
          title: string | null
          description: string | null
          source_entries: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          type?: string | null
          title?: string | null
          description?: string | null
          source_entries?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string | null
          title?: string | null
          description?: string | null
          source_entries?: string[] | null
          created_at?: string
        }
      }
      weekly_reports: {
        Row: {
          id: string
          week_start: string | null
          summary: string | null
          metrics: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          week_start?: string | null
          summary?: string | null
          metrics?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          week_start?: string | null
          summary?: string | null
          metrics?: Record<string, unknown> | null
          created_at?: string
        }
      }
    }
  }
}
