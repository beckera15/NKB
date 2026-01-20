// Wealth Types for Financial Tracking

export interface WealthAccount {
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

export interface WealthTransaction {
  id: string
  account_id: string
  date: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  category: string
  description: string | null
  created_at: string
}

export interface WealthGoal {
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

export interface IncomeStream {
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

export interface WealthStats {
  netWorth: number
  totalAssets: number
  totalDebts: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  debtToIncome: number
  liquidAssets: number
}

// Expense categories for budgeting
export const EXPENSE_CATEGORIES = [
  'Housing',
  'Transportation',
  'Food & Dining',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Personal Care',
  'Education',
  'Subscriptions',
  'Travel',
  'Gifts & Donations',
  'Business',
  'Other',
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
