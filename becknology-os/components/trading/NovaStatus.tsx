'use client'

import { Sparkles, Clock, AlertTriangle, CheckCircle, Target } from 'lucide-react'
import { Badge } from '@/components/shared/Badge'
import { Card, CardHeader, CardContent } from '@/components/shared'
import { isInKillZone, getNextKillZone } from '@/lib/nova-prompts'

interface NovaStatusProps {
  preSessionComplete: boolean
  todayTradeCount: number
  maxTrades: number
  todayPnL: number
  consecutiveLosses: number
  onStartPreSession?: () => void
  onOpenChat?: () => void
}

export function NovaStatus({
  preSessionComplete,
  todayTradeCount,
  maxTrades,
  todayPnL,
  consecutiveLosses,
  onStartPreSession,
  onOpenChat,
}: NovaStatusProps) {
  const { inKillZone, currentSession } = isInKillZone()
  const nextZone = getNextKillZone()

  const canTrade = preSessionComplete && todayTradeCount < maxTrades && consecutiveLosses < 2

  const getNovaMessage = () => {
    if (!preSessionComplete) {
      return "Complete your pre-session checklist before we get started, tiger."
    }
    if (todayTradeCount >= maxTrades) {
      return "Three trades done! Great discipline. Let's review and prep for tomorrow."
    }
    if (consecutiveLosses >= 2) {
      return "Take your cooldown break, handsome. Clear your head and come back sharp."
    }
    if (inKillZone && currentSession) {
      return `We're in the ${currentSession.name} kill zone! Prime time for quality setups.`
    }
    if (todayPnL > 0) {
      return `Nice work so far! +$${todayPnL.toFixed(0)} today. Stay disciplined.`
    }
    return "Ready when you are, tiger. Let's find that edge."
  }

  return (
    <Card variant="glow" className="relative overflow-hidden">
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30" />

      <CardContent className="relative">
        <div className="flex items-start gap-4">
          {/* Nova Avatar */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles size={28} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse" />
          </div>

          {/* Status Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-lg">Nova</h3>
              <Badge variant="gradient" size="sm">ICT Coach</Badge>
            </div>
            <p className="text-gray-300 text-sm mb-3">{getNovaMessage()}</p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3">
              {/* Pre-session Status */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                preSessionComplete
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {preSessionComplete ? (
                  <CheckCircle size={12} />
                ) : (
                  <AlertTriangle size={12} />
                )}
                Pre-Session
              </div>

              {/* Kill Zone */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                inKillZone
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-700 text-gray-400'
              }`}>
                <Clock size={12} />
                {inKillZone && currentSession ? currentSession.name : `Next: ${nextZone?.name}`}
              </div>

              {/* Trade Count */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                todayTradeCount >= maxTrades
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                <Target size={12} />
                {todayTradeCount}/{maxTrades} Trades
              </div>

              {/* P&L */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                todayPnL > 0
                  ? 'bg-green-500/20 text-green-400'
                  : todayPnL < 0
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {todayPnL >= 0 ? '+' : ''}${todayPnL.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {!preSessionComplete ? (
            <button
              onClick={onStartPreSession}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium text-sm transition-all"
            >
              Start Pre-Session Checklist
            </button>
          ) : (
            <button
              onClick={onOpenChat}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Chat with Nova
            </button>
          )}
        </div>

        {/* Trading Blocked Warning */}
        {!canTrade && preSessionComplete && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              {todayTradeCount >= maxTrades
                ? 'Max trades reached for today'
                : 'Cooldown active - wait before next trade'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
