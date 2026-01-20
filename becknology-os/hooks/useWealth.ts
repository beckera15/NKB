'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from './useAuth'
import type {
  WealthAccount,
  WealthTransaction,
  WealthGoal,
  IncomeStream,
  WealthStats,
} from '@/types/wealth'

// Create untyped client for new tables not yet in schema
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseUntyped = createClient(supabaseUrl, supabaseAnonKey)

interface UseWealthReturn {
  // Data
  accounts: WealthAccount[]
  transactions: WealthTransaction[]
  goals: WealthGoal[]
  incomeStreams: IncomeStream[]
  stats: WealthStats

  // Loading/Error states
  loading: boolean
  error: string | null

  // Account CRUD
  createAccount: (account: Omit<WealthAccount, 'id' | 'user_id' | 'created_at'>) => Promise<WealthAccount | null>
  updateAccount: (id: string, updates: Partial<WealthAccount>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>

  // Transaction CRUD
  createTransaction: (transaction: Omit<WealthTransaction, 'id' | 'created_at'>) => Promise<WealthTransaction | null>
  deleteTransaction: (id: string) => Promise<void>

  // Goal CRUD
  createGoal: (goal: Omit<WealthGoal, 'id' | 'user_id' | 'created_at'>) => Promise<WealthGoal | null>
  updateGoal: (id: string, updates: Partial<WealthGoal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>

  // Income Stream CRUD
  createIncomeStream: (stream: Omit<IncomeStream, 'id' | 'user_id' | 'created_at'>) => Promise<IncomeStream | null>
  updateIncomeStream: (id: string, updates: Partial<IncomeStream>) => Promise<void>
  deleteIncomeStream: (id: string) => Promise<void>

  // Refresh
  refresh: () => Promise<void>
}

export function useWealth(): UseWealthReturn {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<WealthAccount[]>([])
  const [transactions, setTransactions] = useState<WealthTransaction[]>([])
  const [goals, setGoals] = useState<WealthGoal[]>([])
  const [incomeStreams, setIncomeStreams] = useState<IncomeStream[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate stats from data
  const stats = useMemo<WealthStats>(() => {
    const assets = accounts.filter(a => !a.is_debt)
    const debts = accounts.filter(a => a.is_debt)

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0)
    const totalDebts = debts.reduce((sum, a) => sum + Math.abs(a.balance), 0)
    const netWorth = totalAssets - totalDebts

    // Calculate monthly income from active streams
    const monthlyIncome = incomeStreams
      .filter(s => s.is_active)
      .reduce((sum, s) => {
        switch (s.frequency) {
          case 'weekly': return sum + (s.amount * 52 / 12)
          case 'biweekly': return sum + (s.amount * 26 / 12)
          case 'monthly': return sum + s.amount
          case 'quarterly': return sum + (s.amount / 3)
          case 'annually': return sum + (s.amount / 12)
          case 'variable': return sum + s.amount // Assume monthly for variable
          default: return sum
        }
      }, 0)

    // Calculate monthly expenses from transactions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentExpenses = transactions.filter(
      t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo
    )
    const monthlyExpenses = recentExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Calculate savings rate
    const savingsRate = monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0

    // Calculate debt-to-income ratio
    const debtToIncome = monthlyIncome > 0
      ? (totalDebts / (monthlyIncome * 12)) * 100
      : 0

    // Liquid assets (checking, savings, crypto)
    const liquidAssets = assets
      .filter(a => ['checking', 'savings', 'crypto'].includes(a.type))
      .reduce((sum, a) => sum + a.balance, 0)

    return {
      netWorth,
      totalAssets,
      totalDebts,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      debtToIncome,
      liquidAssets,
    }
  }, [accounts, transactions, incomeStreams])

  // Fetch all wealth data
  const fetchWealthData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [accountsRes, transactionsRes, goalsRes, streamsRes] = await Promise.all([
        supabaseUntyped
          .from('wealth_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('type', { ascending: true }),
        supabaseUntyped
          .from('wealth_transactions')
          .select('*')
          .order('date', { ascending: false })
          .limit(100),
        supabaseUntyped
          .from('wealth_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('priority', { ascending: true }),
        supabaseUntyped
          .from('income_streams')
          .select('*')
          .eq('user_id', user.id)
          .order('amount', { ascending: false }),
      ])

      if (accountsRes.error) throw accountsRes.error
      if (transactionsRes.error) throw transactionsRes.error
      if (goalsRes.error) throw goalsRes.error
      if (streamsRes.error) throw streamsRes.error

      setAccounts(accountsRes.data || [])
      setTransactions(transactionsRes.data || [])
      setGoals(goalsRes.data || [])
      setIncomeStreams(streamsRes.data || [])
    } catch (err) {
      console.error('Error fetching wealth data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch wealth data')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial fetch
  useEffect(() => {
    fetchWealthData()
  }, [fetchWealthData])

  // Account CRUD
  const createAccount = useCallback(async (
    account: Omit<WealthAccount, 'id' | 'user_id' | 'created_at'>
  ): Promise<WealthAccount | null> => {
    if (!user) return null

    try {
      const { data, error } = await supabaseUntyped
        .from('wealth_accounts')
        .insert([{ ...account, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setAccounts(prev => [...prev, data as WealthAccount])
      return data as WealthAccount
    } catch (err) {
      console.error('Error creating account:', err)
      setError(err instanceof Error ? err.message : 'Failed to create account')
      return null
    }
  }, [user])

  const updateAccount = useCallback(async (id: string, updates: Partial<WealthAccount>) => {
    try {
      const { error } = await supabaseUntyped
        .from('wealth_accounts')
        .update({ ...updates, last_updated: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
    } catch (err) {
      console.error('Error updating account:', err)
      setError(err instanceof Error ? err.message : 'Failed to update account')
    }
  }, [])

  const deleteAccount = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseUntyped
        .from('wealth_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error
      setAccounts(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error deleting account:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    }
  }, [])

  // Transaction CRUD
  const createTransaction = useCallback(async (
    transaction: Omit<WealthTransaction, 'id' | 'created_at'>
  ): Promise<WealthTransaction | null> => {
    try {
      const { data, error } = await supabaseUntyped
        .from('wealth_transactions')
        .insert([transaction])
        .select()
        .single()

      if (error) throw error
      setTransactions(prev => [data as WealthTransaction, ...prev])
      return data as WealthTransaction
    } catch (err) {
      console.error('Error creating transaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
      return null
    }
  }, [])

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseUntyped
        .from('wealth_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Error deleting transaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete transaction')
    }
  }, [])

  // Goal CRUD
  const createGoal = useCallback(async (
    goal: Omit<WealthGoal, 'id' | 'user_id' | 'created_at'>
  ): Promise<WealthGoal | null> => {
    if (!user) return null

    try {
      const { data, error } = await supabaseUntyped
        .from('wealth_goals')
        .insert([{ ...goal, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setGoals(prev => [...prev, data as WealthGoal])
      return data as WealthGoal
    } catch (err) {
      console.error('Error creating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create goal')
      return null
    }
  }, [user])

  const updateGoal = useCallback(async (id: string, updates: Partial<WealthGoal>) => {
    try {
      const { error } = await supabaseUntyped
        .from('wealth_goals')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
    } catch (err) {
      console.error('Error updating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to update goal')
    }
  }, [])

  const deleteGoal = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseUntyped
        .from('wealth_goals')
        .delete()
        .eq('id', id)

      if (error) throw error
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      console.error('Error deleting goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
    }
  }, [])

  // Income Stream CRUD
  const createIncomeStream = useCallback(async (
    stream: Omit<IncomeStream, 'id' | 'user_id' | 'created_at'>
  ): Promise<IncomeStream | null> => {
    if (!user) return null

    try {
      const { data, error } = await supabaseUntyped
        .from('income_streams')
        .insert([{ ...stream, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setIncomeStreams(prev => [...prev, data as IncomeStream])
      return data as IncomeStream
    } catch (err) {
      console.error('Error creating income stream:', err)
      setError(err instanceof Error ? err.message : 'Failed to create income stream')
      return null
    }
  }, [user])

  const updateIncomeStream = useCallback(async (id: string, updates: Partial<IncomeStream>) => {
    try {
      const { error } = await supabaseUntyped
        .from('income_streams')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      setIncomeStreams(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    } catch (err) {
      console.error('Error updating income stream:', err)
      setError(err instanceof Error ? err.message : 'Failed to update income stream')
    }
  }, [])

  const deleteIncomeStream = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseUntyped
        .from('income_streams')
        .delete()
        .eq('id', id)

      if (error) throw error
      setIncomeStreams(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Error deleting income stream:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete income stream')
    }
  }, [])

  return {
    accounts,
    transactions,
    goals,
    incomeStreams,
    stats,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    createTransaction,
    deleteTransaction,
    createGoal,
    updateGoal,
    deleteGoal,
    createIncomeStream,
    updateIncomeStream,
    deleteIncomeStream,
    refresh: fetchWealthData,
  }
}
