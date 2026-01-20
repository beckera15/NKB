'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/shared'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import {
  Dumbbell,
  Pill,
  Sun,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Flame,
  Heart,
  Droplet,
  Moon,
} from 'lucide-react'
import { useFitness } from '@/hooks/useFitness'
import {
  DEFAULT_MORNING_ROUTINE,
  RECOMMENDED_HEALTH_TESTS,
} from '@/types/fitness'
import { WORKOUT_TEMPLATES, RECOMMENDED_SUPPLEMENTS } from '@/lib/fitness-prompts'

export function FitnessView() {
  const {
    workouts,
    supplements,
    stats,
    todayWorkout,
    todayRoutine,
    todaySupplementsTaken,
    loading,
  } = useFitness()

  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showRoutineModal, setShowRoutineModal] = useState(false)
  const [showSupplementsModal, setShowSupplementsModal] = useState(false)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading Fitness Coach...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Dumbbell className="text-purple-400" />
            Fitness Coach
          </h1>
          <p className="text-gray-400">Your health and performance command center</p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <QuickStatCard
            label="This Week"
            value={stats.workoutsThisWeek}
            subtitle="workouts"
            icon={<Calendar size={18} />}
            color="purple"
          />
          <QuickStatCard
            label="Streak"
            value={stats.currentStreak}
            subtitle="days"
            icon={<Flame size={18} />}
            color="orange"
          />
          <QuickStatCard
            label="Supplements"
            value={`${todaySupplementsTaken.length}/${supplements.length || RECOMMENDED_SUPPLEMENTS.length}`}
            subtitle="today"
            icon={<Pill size={18} />}
            color="green"
          />
          <QuickStatCard
            label="Energy"
            value={stats.averageEnergyLevel.toFixed(1)}
            subtitle="avg level"
            icon={<Activity size={18} />}
            color="yellow"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Today's Focus */}
          <div className="lg:col-span-2 space-y-6">
            {/* Morning Routine Card */}
            <Card variant={stats.morningRoutineComplete ? 'default' : 'glow'}>
              <CardHeader
                title="Morning Routine"
                subtitle={stats.morningRoutineComplete ? 'Completed' : 'In Progress'}
                icon={<Sun size={20} />}
                action={
                  <Button size="sm" variant="secondary" onClick={() => setShowRoutineModal(true)}>
                    {todayRoutine ? 'View' : 'Start'}
                  </Button>
                }
              />
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DEFAULT_MORNING_ROUTINE.slice(0, 8).map((item) => {
                    const isComplete = todayRoutine?.items_completed[item.id]
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                          isComplete
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {isComplete ? <CheckCircle size={14} /> : <Circle size={14} />}
                        <span className="truncate">{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Today's Workout */}
            <Card>
              <CardHeader
                title="Today's Workout"
                subtitle={todayWorkout ? todayWorkout.name : 'Not logged yet'}
                icon={<Dumbbell size={20} />}
                action={
                  <Button size="sm" onClick={() => setShowWorkoutModal(true)}>
                    {todayWorkout ? 'View' : 'Log Workout'}
                  </Button>
                }
              />
              <CardContent>
                {todayWorkout ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Badge variant="purple">{todayWorkout.type}</Badge>
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Clock size={14} />
                        {todayWorkout.duration_minutes} min
                      </span>
                    </div>
                    <div className="space-y-2">
                      {todayWorkout.exercises.slice(0, 4).map((ex, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                          <span className="text-sm text-gray-300">{ex.name}</span>
                          <span className="text-xs text-gray-500">
                            {ex.sets && ex.reps ? `${ex.sets}x${ex.reps}` : ex.duration_seconds ? `${ex.duration_seconds}s` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Dumbbell size={40} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-gray-500 text-sm mb-3">No workout logged yet today</p>
                    <p className="text-xs text-gray-600">Choose from templates or log a custom workout</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workout Templates */}
            <Card>
              <CardHeader title="Quick Workouts" subtitle="Tap to start" />
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {WORKOUT_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setShowWorkoutModal(true)}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-left transition-colors"
                    >
                      <p className="font-medium text-white mb-1">{template.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{template.duration} min</span>
                        <Badge variant="default" size="sm">{template.type}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Supplements & Health */}
          <div className="space-y-6">
            {/* Supplements Card */}
            <Card>
              <CardHeader
                title="Supplements"
                subtitle="Daily stack"
                icon={<Pill size={20} />}
                action={
                  <Button size="sm" variant="ghost" onClick={() => setShowSupplementsModal(true)}>
                    View All
                  </Button>
                }
              />
              <CardContent>
                <div className="space-y-2">
                  {RECOMMENDED_SUPPLEMENTS.filter(s => s.priority === 'essential').map((supp) => (
                    <div
                      key={supp.name}
                      className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{supp.name}</p>
                        <p className="text-xs text-gray-500">{supp.dosage} - {supp.timing}</p>
                      </div>
                      <button className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                        <Circle size={18} className="text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Health Metrics */}
            <Card>
              <CardHeader
                title="Health Metrics"
                subtitle="Track your vitals"
                icon={<Heart size={20} />}
              />
              <CardContent>
                <div className="space-y-3">
                  <MetricRow label="Weight" value="--" unit="lbs" icon={<Activity size={16} />} />
                  <MetricRow label="Sleep" value="--" unit="hrs" icon={<Moon size={16} />} />
                  <MetricRow label="Water" value="--" unit="oz" icon={<Droplet size={16} />} />
                  <MetricRow label="Steps" value="--" unit="" icon={<TrendingUp size={16} />} />
                </div>
                <Button variant="secondary" size="sm" fullWidth className="mt-4">
                  Log Metrics
                </Button>
              </CardContent>
            </Card>

            {/* Health Tests Due */}
            <Card>
              <CardHeader
                title="Health Tests"
                subtitle="Preventive care for 38yo male"
                icon={<Activity size={20} />}
              />
              <CardContent>
                <div className="space-y-2">
                  {RECOMMENDED_HEALTH_TESTS.filter(t => t.importance === 'critical').map((test) => (
                    <div
                      key={test.id}
                      className="p-2 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-white">{test.name}</p>
                        <Badge variant="error" size="sm">{test.importance}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{test.frequency}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  Schedule your annual physical and bloodwork
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals would go here */}
      <Modal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        title="Log Workout"
        size="lg"
      >
        <div className="text-center py-8 text-gray-400">
          <Dumbbell size={48} className="mx-auto mb-4 text-purple-400" />
          <p>Workout logging interface coming soon.</p>
          <p className="text-sm mt-2">Select a template or create a custom workout.</p>
        </div>
      </Modal>

      <Modal
        isOpen={showRoutineModal}
        onClose={() => setShowRoutineModal(false)}
        title="Morning Routine"
        size="md"
      >
        <div className="space-y-2">
          {DEFAULT_MORNING_ROUTINE.map((item) => {
            const isComplete = todayRoutine?.items_completed[item.id]
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isComplete
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {isComplete ? <CheckCircle size={20} /> : <Circle size={20} />}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </Modal>

      <Modal
        isOpen={showSupplementsModal}
        onClose={() => setShowSupplementsModal(false)}
        title="Supplement Stack"
        size="lg"
      >
        <div className="space-y-4">
          {['essential', 'beneficial', 'optional'].map((priority) => (
            <div key={priority}>
              <h4 className="font-medium text-white capitalize mb-2 flex items-center gap-2">
                {priority}
                <Badge variant={priority === 'essential' ? 'success' : priority === 'beneficial' ? 'info' : 'default'}>
                  {RECOMMENDED_SUPPLEMENTS.filter(s => s.priority === priority).length}
                </Badge>
              </h4>
              <div className="space-y-2">
                {RECOMMENDED_SUPPLEMENTS.filter(s => s.priority === priority).map((supp) => (
                  <div key={supp.name} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-white">{supp.name}</p>
                      <span className="text-sm text-gray-400">{supp.dosage}</span>
                    </div>
                    <p className="text-xs text-gray-500">{supp.timing} - {supp.purpose}</p>
                    <p className="text-xs text-gray-600 mt-1">{supp.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function QuickStatCard({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  color: 'purple' | 'orange' | 'green' | 'yellow'
}) {
  const colorStyles = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  }

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colorStyles[color]} border`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}

function MetricRow({
  label,
  value,
  unit,
  icon,
}: {
  label: string
  value: string
  unit: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium text-white">
        {value} <span className="text-gray-500 text-sm">{unit}</span>
      </span>
    </div>
  )
}
