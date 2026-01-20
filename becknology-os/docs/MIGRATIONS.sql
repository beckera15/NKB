-- Becknology War Room - Database Migrations
-- Run these migrations in order in your Supabase SQL Editor

-- ============================================
-- TRADING TABLES (Phase 2: Nova AI Coach)
-- ============================================

-- Trading Sessions
CREATE TABLE IF NOT EXISTS trading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  pre_session_completed BOOLEAN DEFAULT FALSE,
  pre_session_checklist JSONB,
  daily_bias TEXT CHECK (daily_bias IN ('bullish', 'bearish', 'neutral')),
  key_levels JSONB,
  notes TEXT,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_pnl DECIMAL(12,2) DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES trading_sessions(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price DECIMAL(12,4) NOT NULL,
  exit_price DECIMAL(12,4),
  stop_loss DECIMAL(12,4) NOT NULL,
  take_profit DECIMAL(12,4),
  position_size INTEGER NOT NULL,
  risk_amount DECIMAL(10,2) NOT NULL,
  pnl DECIMAL(10,2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  screenshot_url TEXT,
  notes TEXT,
  setup_type TEXT,
  kill_zone TEXT,
  followed_rules BOOLEAN DEFAULT TRUE,
  rule_violations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nova Conversations
CREATE TABLE IF NOT EXISTS nova_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES trading_sessions(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('general', 'pre_session', 'trade_analysis', 'post_session', 'rule_check')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading Rules (user customizable)
CREATE TABLE IF NOT EXISTS trading_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enforcement TEXT DEFAULT 'warn' CHECK (enforcement IN ('block', 'warn', 'log')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FITNESS TABLES (Phase 3: Health Coach)
-- ============================================

-- Workouts
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('strength', 'cardio', 'flexibility', 'sports', 'other')),
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplements
CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  timing TEXT NOT NULL CHECK (timing IN ('morning', 'afternoon', 'evening', 'with_meals', 'before_bed')),
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'as_needed')),
  purpose TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplement Logs
CREATE TABLE IF NOT EXISTS supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ NOT NULL,
  notes TEXT
);

-- Health Metrics
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weight', 'blood_pressure', 'heart_rate', 'sleep_hours', 'steps', 'body_fat', 'water_intake')),
  value DECIMAL(10,2) NOT NULL,
  secondary_value DECIMAL(10,2), -- for blood pressure (diastolic)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Morning Routines
CREATE TABLE IF NOT EXISTS morning_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  wake_time TIME NOT NULL,
  items_completed JSONB NOT NULL DEFAULT '{}',
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TCAS TABLES (Phase 4: 13 AI Agents)
-- ============================================

-- TCAS Customers
CREATE TABLE IF NOT EXISTS tcas_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  industry TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TCAS Quotes
CREATE TABLE IF NOT EXISTS tcas_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES tcas_customers(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TCAS Pipeline
CREATE TABLE IF NOT EXISTS tcas_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES tcas_customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TCAS Agent Conversations
CREATE TABLE IF NOT EXISTS tcas_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEALTH TABLES (Phase 6)
-- ============================================

-- Wealth Accounts
CREATE TABLE IF NOT EXISTS wealth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'investment', 'retirement', 'crypto', 'real_estate', 'other')),
  institution TEXT,
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_debt BOOLEAN DEFAULT FALSE,
  interest_rate DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wealth Transactions
CREATE TABLE IF NOT EXISTS wealth_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES wealth_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wealth Goals
CREATE TABLE IF NOT EXISTS wealth_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(14,2) NOT NULL,
  current_amount DECIMAL(14,2) DEFAULT 0,
  target_date DATE,
  category TEXT CHECK (category IN ('savings', 'debt_payoff', 'investment', 'purchase', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income Streams
CREATE TABLE IF NOT EXISTS income_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('salary', 'business', 'investment', 'rental', 'side_hustle', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'variable')),
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FAMILY & PROPERTY TABLES (Phase 10)
-- ============================================

-- Family Events
CREATE TABLE IF NOT EXISTS family_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  reminder_days INTEGER DEFAULT 1,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Tasks
CREATE TABLE IF NOT EXISTS property_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('maintenance', 'repair', 'improvement', 'cleaning', 'yard', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Property Maintenance Schedule
CREATE TABLE IF NOT EXISTS property_maintenance_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'biannually', 'annually')),
  last_completed DATE,
  next_due DATE,
  estimated_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS & SETTINGS (Phase 12 & 15)
-- ============================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('alert', 'success', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('trading', 'tcas', 'fitness', 'family', 'wealth', 'system')),
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price Alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below', 'crosses')),
  target_price DECIMAL(14,4) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'dark',
  widget_layout JSONB DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}',
  trading_settings JSONB DEFAULT '{"maxTrades": 3, "dailyLossLimit": 500, "cooldownMinutes": 30}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (extended user info)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/Chicago',
  trading_goal DECIMAL(14,2) DEFAULT 170000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcas_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcas_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcas_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wealth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wealth_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wealth_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_maintenance_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only see/modify their own data)
-- Example for trading_sessions (repeat pattern for all tables)
CREATE POLICY "Users can view own trading_sessions" ON trading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trading_sessions" ON trading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trading_sessions" ON trading_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trading_sessions" ON trading_sessions FOR DELETE USING (auth.uid() = user_id);

-- Repeat similar policies for all other tables...
-- (In production, create a script or use Supabase dashboard to set up all policies)

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(session_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
CREATE INDEX IF NOT EXISTS idx_health_metrics_date ON health_metrics(date);
CREATE INDEX IF NOT EXISTS idx_tcas_pipeline_stage ON tcas_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active);

-- ============================================
-- TCAS AGENT ACTIVITY & TASKS (Phase 1.3)
-- ============================================

-- Agent Activity Tracking
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'ready_for_review', 'completed', 'needs_input')),
  output TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  approved BOOLEAN DEFAULT FALSE
);

-- Agent Task Assignment
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  task TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  due_by TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on new tables
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_activity
CREATE POLICY "Users can view own agent_activity" ON agent_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agent_activity" ON agent_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agent_activity" ON agent_activity FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agent_activity" ON agent_activity FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for agent_tasks
CREATE POLICY "Users can view own agent_tasks" ON agent_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agent_tasks" ON agent_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agent_tasks" ON agent_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agent_tasks" ON agent_tasks FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_activity_status ON agent_activity(status);
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent ON agent_activity(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_name);
