'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from './useAuth'

// Create untyped client for notifications table
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseUntyped = createClient(supabaseUrl, supabaseAnonKey)

export interface Notification {
  id: string
  user_id: string
  type: 'alert' | 'success' | 'warning' | 'info'
  title: string
  message: string
  category: 'trading' | 'tcas' | 'fitness' | 'family' | 'wealth' | 'system'
  action_url: string | null
  read: boolean
  created_at: string
}

export interface PriceAlert {
  id: string
  user_id: string
  symbol: string
  condition: 'above' | 'below' | 'crosses'
  target_price: number
  is_active: boolean
  triggered_at: string | null
  created_at: string
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null

  // Actions
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  createNotification: (notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at'>) => Promise<void>

  // Price Alerts
  priceAlerts: PriceAlert[]
  createPriceAlert: (alert: Omit<PriceAlert, 'id' | 'user_id' | 'is_active' | 'triggered_at' | 'created_at'>) => Promise<void>
  deletePriceAlert: (id: string) => Promise<void>
  togglePriceAlert: (id: string, isActive: boolean) => Promise<void>

  refresh: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const [notifRes, alertsRes] = await Promise.all([
        supabaseUntyped
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabaseUntyped
          .from('price_alerts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (notifRes.error) throw notifRes.error
      if (alertsRes.error) throw alertsRes.error

      setNotifications((notifRes.data as Notification[]) || [])
      setPriceAlerts((alertsRes.data as PriceAlert[]) || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchNotifications()

    if (!user) return

    // Subscribe to new notifications
    const channel = supabaseUntyped
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabaseUntyped.removeChannel(channel)
    }
  }, [user, fetchNotifications])

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseUntyped
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const { error } = await supabaseUntyped
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }, [user])

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseUntyped
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }, [])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!user) return

    try {
      const { error } = await supabaseUntyped
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      setNotifications([])
    } catch (err) {
      console.error('Error clearing notifications:', err)
    }
  }, [user])

  // Create notification
  const createNotification = useCallback(
    async (notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at'>) => {
      if (!user) return

      try {
        const { data, error } = await supabaseUntyped
          .from('notifications')
          .insert([{ ...notification, user_id: user.id, read: false }])
          .select()
          .single()

        if (error) throw error
        setNotifications((prev) => [data as Notification, ...prev])
      } catch (err) {
        console.error('Error creating notification:', err)
      }
    },
    [user]
  )

  // Price alert CRUD
  const createPriceAlert = useCallback(
    async (alert: Omit<PriceAlert, 'id' | 'user_id' | 'is_active' | 'triggered_at' | 'created_at'>) => {
      if (!user) return

      try {
        const { data, error } = await supabaseUntyped
          .from('price_alerts')
          .insert([{ ...alert, user_id: user.id, is_active: true }])
          .select()
          .single()

        if (error) throw error
        setPriceAlerts((prev) => [data as PriceAlert, ...prev])
      } catch (err) {
        console.error('Error creating price alert:', err)
      }
    },
    [user]
  )

  const deletePriceAlert = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseUntyped
        .from('price_alerts')
        .delete()
        .eq('id', id)

      if (error) throw error
      setPriceAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Error deleting price alert:', err)
    }
  }, [])

  const togglePriceAlert = useCallback(async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabaseUntyped
        .from('price_alerts')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error
      setPriceAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: isActive } : a))
      )
    } catch (err) {
      console.error('Error toggling price alert:', err)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    createNotification,
    priceAlerts,
    createPriceAlert,
    deletePriceAlert,
    togglePriceAlert,
    refresh: fetchNotifications,
  }
}
