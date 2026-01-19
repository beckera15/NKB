'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Goal = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setGoals(data || [])
    }
    setLoading(false)
  }, [])

  const createGoal = async (goal: GoalInsert) => {
    const { data, error } = await supabase
      .from('goals')
      .insert(goal)
      .select()
      .single()

    if (error) throw error
    setGoals(prev => [data, ...prev])
    return data
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setGoals(prev => prev.map(g => g.id === id ? data : g))
    return data
  }

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw error
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchGoals()

    const channel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals' },
        (payload: RealtimePostgresChangesPayload<Goal>) => {
          if (payload.eventType === 'INSERT') {
            const newGoal = payload.new as Goal
            setGoals(prev => {
              if (prev.some(g => g.id === newGoal.id)) return prev
              return [newGoal, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedGoal = payload.new as Goal
            setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g))
          } else if (payload.eventType === 'DELETE') {
            const deletedGoal = payload.old as Goal
            setGoals(prev => prev.filter(g => g.id !== deletedGoal.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchGoals])

  const groupedByTimeframe = {
    daily: goals.filter(g => g.timeframe === 'daily'),
    weekly: goals.filter(g => g.timeframe === 'weekly'),
    monthly: goals.filter(g => g.timeframe === 'monthly'),
    quarterly: goals.filter(g => g.timeframe === 'quarterly'),
    yearly: goals.filter(g => g.timeframe === 'yearly'),
  }

  return {
    goals,
    loading,
    error,
    groupedByTimeframe,
    createGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  }
}
