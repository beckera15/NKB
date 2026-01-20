'use client'

import { useState } from 'react'
import { Bell, AlertTriangle, CheckCircle, Info, X, ChevronRight, Clock } from 'lucide-react'
import { Badge } from '@/components/shared/Badge'

export interface Notification {
  id: string
  type: 'alert' | 'success' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  category: 'trading' | 'tcas' | 'fitness' | 'family' | 'wealth' | 'system'
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
  onAction?: (notification: Notification) => void
}

const typeConfig = {
  alert: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
}

const categoryLabels: Record<Notification['category'], string> = {
  trading: 'Trading',
  tcas: 'TCAS',
  fitness: 'Fitness',
  family: 'Family',
  wealth: 'Wealth',
  system: 'System',
}

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onDismiss,
  onAction,
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications

  const unreadCount = notifications.filter((n) => !n.read).length

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-10 bottom-0 w-80 bg-gray-900 border-l border-gray-800 z-40 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-purple-400" />
            <h2 className="font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="purple" size="sm">
                {unreadCount}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bell size={40} className="mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredNotifications.map((notification) => {
              const config = typeConfig[notification.type]
              const Icon = config.icon

              return (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${config.bg} ${config.border} ${
                    !notification.read ? 'ring-1 ring-purple-500/30' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) onMarkAsRead(notification.id)
                    if (onAction) onAction(notification)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${config.bg}`}>
                      <Icon size={16} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm truncate">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" size="sm">
                            {categoryLabels[notification.category]}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={10} />
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDismiss(notification.id)
                          }}
                          className="p-1 text-gray-500 hover:text-gray-300 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-800">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            View all notifications
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// Hook for managing notifications
export function useNotificationState() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
    return newNotification.id
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return {
    notifications,
    addNotification,
    markAsRead,
    dismissNotification,
    clearAll,
    unreadCount: notifications.filter((n) => !n.read).length,
  }
}
