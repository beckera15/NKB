'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Trade, TradeInsert, TradingStats } from '@/types/trading'

const GOAL_AMOUNT = 170000

export function useTrades(sessionId?: string) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('trades')
        .select('*')
        .order('entry_time', { ascending: false })

      if (sessionId) {
        query = query.eq('session_id', sessionId)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      setTrades((data as Trade[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  const createTrade = useCallback(async (trade: TradeInsert): Promise<Trade> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('trades')
      .insert(trade)
      .select()
      .single()

    if (error) throw error
    const newTrade = data as Trade
    setTrades((prev) => [newTrade, ...prev])
    return newTrade
  }, [])

  const updateTrade = useCallback(async (id: string, updates: Partial<Trade>): Promise<Trade> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('trades')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    const updatedTrade = data as Trade
    setTrades((prev) => prev.map((t) => (t.id === id ? updatedTrade : t)))
    return updatedTrade
  }, [])

  const closeTrade = useCallback(async (id: string, exitPrice: number, notes?: string): Promise<Trade> => {
    const trade = trades.find((t) => t.id === id)
    if (!trade) throw new Error('Trade not found')

    const pnl =
      trade.direction === 'long'
        ? (exitPrice - trade.entry_price) * trade.position_size
        : (trade.entry_price - exitPrice) * trade.position_size

    return updateTrade(id, {
      exit_price: exitPrice,
      exit_time: new Date().toISOString(),
      pnl,
      status: 'closed',
      notes: notes || trade.notes,
    })
  }, [trades, updateTrade])

  const deleteTrade = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('trades').delete().eq('id', id)

    if (error) throw error
    setTrades((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Calculate trading statistics
  const stats: TradingStats = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === 'closed' && t.pnl !== null)
    const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0)
    const losingTrades = closedTrades.filter((t) => (t.pnl || 0) < 0)

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))

    // Calculate current streak
    let currentStreak = 0
    let streakType: 'winning' | 'losing' | 'none' = 'none'

    for (const trade of closedTrades) {
      const isWin = (trade.pnl || 0) > 0
      if (currentStreak === 0) {
        currentStreak = 1
        streakType = isWin ? 'winning' : 'losing'
      } else if ((streakType === 'winning' && isWin) || (streakType === 'losing' && !isWin)) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      totalPnL,
      averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.pnl || 0)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.pnl || 0)) : 0,
      currentStreak,
      streakType,
      progressToGoal: (totalPnL / GOAL_AMOUNT) * 100,
      goalAmount: GOAL_AMOUNT,
    }
  }, [trades])

  // Today's trades
  const todayTrades = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return trades.filter((t) => t.entry_time.startsWith(today))
  }, [trades])

  // Today's stats
  const todayStats = useMemo(() => {
    const closedToday = todayTrades.filter((t) => t.status === 'closed')
    const winsToday = closedToday.filter((t) => (t.pnl || 0) > 0)
    const lossesToday = closedToday.filter((t) => (t.pnl || 0) < 0)

    // Check for consecutive losses
    let consecutiveLosses = 0
    for (const trade of closedToday) {
      if ((trade.pnl || 0) < 0) {
        consecutiveLosses++
      } else {
        consecutiveLosses = 0
      }
    }

    return {
      totalTrades: todayTrades.length,
      closedTrades: closedToday.length,
      openTrades: todayTrades.filter((t) => t.status === 'open').length,
      wins: winsToday.length,
      losses: lossesToday.length,
      pnl: closedToday.reduce((sum, t) => sum + (t.pnl || 0), 0),
      consecutiveLosses,
      canTrade: todayTrades.length < 3, // Max 3 trades rule
      needsCooldown: consecutiveLosses >= 2,
    }
  }, [todayTrades])

  return {
    trades,
    todayTrades,
    loading,
    error,
    stats,
    todayStats,
    createTrade,
    updateTrade,
    closeTrade,
    deleteTrade,
    refetch: fetchTrades,
  }
}
