'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Insight = Database['public']['Tables']['insights']['Row']
type InsightInsert = Database['public']['Tables']['insights']['Insert']

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setInsights(data || [])
    }
    setLoading(false)
  }, [])

  const createInsight = async (insight: InsightInsert) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('insights')
      .insert(insight)
      .select()
      .single()

    if (error) throw error
    setInsights(prev => [data as Insight, ...prev])
    return data as Insight
  }

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return {
    insights,
    loading,
    error,
    createInsight,
    refetch: fetchInsights,
  }
}
