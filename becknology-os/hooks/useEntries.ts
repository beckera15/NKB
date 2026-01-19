'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Entry = Database['public']['Tables']['entries']['Row']
type EntryInsert = Database['public']['Tables']['entries']['Insert']

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }, [])

  const createEntry = async (entry: EntryInsert) => {
    const { data, error } = await supabase
      .from('entries')
      .insert(entry)
      .select()
      .single()

    if (error) throw error
    // Real-time will handle the update, but we also update locally for immediate feedback
    setEntries(prev => [data, ...prev])
    return data
  }

  const updateEntry = async (id: string, updates: Partial<Entry>) => {
    const { data, error } = await supabase
      .from('entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setEntries(prev => prev.map(e => e.id === id ? data : e))
    return data
  }

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)

    if (error) throw error
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchEntries()

    const channel = supabase
      .channel('entries-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        (payload: RealtimePostgresChangesPayload<Entry>) => {
          if (payload.eventType === 'INSERT') {
            const newEntry = payload.new as Entry
            setEntries(prev => {
              // Avoid duplicates if we already added it optimistically
              if (prev.some(e => e.id === newEntry.id)) return prev
              return [newEntry, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedEntry = payload.new as Entry
            setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e))
          } else if (payload.eventType === 'DELETE') {
            const deletedEntry = payload.old as Entry
            setEntries(prev => prev.filter(e => e.id !== deletedEntry.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEntries])

  const stats = {
    inbox: entries.filter(e => e.status === 'inbox').length,
    action: entries.filter(e => e.status === 'action').length,
    decisions: entries.filter(e => e.type === 'decision').length,
    critical: entries.filter(e => e.priority === 'critical').length,
  }

  return {
    entries,
    loading,
    error,
    stats,
    createEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries,
  }
}
