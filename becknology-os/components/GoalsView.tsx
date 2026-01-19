'use client'

import { useState } from 'react'
import { Target, Calendar, Plus, X } from 'lucide-react'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']

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
  onCreateGoal: (goal: GoalInsert) => Promise<Goal>
}

const TIMEFRAMES = [
  { id: 'weekly', label: 'Weekly', color: 'blue' },
  { id: 'monthly', label: 'Monthly', color: 'purple' },
  { id: 'quarterly', label: 'Quarterly', color: 'orange' },
  { id: 'yearly', label: 'Yearly', color: 'pink' },
  { id: '2026-2028', label: '2026-2028', color: 'cyan' },
] as const

const PROJECTS = [
  'TCAS',
  'Trading',
  'Becknology',
  'NKB PR',
  'Nikki GF Content',
  'Property/Home',
  'Family',
  'Wealth Building',
]

export function GoalsView({ goals, groupedByTimeframe, selectedProject, onUpdateGoal, onCreateGoal }: GoalsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false)

  const filterByProject = (goals: Goal[]) => {
    if (!selectedProject) return goals
    return goals.filter(g => g.project === selectedProject)
  }

  // Extended grouping to include 2026-2028
  const extendedGrouped = {
    ...groupedByTimeframe,
    '2026-2028': goals.filter(g => g.timeframe === '2026-2028'),
  }

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Target className="text-purple-400" />
          Goals
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-all"
        >
          <Plus size={18} />
          Add Goal
        </button>
      </div>

      {TIMEFRAMES.map(timeframe => {
        const timeframeGoals = filterByProject(
          timeframe.id === '2026-2028'
            ? extendedGrouped['2026-2028']
            : groupedByTimeframe[timeframe.id as keyof typeof groupedByTimeframe] || []
        )
        if (timeframeGoals.length === 0) return null

        return (
          <div key={timeframe.id} className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                timeframe.color === 'blue' ? 'bg-blue-500' :
                timeframe.color === 'purple' ? 'bg-purple-500' :
                timeframe.color === 'orange' ? 'bg-orange-500' :
                timeframe.color === 'pink' ? 'bg-pink-500' :
                'bg-cyan-500'
              }`} />
              {timeframe.label}
            </h2>

            <div className="space-y-3">
              {timeframeGoals.map(goal => (
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

      {TIMEFRAMES.every(tf => {
        const goals = tf.id === '2026-2028'
          ? extendedGrouped['2026-2028']
          : groupedByTimeframe[tf.id as keyof typeof groupedByTimeframe] || []
        return filterByProject(goals).length === 0
      }) && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Target size={48} className="mb-4 opacity-50" />
          <p>No goals yet</p>
          <p className="text-sm">Create your first goal to get started</p>
        </div>
      )}

      {showAddModal && (
        <AddGoalModal
          onClose={() => setShowAddModal(false)}
          onSubmit={onCreateGoal}
        />
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

function AddGoalModal({
  onClose,
  onSubmit
}: {
  onClose: () => void
  onSubmit: (goal: GoalInsert) => Promise<Goal>
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [project, setProject] = useState('')
  const [timeframe, setTimeframe] = useState('monthly')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title,
        description: description || null,
        project: project || null,
        timeframe,
        due_date: dueDate || null,
        progress: 0,
        status: 'in-progress',
      })
      onClose()
    } catch (error) {
      console.error('Failed to create goal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">Add New Goal</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this goal..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase mb-2 block">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              >
                {TIMEFRAMES.map(tf => (
                  <option key={tf.id} value={tf.id}>{tf.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase mb-2 block">Project</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">No Project</option>
                {PROJECTS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
