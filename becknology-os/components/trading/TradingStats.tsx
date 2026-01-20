'use client'

import { Target, Award, BarChart3, Percent } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/shared'
import type { TradingStats as TradingStatsType } from '@/types/trading'

interface TradingStatsProps {
  stats: TradingStatsType
  className?: string
}

export function TradingStats({ stats, className = '' }: TradingStatsProps) {
  const progressPercentage = Math.min(Math.max(stats.progressToGoal, 0), 100)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Goal Progress Card - KEEP */}
      <Card variant="gradient">
        <CardHeader
          title="$170K Trading Goal"
          subtitle="Track your progress to financial freedom"
          icon={<Target size={20} />}
        />
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">
                  ${stats.totalPnL.toLocaleString()} / ${stats.goalAmount.toLocaleString()}
                </span>
              </div>
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {progressPercentage.toFixed(1)}% complete
              </p>
            </div>

            {/* Key Stats Grid - KEEP these metrics only */}
            <div className="grid grid-cols-3 gap-3">
              <StatBox
                label="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                icon={<Percent size={16} />}
                positive={stats.winRate >= 50}
              />
              <StatBox
                label="Profit Factor"
                value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                icon={<BarChart3 size={16} />}
                positive={stats.profitFactor > 1}
              />
              <StatBox
                label="Total Trades"
                value={stats.totalTrades.toString()}
                icon={<Award size={16} />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Win/Loss Breakdown - KEEP */}
      <Card>
        <CardContent>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Performance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-gray-300">Wins</span>
              </div>
              <span className="font-semibold text-green-400">{stats.winningTrades}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm text-gray-300">Losses</span>
              </div>
              <span className="font-semibold text-red-400">{stats.losingTrades}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) * 100 : 50}%`,
                }}
              />
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${stats.totalTrades > 0 ? (stats.losingTrades / stats.totalTrades) * 100 : 50}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REMOVED: Averages card (Average Win, Average Loss, R:R ratio) */}
      {/* REMOVED: Extremes card (Largest Win, Worst Trade) */}
      {/* REMOVED: Current Streak card */}
    </div>
  )
}

function StatBox({
  label,
  value,
  icon,
  positive,
}: {
  label: string
  value: string
  icon: React.ReactNode
  positive?: boolean
}) {
  return (
    <div className="text-center p-3 bg-gray-800 rounded-lg">
      <div className={`flex justify-center mb-1 ${positive === undefined ? 'text-gray-400' : positive ? 'text-green-400' : 'text-red-400'}`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
