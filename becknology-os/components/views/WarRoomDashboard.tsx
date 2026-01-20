'use client'

import { Card, CardHeader, CardContent } from '@/components/shared'
import { Badge } from '@/components/shared/Badge'
import {
  TrendingUp,
  Building2,
  Brain,
  Wallet,
  Dumbbell,
  Target,
  Calendar,
  Clock,
  Zap,
  Sun,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import type { Entry } from '@/hooks/useEntries'
import type { Goal } from '@/hooks/useGoals'
import type { Insight } from '@/hooks/useInsights'

interface WarRoomDashboardProps {
  entries: Entry[]
  goals: Goal[]
  insights: Insight[]
}

export function WarRoomDashboard({ entries, goals, insights }: WarRoomDashboardProps) {
  const today = new Date()
  const greeting = getGreeting()
  const todayEntries = entries.filter(
    (e) => new Date(e.created_at).toDateString() === today.toDateString()
  )
  const activeGoals = goals.filter((g) => g.status === 'active')

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sun size={24} className="text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">{greeting}, Commander</h1>
        </div>
        <p className="text-gray-400">
          {today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickStatCard
          label="Today's Entries"
          value={todayEntries.length}
          icon={<Zap size={18} />}
          color="purple"
        />
        <QuickStatCard
          label="Active Goals"
          value={activeGoals.length}
          icon={<Target size={18} />}
          color="pink"
        />
        <QuickStatCard
          label="New Insights"
          value={insights.length}
          icon={<Brain size={18} />}
          color="blue"
        />
        <QuickStatCard
          label="This Week"
          value={entries.filter((e) => isThisWeek(new Date(e.created_at))).length}
          icon={<Calendar size={18} />}
          color="green"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nova Status Card */}
        <Card variant="glow" className="lg:col-span-2">
          <CardHeader
            title="Nova AI Trading Coach"
            subtitle="Your ICT methodology partner"
            icon={<TrendingUp size={20} />}
          />
          <CardContent>
            <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 font-medium">Online & Ready</span>
                </div>
                <Badge variant="gradient">ICT Certified</Badge>
              </div>
              <p className="text-gray-300 mb-4">
                &quot;Good morning, tiger. Market&apos;s looking spicy today. ES showing some
                interesting order blocks above. Want me to break down the pre-market
                structure for you?&quot;
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Pre-session checklist pending
                </span>
                <span>0/3 trades today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Progress */}
        <Card>
          <CardHeader
            title="$170K Goal"
            subtitle="Trading progress"
            icon={<TrendingUp size={20} />}
          />
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-medium">$42,850 / $170,000</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: '25.2%' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <MiniStat label="This Month" value="+$8,450" positive />
                <MiniStat label="Win Rate" value="67%" positive />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TCAS Status */}
        <Card>
          <CardHeader
            title="TCAS Command"
            subtitle="13 agents standing by"
            icon={<Building2 size={20} />}
          />
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-300">Pipeline Value</span>
                <span className="font-semibold text-white">$245,000</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-300">Active Quotes</span>
                <span className="font-semibold text-white">12</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-300">Agent Activity</span>
                <Badge variant="success" pulse>3 Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wealth Overview */}
        <Card>
          <CardHeader
            title="Wealth Overview"
            subtitle="Financial snapshot"
            icon={<Wallet size={20} />}
          />
          <CardContent>
            <div className="space-y-3">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Net Worth</p>
                <p className="text-2xl font-bold text-white">$485,230</p>
                <p className="text-sm text-green-400 flex items-center justify-center gap-1">
                  <ArrowUpRight size={14} />
                  +2.4% this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fitness Today */}
        <Card>
          <CardHeader
            title="Fitness Coach"
            subtitle="Today's status"
            icon={<Dumbbell size={20} />}
          />
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Morning Routine</span>
                <Badge variant="warning">Pending</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Supplements</span>
                <Badge variant="success">3/5 taken</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Workout</span>
                <Badge variant="default">Scheduled 5PM</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent Activity"
            subtitle="Latest entries across all projects"
          />
          <CardContent>
            <div className="space-y-2">
              {entries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="purple">{entry.type}</Badge>
                    <span className="text-white">{entry.title || entry.content?.slice(0, 50)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.project && (
                      <Badge variant="default">{entry.project}</Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(new Date(entry.created_at))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickStatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: 'purple' | 'pink' | 'blue' | 'green'
}) {
  const colorStyles = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
  }

  return (
    <div
      className={`p-4 rounded-xl bg-gradient-to-br ${colorStyles[color]} border`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function MiniStat({
  label,
  value,
  positive,
}: {
  label: string
  value: string
  positive?: boolean
}) {
  return (
    <div className="text-center p-2 bg-gray-800 rounded-lg">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {positive ? <ArrowUpRight size={14} className="inline" /> : <ArrowDownRight size={14} className="inline" />}
        {value}
      </p>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  return date >= weekStart
}

function formatTimeAgo(date: Date): string {
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
