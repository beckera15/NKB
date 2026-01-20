'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Camera, Clock, X, Edit2, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/shared'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { Modal, ModalFooter } from '@/components/shared/Modal'
import type { Trade, TradeInsert } from '@/types/trading'

interface TradeJournalProps {
  trades: Trade[]
  onAddTrade: (trade: TradeInsert) => Promise<Trade>
  onCloseTrade: (id: string, exitPrice: number, notes?: string) => Promise<Trade>
  onDeleteTrade: (id: string) => Promise<void>
  sessionId: string
  canTrade: boolean
}

export function TradeJournal({
  trades,
  onAddTrade,
  onCloseTrade,
  onDeleteTrade,
  sessionId,
  canTrade,
}: TradeJournalProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState<Trade | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add trade form state
  const [newTrade, setNewTrade] = useState({
    symbol: 'ES',
    direction: 'long' as 'long' | 'short',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    positionSize: '1',
    riskAmount: '100',
    setupType: '',
    notes: '',
  })

  // Close trade form state
  const [closePrice, setClosePrice] = useState('')
  const [closeNotes, setCloseNotes] = useState('')

  const handleAddTrade = async () => {
    setIsSubmitting(true)
    try {
      await onAddTrade({
        session_id: sessionId,
        symbol: newTrade.symbol,
        direction: newTrade.direction,
        entry_price: parseFloat(newTrade.entryPrice),
        stop_loss: parseFloat(newTrade.stopLoss),
        take_profit: newTrade.takeProfit ? parseFloat(newTrade.takeProfit) : null,
        position_size: parseInt(newTrade.positionSize),
        risk_amount: parseFloat(newTrade.riskAmount),
        entry_time: new Date().toISOString(),
        setup_type: newTrade.setupType || null,
        notes: newTrade.notes || null,
        status: 'open',
      })
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to add trade:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseTrade = async () => {
    if (!showCloseModal) return
    setIsSubmitting(true)
    try {
      await onCloseTrade(showCloseModal.id, parseFloat(closePrice), closeNotes)
      setShowCloseModal(null)
      setClosePrice('')
      setCloseNotes('')
    } catch (error) {
      console.error('Failed to close trade:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setNewTrade({
      symbol: 'ES',
      direction: 'long',
      entryPrice: '',
      stopLoss: '',
      takeProfit: '',
      positionSize: '1',
      riskAmount: '100',
      setupType: '',
      notes: '',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const openTrades = trades.filter((t) => t.status === 'open')
  const closedTrades = trades.filter((t) => t.status === 'closed')

  return (
    <div className="space-y-4">
      {/* Add Trade Button */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-white">Trade Journal</h3>
        <Button
          onClick={() => setShowAddModal(true)}
          disabled={!canTrade}
          icon={<Plus size={16} />}
          size="sm"
        >
          Log Trade
        </Button>
      </div>

      {/* Open Trades */}
      {openTrades.length > 0 && (
        <Card variant="glow">
          <CardHeader title="Open Positions" subtitle={`${openTrades.length} active`} />
          <CardContent>
            <div className="space-y-3">
              {openTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        trade.direction === 'long'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {trade.direction === 'long' ? (
                        <TrendingUp size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {trade.symbol} {trade.direction.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        Entry: ${trade.entry_price} | SL: ${trade.stop_loss}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowCloseModal(trade)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Closed Trades */}
      <Card>
        <CardHeader
          title="Today's Trades"
          subtitle={`${closedTrades.length} completed`}
        />
        <CardContent>
          {closedTrades.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No completed trades yet today</p>
          ) : (
            <div className="space-y-2">
              {closedTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        (trade.pnl || 0) >= 0
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {(trade.pnl || 0) >= 0 ? (
                        <TrendingUp size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {trade.symbol} {trade.direction.toUpperCase()}
                        </p>
                        {trade.setup_type && (
                          <Badge variant="purple" size="sm">
                            {trade.setup_type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>
                          ${trade.entry_price} → ${trade.exit_price}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatTime(trade.entry_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Trade Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Log New Trade"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Symbol</label>
              <select
                value={newTrade.symbol}
                onChange={(e) => setNewTrade((prev) => ({ ...prev, symbol: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="ES">ES (S&P 500)</option>
                <option value="NQ">NQ (NASDAQ)</option>
                <option value="YM">YM (Dow)</option>
                <option value="RTY">RTY (Russell)</option>
                <option value="GC">GC (Gold)</option>
                <option value="CL">CL (Crude)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Direction</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTrade((prev) => ({ ...prev, direction: 'long' }))}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    newTrade.direction === 'long'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  Long
                </button>
                <button
                  onClick={() => setNewTrade((prev) => ({ ...prev, direction: 'short' }))}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    newTrade.direction === 'short'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  Short
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Entry Price</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.entryPrice}
                onChange={(e) => setNewTrade((prev) => ({ ...prev, entryPrice: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="5890.50"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Stop Loss</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.stopLoss}
                onChange={(e) => setNewTrade((prev) => ({ ...prev, stopLoss: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="5885.00"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Take Profit (optional)</label>
              <input
                type="number"
                step="0.01"
                value={newTrade.takeProfit}
                onChange={(e) => setNewTrade((prev) => ({ ...prev, takeProfit: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="5900.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Position Size (contracts)</label>
              <input
                type="number"
                value={newTrade.positionSize}
                onChange={(e) => setNewTrade((prev) => ({ ...prev, positionSize: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Risk Amount ($)</label>
              <input
                type="number"
                value={newTrade.riskAmount}
                onChange={(e) => setNewTrade((prev) => ({ ...prev, riskAmount: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Setup Type</label>
            <select
              value={newTrade.setupType}
              onChange={(e) => setNewTrade((prev) => ({ ...prev, setupType: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Select setup type...</option>
              <option value="order_block">Order Block</option>
              <option value="fvg_fill">FVG Fill</option>
              <option value="liquidity_sweep">Liquidity Sweep</option>
              <option value="breaker">Breaker Block</option>
              <option value="ote">OTE (Optimal Trade Entry)</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Notes</label>
            <textarea
              value={newTrade.notes}
              onChange={(e) => setNewTrade((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white h-20 resize-none"
              placeholder="Why did you take this trade? What's your thesis?"
            />
          </div>

          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleAddTrade}
              loading={isSubmitting}
              disabled={!newTrade.entryPrice || !newTrade.stopLoss}
            >
              Log Trade
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Close Trade Modal */}
      <Modal
        isOpen={!!showCloseModal}
        onClose={() => setShowCloseModal(null)}
        title="Close Trade"
        size="md"
      >
        {showCloseModal && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <p className="font-medium text-white">
                  {showCloseModal.symbol} {showCloseModal.direction.toUpperCase()}
                </p>
                <Badge variant={showCloseModal.direction === 'long' ? 'success' : 'error'}>
                  {showCloseModal.direction}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">
                Entry: ${showCloseModal.entry_price} | SL: ${showCloseModal.stop_loss}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Exit Price</label>
              <input
                type="number"
                step="0.01"
                value={closePrice}
                onChange={(e) => setClosePrice(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Enter exit price..."
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Notes (optional)</label>
              <textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white h-20 resize-none"
                placeholder="What happened? What did you learn?"
              />
            </div>

            {closePrice && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">Estimated P&L:</p>
                <p
                  className={`text-xl font-bold ${
                    (showCloseModal.direction === 'long'
                      ? parseFloat(closePrice) - showCloseModal.entry_price
                      : showCloseModal.entry_price - parseFloat(closePrice)) >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  $
                  {(
                    (showCloseModal.direction === 'long'
                      ? parseFloat(closePrice) - showCloseModal.entry_price
                      : showCloseModal.entry_price - parseFloat(closePrice)) *
                    showCloseModal.position_size
                  ).toFixed(0)}
                </p>
              </div>
            )}

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowCloseModal(null)}>
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleCloseTrade}
                loading={isSubmitting}
                disabled={!closePrice}
              >
                Close Trade
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  )
}
