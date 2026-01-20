'use client'

import { useState, useEffect } from 'react'
import { NovaChat } from './NovaChat'
import { NovaStatus } from './NovaStatus'
import { PreSessionChecklist } from './PreSessionChecklist'
import { TradingStats } from './TradingStats'
import { TradeJournal } from './TradeJournal'
import { DailyBiasPanel } from './DailyBiasPanel'
import { WatchlistPanel } from './WatchlistPanel'
import { NewsFeedPanel } from './NewsFeedPanel'
import { Modal } from '@/components/shared/Modal'
import { useNova } from '@/hooks/useNova'
import { useTradingSessions } from '@/hooks/useTradingSessions'
import { useTrades } from '@/hooks/useTrades'

export function TradingView() {
  const [showPreSession, setShowPreSession] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const {
    currentSession,
    completePreSession,
    getTodayStats,
    loading: sessionLoading,
  } = useTradingSessions()

  const {
    trades,
    todayTrades,
    stats,
    todayStats,
    createTrade,
    closeTrade,
    deleteTrade,
    loading: tradesLoading,
  } = useTrades(currentSession?.id)

  const todaySessionStats = getTodayStats()

  const {
    messages,
    isTyping,
    sendMessage,
    getGreeting,
    checkTradingRules,
    canTrade,
  } = useNova({
    sessionId: currentSession?.id,
    preSessionComplete: todaySessionStats.preSessionComplete,
    todayTradeCount: todayStats.totalTrades,
    todayPnL: todayStats.pnl,
    consecutiveLosses: todayStats.consecutiveLosses,
  })

  // Add greeting message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = getGreeting()
      // The greeting is already a message object, we just need to trigger a re-render
    }
  }, [getGreeting, messages.length])

  const handlePreSessionComplete = async (
    checklist: Record<string, boolean>,
    bias: 'bullish' | 'bearish' | 'neutral',
    levels: Record<string, number>
  ) => {
    await completePreSession(checklist, bias, levels)
    setShowPreSession(false)
    // Send message to Nova about completing pre-session
    await sendMessage(
      `Just completed my pre-session checklist. Daily bias is ${bias}. Key levels: PDH ${levels.pdh}, PDL ${levels.pdl}, PWH ${levels.pwh}, PWL ${levels.pwl}. Ready to trade!`,
      'pre_session'
    )
  }

  const handleSendMessage = async (message: string) => {
    await sendMessage(message, 'general')
  }

  const { allowed: tradingAllowed, violations } = canTrade()

  const isLoading = sessionLoading || tradesLoading

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading Trading Command...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Trading Command</h1>
          <p className="text-gray-400">Nova AI Coach + ICT Methodology</p>
        </div>

        {/* Main Grid - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Nova Status & Trade Journal */}
          <div className="lg:col-span-4 space-y-6">
            {/* Nova Status */}
            <NovaStatus
              preSessionComplete={todaySessionStats.preSessionComplete}
              todayTradeCount={todayStats.totalTrades}
              maxTrades={3}
              todayPnL={todayStats.pnl}
              consecutiveLosses={todayStats.consecutiveLosses}
              onStartPreSession={() => setShowPreSession(true)}
              onOpenChat={() => setShowChat(true)}
            />

            {/* Daily Bias Panel */}
            <DailyBiasPanel />

            {/* Watchlist */}
            <WatchlistPanel />
          </div>

          {/* Center Column - Trade Journal & Stats */}
          <div className="lg:col-span-5 space-y-6">
            {/* Trade Journal */}
            <TradeJournal
              trades={todayTrades}
              onAddTrade={createTrade}
              onCloseTrade={closeTrade}
              onDeleteTrade={deleteTrade}
              sessionId={currentSession?.id || ''}
              canTrade={tradingAllowed}
            />

            {/* Rule Violations Warning */}
            {violations.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <h4 className="font-semibold text-red-400 mb-2">Trading Rules</h4>
                <ul className="space-y-2">
                  {violations.map((v, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      <span className="font-medium text-red-400">{v.rule}:</span> {v.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trading Stats */}
            <TradingStats stats={stats} />
          </div>

          {/* Right Column - News Feed */}
          <div className="lg:col-span-3 space-y-6">
            <NewsFeedPanel />
          </div>
        </div>
      </div>

      {/* Pre-Session Checklist Modal */}
      <Modal
        isOpen={showPreSession}
        onClose={() => setShowPreSession(false)}
        title=""
        size="lg"
        showCloseButton={false}
      >
        <PreSessionChecklist
          onComplete={handlePreSessionComplete}
          onCancel={() => setShowPreSession(false)}
        />
      </Modal>

      {/* Nova Chat Modal */}
      <Modal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        title=""
        size="lg"
        showCloseButton={false}
      >
        <NovaChat
          messages={[getGreeting(), ...messages]}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          className="h-[70vh]"
        />
      </Modal>
    </div>
  )
}
