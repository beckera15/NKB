'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  Workout,
  WorkoutInsert,
  Supplement,
  SupplementLog,
  MorningRoutine,
  HealthMetric,
  FitnessStats,
} from '@/types/fitness'
import { DEFAULT_MORNING_ROUTINE } from '@/types/fitness'

export function useFitness() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([])
  const [morningRoutines, setMorningRoutines] = useState<MorningRoutine[]>([])
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all fitness data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // These will fail gracefully if tables don't exist yet
      const [workoutsRes, supplementsRes, routinesRes, metricsRes] = await Promise.allSettled([
        supabase.from('workouts').select('*').order('date', { ascending: false }).limit(30),
        supabase.from('supplements').select('*').eq('active', true),
        supabase.from('morning_routines').select('*').order('date', { ascending: false }).limit(30),
        supabase.from('health_metrics').select('*').order('date', { ascending: false }).limit(100),
      ])

      if (workoutsRes.status === 'fulfilled' && workoutsRes.value.data) {
        setWorkouts(workoutsRes.value.data as Workout[])
      }
      if (supplementsRes.status === 'fulfilled' && supplementsRes.value.data) {
        setSupplements(supplementsRes.value.data as Supplement[])
      }
      if (routinesRes.status === 'fulfilled' && routinesRes.value.data) {
        setMorningRoutines(routinesRes.value.data as MorningRoutine[])
      }
      if (metricsRes.status === 'fulfilled' && metricsRes.value.data) {
        setHealthMetrics(metricsRes.value.data as HealthMetric[])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fitness data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Workout functions
  const logWorkout = useCallback(async (workout: WorkoutInsert): Promise<Workout> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('workouts')
      .insert(workout)
      .select()
      .single()

    if (error) throw error
    const newWorkout = data as Workout
    setWorkouts((prev) => [newWorkout, ...prev])
    return newWorkout
  }, [])

  const updateWorkout = useCallback(async (id: string, updates: Partial<Workout>): Promise<Workout> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('workouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    const updatedWorkout = data as Workout
    setWorkouts((prev) => prev.map((w) => (w.id === id ? updatedWorkout : w)))
    return updatedWorkout
  }, [])

  // Supplement functions
  const logSupplementTaken = useCallback(async (supplementId: string, notes?: string): Promise<SupplementLog> => {
    const log = {
      supplement_id: supplementId,
      taken_at: new Date().toISOString(),
      notes: notes || null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('supplement_logs')
      .insert(log)
      .select()
      .single()

    if (error) throw error
    const newLog = data as SupplementLog
    setSupplementLogs((prev) => [newLog, ...prev])
    return newLog
  }, [])

  // Morning routine functions
  const logMorningRoutine = useCallback(
    async (
      itemsCompleted: Record<string, boolean>,
      wakeTime: string,
      moodRating: 1 | 2 | 3 | 4 | 5,
      notes?: string
    ): Promise<MorningRoutine> => {
      const routine = {
        date: new Date().toISOString().split('T')[0],
        wake_time: wakeTime,
        items_completed: itemsCompleted,
        mood_rating: moodRating,
        notes: notes || null,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('morning_routines')
        .insert(routine)
        .select()
        .single()

      if (error) throw error
      const newRoutine = data as MorningRoutine
      setMorningRoutines((prev) => [newRoutine, ...prev])
      return newRoutine
    },
    []
  )

  // Health metric functions
  const logHealthMetric = useCallback(
    async (
      type: HealthMetric['type'],
      value: number,
      secondaryValue?: number,
      notes?: string
    ): Promise<HealthMetric> => {
      const metric = {
        date: new Date().toISOString().split('T')[0],
        type,
        value,
        secondary_value: secondaryValue,
        notes: notes || null,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('health_metrics')
        .insert(metric)
        .select()
        .single()

      if (error) throw error
      const newMetric = data as HealthMetric
      setHealthMetrics((prev) => [newMetric, ...prev])
      return newMetric
    },
    []
  )

  // Calculate stats
  const stats: FitnessStats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const today = now.toISOString().split('T')[0]

    const workoutsThisWeek = workouts.filter((w) => new Date(w.date) >= weekAgo).length
    const workoutsThisMonth = workouts.filter((w) => new Date(w.date) >= monthAgo).length

    // Calculate streak
    let streak = 0
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let checkDate = new Date(today)

    for (const workout of sortedWorkouts) {
      const workoutDate = workout.date
      const checkDateStr = checkDate.toISOString().split('T')[0]

      if (workoutDate === checkDateStr) {
        streak++
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
      } else if (new Date(workoutDate) < checkDate) {
        break
      }
    }

    // Today's supplements
    const todayLogs = supplementLogs.filter((l) => l.taken_at.startsWith(today))

    // Morning routine
    const todayRoutine = morningRoutines.find((r) => r.date === today)
    const morningRoutineComplete = todayRoutine
      ? Object.values(todayRoutine.items_completed).filter(Boolean).length >=
        DEFAULT_MORNING_ROUTINE.length * 0.8
      : false

    // Average energy
    const recentWorkouts = workouts.slice(0, 10)
    const avgEnergy =
      recentWorkouts.length > 0
        ? recentWorkouts.reduce((sum, w) => sum + (w.energy_level || 3), 0) / recentWorkouts.length
        : 3

    return {
      workoutsThisWeek,
      workoutsThisMonth,
      currentStreak: streak,
      supplementsToday: todayLogs.length,
      supplementsTotal: supplements.length,
      morningRoutineComplete,
      averageEnergyLevel: avgEnergy,
    }
  }, [workouts, supplementLogs, supplements, morningRoutines])

  // Get today's data
  const today = new Date().toISOString().split('T')[0]
  const todayWorkout = workouts.find((w) => w.date === today)
  const todayRoutine = morningRoutines.find((r) => r.date === today)
  const todaySupplementsTaken = supplementLogs.filter((l) => l.taken_at.startsWith(today))

  return {
    // Data
    workouts,
    supplements,
    supplementLogs,
    morningRoutines,
    healthMetrics,
    loading,
    error,
    stats,

    // Today's data
    todayWorkout,
    todayRoutine,
    todaySupplementsTaken,

    // Actions
    logWorkout,
    updateWorkout,
    logSupplementTaken,
    logMorningRoutine,
    logHealthMetric,
    refetch: fetchData,
  }
}
