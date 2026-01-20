'use client'

import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Brain,
  Wallet,
  Dumbbell,
  Users,
  FolderKanban,
  Target,
  Settings,
  Plus,
  LogOut,
  Sparkles,
  Command,
} from 'lucide-react'
import { WarRoomView, getShortcutKey } from '@/lib/keyboard-shortcuts'

interface WarRoomSidebarProps {
  currentView: WarRoomView
  onViewChange: (view: WarRoomView) => void
  onCapture: () => void
  onLogout: () => void
}

interface NavItem {
  id: WarRoomView
  label: string
  icon: React.ComponentType<{ size?: number | string }>
  shortcut: string
  badge?: string
  gradient?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'warroom', label: 'War Room', icon: LayoutDashboard, shortcut: 'h', gradient: true },
  { id: 'trading', label: 'Trading', icon: TrendingUp, shortcut: 't', badge: 'NOVA' },
  { id: 'tcas', label: 'TCAS Command', icon: Building2, shortcut: 'c' },
  { id: 'intelligence', label: 'Intelligence', icon: Brain, shortcut: 'i' },
  { id: 'wealth', label: 'Wealth', icon: Wallet, shortcut: 'w' },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, shortcut: 'f' },
  { id: 'family', label: 'Family', icon: Users, shortcut: 'a' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, shortcut: 'p' },
  { id: 'goals', label: 'Goals', icon: Target, shortcut: 'g' },
  { id: 'settings', label: 'Settings', icon: Settings, shortcut: 's' },
]

export function WarRoomSidebar({
  currentView,
  onViewChange,
  onCapture,
  onLogout,
}: WarRoomSidebarProps) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          WAR ROOM
        </h1>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <Sparkles size={12} className="text-purple-400" />
          Becknology Command Center
        </p>
      </div>

      {/* Quick Capture Button */}
      <div className="p-4">
        <button
          onClick={onCapture}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus size={18} />
          Quick Capture
          <span className="ml-auto text-xs bg-white/20 px-1.5 py-0.5 rounded">Q</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                  isActive
                    ? item.gradient
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30'
                      : 'bg-purple-600/20 text-purple-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <span className={isActive && item.gradient ? 'text-purple-400' : ''}>
                  <Icon size={18} />
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 px-1.5 py-0.5 rounded text-white">
                    {item.badge}
                  </span>
                )}
                <span className="text-xs text-gray-600 group-hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {getShortcutKey(item.shortcut)}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Nova Status (mini) */}
      <div className="mx-4 mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium text-white">Nova Online</span>
        </div>
        <p className="text-xs text-gray-400">Ready when you are, tiger.</p>
        <button
          onClick={() => onViewChange('trading')}
          className="mt-2 w-full text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-1"
        >
          <Command size={12} />
          Press N to chat
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
