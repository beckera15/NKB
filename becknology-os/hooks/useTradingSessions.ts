'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { TradingSession, TradingSessionInsert } from '@/types/trading'

export function useTradingSessions() {
  const [sessions, setSessions] = useState<TradingSession[]>([])
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)

      if (error) throw error
      setSessions((data as TradingSession[]) || [])

      // Check for today's session
      const today = new Date().toISOString().split('T')[0]
      const todaySession = (data as TradingSession[])?.find((s) => s.date === today)
      setCurrentSession(todaySession || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const createSession = useCallback(async (session: TradingSessionInsert): Promise<TradingSession> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('trading_sessions')
      .insert(session)
      .select()
      .single()

    if (error) throw error
    const newSession = data as TradingSession
    setSessions((prev) => [newSession, ...prev])
    setCurrentSession(newSession)
    return newSession
  }, [])

  const updateSession = useCallback(async (id: string, updates: Partial<TradingSession>): Promise<TradingSession> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('trading_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    const updatedSession = data as TradingSession
    setSessions((prev) => prev.map((s) => (s.id === id ? updatedSession : s)))
    if (currentSession?.id === id) {
      setCurrentSession(updatedSession)
    }
    return updatedSession
  }, [currentSession])

  const startSession = useCallback(async (): Promise<TradingSession> => {
    const today = new Date().toISOString().split('T')[0]

    // Check if session already exists
    if (currentSession && currentSession.date === today) {
      return updateSession(currentSession.id, {
        status: 'active',
        started_at: new Date().toISOString(),
      })
    }

    // Create new session
    return createSession({
      date: today,
      status: 'active',
      started_at: new Date().toISOString(),
    })
  }, [currentSession, createSession, updateSession])

  const endSession = useCallback(async (): Promise<TradingSession | null> => {
    if (!currentSession) return null

    return updateSession(currentSession.id, {
      status: 'completed',
      ended_at: new Date().toISOString(),
    })
  }, [currentSession, updateSession])

  const completePreSession = useCallback(
    async (checklist: Record<string, boolean>, bias: 'bullish' | 'bearish' | 'neutral', levels: Record<string, number>): Promise<TradingSession | null> => {
      if (!currentSession) {
        // Create session first
        const today = new Date().toISOString().split('T')[0]
        return createSession({
          date: today,
          status: 'pending',
          pre_session_completed: true,
          pre_session_checklist: checklist,
          daily_bias: bias,
          key_levels: levels,
        })
      }

      return updateSession(currentSession.id, {
        pre_session_completed: true,
        pre_session_checklist: checklist,
        daily_bias: bias,
        key_levels: levels,
      })
    },
    [currentSession, createSession, updateSession]
  )

  const getTodayStats = useCallback(() => {
    if (!currentSession) {
      return {
        trades: 0,
        wins: 0,
        losses: 0,
        pnl: 0,
        preSessionComplete: false,
      }
    }

    return {
      trades: currentSession.total_trades,
      wins: currentSession.winning_trades,
      losses: currentSession.losing_trades,
      pnl: currentSession.total_pnl,
      preSessionComplete: currentSession.pre_session_completed,
    }
  }, [currentSession])

  return {
    sessions,
    currentSession,
    loading,
    error,
    createSession,
    updateSession,
    startSession,
    endSession,
    completePreSession,
    getTodayStats,
    refetch: fetchSessions,
  }
}
