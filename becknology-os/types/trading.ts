// Trading Types for Nova AI Coach

export interface Trade {
  id: string
  user_id: string
  session_id: string
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
  setup_type: string | null // e.g., 'order_block', 'fvg_fill', 'liquidity_sweep'
  kill_zone: string | null
  followed_rules: boolean
  rule_violations: string[] | null
  created_at: string
  updated_at: string
}

export interface TradeInsert {
  user_id?: string
  session_id: string
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
}

export interface TradingSession {
  id: string
  user_id: string
  date: string
  status: 'pending' | 'active' | 'completed'
  pre_session_completed: boolean
  pre_session_checklist: Record<string, boolean> | null
  daily_bias: 'bullish' | 'bearish' | 'neutral' | null
  key_levels: Record<string, number> | null
  notes: string | null
  total_trades: number
  winning_trades: number
  losing_trades: number
  total_pnl: number
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export interface TradingSessionInsert {
  user_id?: string
  date: string
  status?: 'pending' | 'active' | 'completed'
  pre_session_completed?: boolean
  pre_session_checklist?: Record<string, boolean> | null
  daily_bias?: 'bullish' | 'bearish' | 'neutral' | null
  key_levels?: Record<string, number> | null
  notes?: string | null
  total_trades?: number
  winning_trades?: number
  losing_trades?: number
  total_pnl?: number
  started_at?: string | null
  ended_at?: string | null
}

export interface NovaConversation {
  id: string
  user_id: string
  session_id: string | null
  role: 'user' | 'assistant'
  content: string
  context_type: 'general' | 'pre_session' | 'trade_analysis' | 'post_session' | 'rule_check'
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface NovaConversationInsert {
  user_id?: string
  session_id?: string | null
  role: 'user' | 'assistant'
  content: string
  context_type: 'general' | 'pre_session' | 'trade_analysis' | 'post_session' | 'rule_check'
  metadata?: Record<string, unknown> | null
}

export interface TradingStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnL: number
  profitFactor: number
  progressToGoal: number // percentage toward $170K
  goalAmount: number
  // Deprecated fields - kept for compatibility but not displayed
  averageWin?: number
  averageLoss?: number
  largestWin?: number
  largestLoss?: number
  currentStreak?: number
  streakType?: 'winning' | 'losing' | 'none'
}

export interface RuleCheckResult {
  passed: boolean
  rule: string
  message: string
  canOverride: boolean
}

export interface TradeSetup {
  symbol: string
  direction: 'long' | 'short'
  entryPrice: number
  stopLoss: number
  takeProfit: number
  positionSize: number
  riskAmount: number
  setupType: string
  reasoning: string
}
