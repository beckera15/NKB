export type Database = {
  public: {
    Tables: {
      entries: {
        Row: {
          id: string
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          user_id: string | null
          type: string | null
          title: string | null
          description: string | null
          source_entries: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type?: string | null
          title?: string | null
          description?: string | null
          source_entries?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
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
          user_id: string | null
          week_start: string | null
          summary: string | null
          metrics: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          week_start?: string | null
          summary?: string | null
          metrics?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          week_start?: string | null
          summary?: string | null
          metrics?: Record<string, unknown> | null
          created_at?: string
        }
      }

      // Trading Tables
      trading_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          status: 'pending' | 'active' | 'completed'
          pre_session_completed: boolean
          pre_session_checklist: Record<string, unknown> | null
          daily_bias: 'bullish' | 'bearish' | 'neutral' | null
          key_levels: Record<string, unknown> | null
          notes: string | null
          total_trades: number
          winning_trades: number
          losing_trades: number
          total_pnl: number
          started_at: string | null
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          status?: 'pending' | 'active' | 'completed'
          pre_session_completed?: boolean
          pre_session_checklist?: Record<string, unknown> | null
          daily_bias?: 'bullish' | 'bearish' | 'neutral' | null
          key_levels?: Record<string, unknown> | null
          notes?: string | null
          total_trades?: number
          winning_trades?: number
          losing_trades?: number
          total_pnl?: number
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          status?: 'pending' | 'active' | 'completed'
          pre_session_completed?: boolean
          pre_session_checklist?: Record<string, unknown> | null
          daily_bias?: 'bullish' | 'bearish' | 'neutral' | null
          key_levels?: Record<string, unknown> | null
          notes?: string | null
          total_trades?: number
          winning_trades?: number
          losing_trades?: number
          total_pnl?: number
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          symbol: string
          direction: 'long' | 'short'
          entry_price: number
          exit_price: number | null
          stop_loss: number
          take_profit: number | null
          position_size: number
          risk_amount: number
          pnl: number | null
          status: 'open' | 'closed' | 'cancelled'
          entry_time: string
          exit_time: string | null
          screenshot_url: string | null
          notes: string | null
          setup_type: string | null
          kill_zone: string | null
          followed_rules: boolean
          rule_violations: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          symbol: string
          direction: 'long' | 'short'
          entry_price: number
          exit_price?: number | null
          stop_loss: number
          take_profit?: number | null
          position_size: number
          risk_amount: number
          pnl?: number | null
          status?: 'open' | 'closed' | 'cancelled'
          entry_time: string
          exit_time?: string | null
          screenshot_url?: string | null
          notes?: string | null
          setup_type?: string | null
          kill_zone?: string | null
          followed_rules?: boolean
          rule_violations?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          symbol?: string
          direction?: 'long' | 'short'
          entry_price?: number
          exit_price?: number | null
          stop_loss?: number
          take_profit?: number | null
          position_size?: number
          risk_amount?: number
          pnl?: number | null
          status?: 'open' | 'closed' | 'cancelled'
          entry_time?: string
          exit_time?: string | null
          screenshot_url?: string | null
          notes?: string | null
          setup_type?: string | null
          kill_zone?: string | null
          followed_rules?: boolean
          rule_violations?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      nova_conversations: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          role: 'user' | 'assistant'
          content: string
          context_type: 'general' | 'pre_session' | 'trade_analysis' | 'post_session' | 'rule_check'
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          role: 'user' | 'assistant'
          content: string
          context_type: 'general' | 'pre_session' | 'trade_analysis' | 'post_session' | 'rule_check'
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          role?: 'user' | 'assistant'
          content?: string
          context_type?: 'general' | 'pre_session' | 'trade_analysis' | 'post_session' | 'rule_check'
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
      }
      trading_rules: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          enforcement: 'block' | 'warn' | 'log'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          enforcement?: 'block' | 'warn' | 'log'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          enforcement?: 'block' | 'warn' | 'log'
          is_active?: boolean
          created_at?: string
        }
      }

      // Fitness Tables
      workouts: {
        Row: {
          id: string
          user_id: string
          date: string
          type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
          name: string
          duration_minutes: number
          exercises: Record<string, unknown>[]
          notes: string | null
          energy_level: number | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
          name: string
          duration_minutes: number
          exercises?: Record<string, unknown>[]
          notes?: string | null
          energy_level?: number | null
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
          name?: string
          duration_minutes?: number
          exercises?: Record<string, unknown>[]
          notes?: string | null
          energy_level?: number | null
          completed?: boolean
          created_at?: string
        }
      }
      supplements: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string
          timing: 'morning' | 'afternoon' | 'evening' | 'with_meals' | 'before_bed'
          frequency: 'daily' | 'weekly' | 'as_needed'
          purpose: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dosage: string
          timing: 'morning' | 'afternoon' | 'evening' | 'with_meals' | 'before_bed'
          frequency?: 'daily' | 'weekly' | 'as_needed'
          purpose?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          dosage?: string
          timing?: 'morning' | 'afternoon' | 'evening' | 'with_meals' | 'before_bed'
          frequency?: 'daily' | 'weekly' | 'as_needed'
          purpose?: string | null
          active?: boolean
          created_at?: string
        }
      }
      supplement_logs: {
        Row: {
          id: string
          user_id: string
          supplement_id: string
          taken_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          supplement_id: string
          taken_at: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          supplement_id?: string
          taken_at?: string
          notes?: string | null
        }
      }
      health_metrics: {
        Row: {
          id: string
          user_id: string
          date: string
          type: 'weight' | 'blood_pressure' | 'heart_rate' | 'sleep_hours' | 'steps' | 'body_fat' | 'water_intake'
          value: number
          secondary_value: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: 'weight' | 'blood_pressure' | 'heart_rate' | 'sleep_hours' | 'steps' | 'body_fat' | 'water_intake'
          value: number
          secondary_value?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: 'weight' | 'blood_pressure' | 'heart_rate' | 'sleep_hours' | 'steps' | 'body_fat' | 'water_intake'
          value?: number
          secondary_value?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      morning_routines: {
        Row: {
          id: string
          user_id: string
          date: string
          wake_time: string
          items_completed: Record<string, boolean>
          mood_rating: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          wake_time: string
          items_completed?: Record<string, boolean>
          mood_rating?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          wake_time?: string
          items_completed?: Record<string, boolean>
          mood_rating?: number | null
          notes?: string | null
          created_at?: string
        }
      }

      // TCAS Tables
      tcas_customers: {
        Row: {
          id: string
          user_id: string
          company_name: string
          contact_name: string
          contact_email: string
          contact_phone: string | null
          industry: string | null
          address: string | null
          city: string | null
          state: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          contact_name: string
          contact_email: string
          contact_phone?: string | null
          industry?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string | null
          industry?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tcas_quotes: {
        Row: {
          id: string
          user_id: string
          customer_id: string
          quote_number: string
          title: string
          description: string | null
          items: Record<string, unknown>[]
          subtotal: number
          tax: number
          total: number
          status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          valid_until: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id: string
          quote_number: string
          title: string
          description?: string | null
          items?: Record<string, unknown>[]
          subtotal: number
          tax?: number
          total: number
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          valid_until?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string
          quote_number?: string
          title?: string
          description?: string | null
          items?: Record<string, unknown>[]
          subtotal?: number
          tax?: number
          total?: number
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          valid_until?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tcas_pipeline: {
        Row: {
          id: string
          user_id: string
          customer_id: string
          title: string
          value: number
          stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
          probability: number
          expected_close_date: string | null
          assigned_to: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id: string
          title: string
          value: number
          stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
          probability?: number
          expected_close_date?: string | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string
          title?: string
          value?: number
          stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
          probability?: number
          expected_close_date?: string | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tcas_agent_conversations: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          role: 'user' | 'assistant'
          content: string
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          role: 'user' | 'assistant'
          content: string
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          role?: 'user' | 'assistant'
          content?: string
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
      }

      // Wealth Tables
      wealth_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'investment' | 'retirement' | 'crypto' | 'real_estate' | 'other'
          institution: string | null
          balance: number
          last_updated: string
          is_debt: boolean
          interest_rate: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'investment' | 'retirement' | 'crypto' | 'real_estate' | 'other'
          institution?: string | null
          balance?: number
          last_updated?: string
          is_debt?: boolean
          interest_rate?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'checking' | 'savings' | 'investment' | 'retirement' | 'crypto' | 'real_estate' | 'other'
          institution?: string | null
          balance?: number
          last_updated?: string
          is_debt?: boolean
          interest_rate?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      wealth_transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          date: string
          amount: number
          type: 'income' | 'expense' | 'transfer'
          category: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          date: string
          amount: number
          type: 'income' | 'expense' | 'transfer'
          category: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          date?: string
          amount?: number
          type?: 'income' | 'expense' | 'transfer'
          category?: string
          description?: string | null
          created_at?: string
        }
      }
      wealth_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          target_date: string | null
          category: 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'other'
          priority: 'high' | 'medium' | 'low'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          target_date?: string | null
          category?: 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'other'
          priority?: 'high' | 'medium' | 'low'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          target_date?: string | null
          category?: 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'other'
          priority?: 'high' | 'medium' | 'low'
          notes?: string | null
          created_at?: string
        }
      }
      income_streams: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'salary' | 'business' | 'investment' | 'rental' | 'side_hustle' | 'other'
          amount: number
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' | 'variable'
          is_active: boolean
          start_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'salary' | 'business' | 'investment' | 'rental' | 'side_hustle' | 'other'
          amount: number
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' | 'variable'
          is_active?: boolean
          start_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'salary' | 'business' | 'investment' | 'rental' | 'side_hustle' | 'other'
          amount?: number
          frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' | 'variable'
          is_active?: boolean
          start_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }

      // Family & Property Tables
      family_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          event_date: string
          event_time: string | null
          location: string | null
          reminder_days: number
          is_recurring: boolean
          recurrence_pattern: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          event_date: string
          event_time?: string | null
          location?: string | null
          reminder_days?: number
          is_recurring?: boolean
          recurrence_pattern?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          location?: string | null
          reminder_days?: number
          is_recurring?: boolean
          recurrence_pattern?: string | null
          created_at?: string
        }
      }
      property_tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: 'maintenance' | 'repair' | 'improvement' | 'cleaning' | 'yard' | 'other'
          priority: 'high' | 'medium' | 'low'
          status: 'pending' | 'in_progress' | 'completed'
          due_date: string | null
          estimated_cost: number | null
          actual_cost: number | null
          notes: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: 'maintenance' | 'repair' | 'improvement' | 'cleaning' | 'yard' | 'other'
          priority?: 'high' | 'medium' | 'low'
          status?: 'pending' | 'in_progress' | 'completed'
          due_date?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: 'maintenance' | 'repair' | 'improvement' | 'cleaning' | 'yard' | 'other'
          priority?: 'high' | 'medium' | 'low'
          status?: 'pending' | 'in_progress' | 'completed'
          due_date?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      property_maintenance_schedule: {
        Row: {
          id: string
          user_id: string
          task_name: string
          description: string | null
          frequency: 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually'
          last_completed: string | null
          next_due: string | null
          estimated_cost: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_name: string
          description?: string | null
          frequency: 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually'
          last_completed?: string | null
          next_due?: string | null
          estimated_cost?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_name?: string
          description?: string | null
          frequency?: 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually'
          last_completed?: string | null
          next_due?: string | null
          estimated_cost?: number | null
          notes?: string | null
          created_at?: string
        }
      }

      // System Tables
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'alert' | 'success' | 'warning' | 'info'
          title: string
          message: string
          category: 'trading' | 'tcas' | 'fitness' | 'family' | 'wealth' | 'system'
          action_url: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'alert' | 'success' | 'warning' | 'info'
          title: string
          message: string
          category: 'trading' | 'tcas' | 'fitness' | 'family' | 'wealth' | 'system'
          action_url?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'alert' | 'success' | 'warning' | 'info'
          title?: string
          message?: string
          category?: 'trading' | 'tcas' | 'fitness' | 'family' | 'wealth' | 'system'
          action_url?: string | null
          read?: boolean
          created_at?: string
        }
      }
      price_alerts: {
        Row: {
          id: string
          user_id: string
          symbol: string
          condition: 'above' | 'below' | 'crosses'
          target_price: number
          is_active: boolean
          triggered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          condition: 'above' | 'below' | 'crosses'
          target_price: number
          is_active?: boolean
          triggered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          condition?: 'above' | 'below' | 'crosses'
          target_price?: number
          is_active?: boolean
          triggered_at?: string | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          widget_layout: Record<string, unknown>
          notification_preferences: Record<string, unknown>
          trading_settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          widget_layout?: Record<string, unknown>
          notification_preferences?: Record<string, unknown>
          trading_settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          widget_layout?: Record<string, unknown>
          notification_preferences?: Record<string, unknown>
          trading_settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          avatar_url: string | null
          timezone: string
          trading_goal: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          trading_goal?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          trading_goal?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
