'use client'

import { ReactNode, useState, useCallback } from 'react'
import { MarketTicker, TickerSymbol } from './MarketTicker'
import { NotificationPanel, useNotificationState } from './NotificationPanel'
import { WarRoomSidebar } from './WarRoomSidebar'
import { HelpModal } from './HelpModal'
import { useKeyboardShortcuts, WarRoomView } from '@/lib/keyboard-shortcuts'
import { Bell } from 'lucide-react'

interface WarRoomLayoutProps {
  children: ReactNode
  currentView: WarRoomView
  onViewChange: (view: WarRoomView) => void
  onCapture: () => void
  onLogout: () => void
}

export function WarRoomLayout({
  children,
  currentView,
  onViewChange,
  onCapture,
  onLogout,
}: WarRoomLayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showNovaChat, setShowNovaChat] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const {
    notifications,
    markAsRead,
    dismissNotification,
    unreadCount,
  } = useNotificationState()

  const handleSymbolClick = useCallback((symbol: TickerSymbol) => {
    console.log('Symbol clicked:', symbol)
    // TODO: Open mini-chart modal
  }, [])

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onViewChange,
    onSearch: () => setShowSearch(true),
    onHelp: () => setShowHelp(true),
    onNovaChat: () => setShowNovaChat(!showNovaChat),
    onCapture,
    enabled: true,
  })

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Market Ticker - Top */}
      <MarketTicker onSymbolClick={handleSymbolClick} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Left */}
        <WarRoomSidebar
          currentView={currentView}
          onViewChange={onViewChange}
          onCapture={onCapture}
          onLogout={onLogout}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative">
          {/* Notification toggle button */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="absolute top-4 right-4 z-30 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Bell size={20} className="text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {children}
        </main>

        {/* Notification Panel - Right */}
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onDismiss={dismissNotification}
        />
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  )
}
