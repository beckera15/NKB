'use client'

import {
  Brain,
  FileText,
  FolderOpen,
  Target,
  Inbox,
  Zap,
  AlertCircle,
  CheckSquare,
  Plus,
  LogOut
} from 'lucide-react'
import { PROJECTS } from '@/lib/constants'

type View = 'intelligence' | 'entries' | 'library' | 'goals'

interface Stats {
  inbox: number
  action: number
  decisions: number
  critical: number
}

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
  selectedProject: string | null
  onProjectChange: (project: string | null) => void
  stats: Stats
  onCapture: () => void
  onLogout: () => void
}

const NAV_ITEMS = [
  { id: 'intelligence' as View, label: 'Intelligence', icon: Brain },
  { id: 'entries' as View, label: 'All Entries', icon: FileText },
  { id: 'library' as View, label: 'Library', icon: FolderOpen },
  { id: 'goals' as View, label: 'Goals', icon: Target },
]

export function Sidebar({
  currentView,
  onViewChange,
  selectedProject,
  onProjectChange,
  stats,
  onCapture,
  onLogout
}: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          BECKNOLOGY
        </h1>
        <p className="text-xs text-gray-500 mt-1">Where Markets Meet Machines</p>
      </div>

      {/* Capture Button */}
      <div className="p-4">
        <button
          onClick={onCapture}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-all"
        >
          <Plus size={18} />
          Capture
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Inbox" value={stats.inbox} icon={Inbox} />
          <StatCard label="Action" value={stats.action} icon={Zap} color="yellow" />
          <StatCard label="Decisions" value={stats.decisions} icon={CheckSquare} color="blue" />
          <StatCard label="Critical" value={stats.critical} icon={AlertCircle} color="red" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-2 pb-4 border-b border-gray-800">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              currentView === item.id
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Projects
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onProjectChange(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              selectedProject === null
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            All Projects
          </button>
          {PROJECTS.map((project) => (
            <button
              key={project}
              onClick={() => onProjectChange(project)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedProject === project
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {project}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
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

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'purple'
}: {
  label: string
  value: number
  icon: React.ComponentType<{ size?: number | string }>
  color?: 'purple' | 'yellow' | 'blue' | 'red'
}) {
  const colors = {
    purple: 'text-purple-400 bg-purple-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    red: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className={`p-3 rounded-lg ${colors[color]}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
