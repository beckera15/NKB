'use client'

import { Target, Calendar, TrendingUp } from 'lucide-react'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']

interface GoalsViewProps {
  goals: Goal[]
  groupedByTimeframe: {
    daily: Goal[]
    weekly: Goal[]
    monthly: Goal[]
    quarterly: Goal[]
    yearly: Goal[]
  }
  selectedProject: string | null
  onUpdateGoal: (id: string, updates: Partial<Goal>) => Promise<void>
}

const TIMEFRAMES = [
  { id: 'daily', label: 'Daily', color: 'green' },
  { id: 'weekly', label: 'Weekly', color: 'blue' },
  { id: 'monthly', label: 'Monthly', color: 'purple' },
  { id: 'quarterly', label: 'Quarterly', color: 'orange' },
  { id: 'yearly', label: 'Yearly', color: 'pink' },
] as const

export function GoalsView({ groupedByTimeframe, selectedProject, onUpdateGoal }: GoalsViewProps) {
  const filterByProject = (goals: Goal[]) => {
    if (!selectedProject) return goals
    return goals.filter(g => g.project === selectedProject)
  }

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Target className="text-purple-400" />
          Goals
        </h1>
      </div>

      {TIMEFRAMES.map(timeframe => {
        const goals = filterByProject(groupedByTimeframe[timeframe.id as keyof typeof groupedByTimeframe])
        if (goals.length === 0) return null

        return (
          <div key={timeframe.id} className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full bg-${timeframe.color}-500`} />
              {timeframe.label}
            </h2>

            <div className="space-y-3">
              {goals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={onUpdateGoal}
                />
              ))}
            </div>
          </div>
        )
      })}

      {Object.values(groupedByTimeframe).every(g => filterByProject(g).length === 0) && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Target size={48} className="mb-4 opacity-50" />
          <p>No goals yet</p>
          <p className="text-sm">Create your first goal to get started</p>
        </div>
      )}
    </div>
  )
}

function GoalCard({
  goal,
  onUpdate
}: {
  goal: Goal
  onUpdate: (id: string, updates: Partial<Goal>) => Promise<void>
}) {
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value)
    onUpdate(goal.id, { progress: newProgress })
  }

  const getStatusColor = () => {
    if (goal.status === 'completed') return 'bg-green-500/20 text-green-400'
    if (goal.status === 'blocked') return 'bg-red-500/20 text-red-400'
    return 'bg-purple-500/20 text-purple-400'
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor()}`}>
              {goal.status}
            </span>
            {goal.project && (
              <span className="text-xs text-gray-500">{goal.project}</span>
            )}
          </div>

          <h3 className="font-medium">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-gray-400 mt-1">{goal.description}</p>
          )}

          {goal.due_date && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <Calendar size={12} />
              Due: {new Date(goal.due_date).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-2xl font-bold text-purple-400">{goal.progress}%</span>
        </div>
      </div>

      {/* Progress Slider */}
      <div className="mt-4">
        <div className="relative">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={goal.progress}
            onChange={handleProgressChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}
