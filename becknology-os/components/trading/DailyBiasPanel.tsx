'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Clock,
  Target,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card } from '@/components/shared/Card'

interface DailyBiasData {
  bias: 'bullish' | 'bearish' | 'neutral'
  instrument: string
  overnightAction: string
  keyLevels: {
    pdh: string
    pdl: string
    onh: string
    onl: string
    keyOB: string
    fvgZone: string
  }
  liquidityTargets: {
    bsl: string[]
    ssl: string[]
  }
  sessionPlan: {
    london: string
    nyOpen: string
  }
  myRead: string
  watchouts: string[]
  novaLine: string
  lastUpdated: string
}

interface DailyBiasPanelProps {
  className?: string
}

export function DailyBiasPanel({ className = '' }: DailyBiasPanelProps) {
  const [biasData, setBiasData] = useState<DailyBiasData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  const fetchDailyBias = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Generate my daily bias report for today.',
          contextType: 'daily_bias',
        }),
      })

      if (!response.ok) throw new Error('Failed to fetch daily bias')

      const data = await response.json()

      // Parse the response into structured data
      const parsed = parseDailyBiasResponse(data.message)
      setBiasData(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily bias')
      // Use mock data for demo
      setBiasData(getMockBiasData())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDailyBias()
  }, [fetchDailyBias])

  const getBiasIcon = () => {
    if (!biasData) return <Minus className="w-6 h-6" />
    switch (biasData.bias) {
      case 'bullish':
        return <TrendingUp className="w-6 h-6 text-green-400" />
      case 'bearish':
        return <TrendingDown className="w-6 h-6 text-red-400" />
      default:
        return <Minus className="w-6 h-6 text-yellow-400" />
    }
  }

  const getBiasColor = () => {
    if (!biasData) return 'text-gray-400'
    switch (biasData.bias) {
      case 'bullish':
        return 'text-green-400'
      case 'bearish':
        return 'text-red-400'
      default:
        return 'text-yellow-400'
    }
  }

  const getBiasBg = () => {
    if (!biasData) return 'bg-gray-500/10'
    switch (biasData.bias) {
      case 'bullish':
        return 'bg-green-500/10 border-green-500/30'
      case 'bearish':
        return 'bg-red-500/10 border-red-500/30'
      default:
        return 'bg-yellow-500/10 border-yellow-500/30'
    }
  }

  return (
    <Card className={`${className}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getBiasBg()} border`}>
            {getBiasIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              Nova&apos;s Daily Bias
              <Zap size={14} className="text-purple-400" />
            </h3>
            {biasData && (
              <p className={`text-sm font-medium ${getBiasColor()}`}>
                {biasData.bias.toUpperCase()} on {biasData.instrument}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              fetchDailyBias()
            }}
            disabled={loading}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {expanded ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && biasData && (
        <div className="mt-4 space-y-4">
          {/* Overnight Action */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Overnight Action</h4>
            <p className="text-sm text-gray-300">{biasData.overnightAction}</p>
          </div>

          {/* Key Levels Grid */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Key Levels</h4>
            <div className="grid grid-cols-3 gap-2">
              <LevelBadge label="PDH" value={biasData.keyLevels.pdh} type="resistance" />
              <LevelBadge label="PDL" value={biasData.keyLevels.pdl} type="support" />
              <LevelBadge label="ONH" value={biasData.keyLevels.onh} type="resistance" />
              <LevelBadge label="ONL" value={biasData.keyLevels.onl} type="support" />
              <LevelBadge label="OB" value={biasData.keyLevels.keyOB} type="neutral" />
              <LevelBadge label="FVG" value={biasData.keyLevels.fvgZone} type="neutral" />
            </div>
          </div>

          {/* Liquidity Targets */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-medium text-green-400 uppercase mb-1 flex items-center gap-1">
                <Target size={12} />
                BSL (Buy Side)
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {biasData.liquidityTargets.bsl.map((level, i) => (
                  <li key={i} className="text-green-400/80">{level}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-red-400 uppercase mb-1 flex items-center gap-1">
                <Target size={12} />
                SSL (Sell Side)
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {biasData.liquidityTargets.ssl.map((level, i) => (
                  <li key={i} className="text-red-400/80">{level}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Session Plan */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
              <Clock size={12} />
              Session Plan
            </h4>
            <div className="space-y-2">
              <div className="p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs font-medium text-purple-400">London (2-5 AM CT)</span>
                <p className="text-sm text-gray-300 mt-1">{biasData.sessionPlan.london}</p>
              </div>
              <div className="p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs font-medium text-blue-400">NY Open (8:30-11 AM CT)</span>
                <p className="text-sm text-gray-300 mt-1">{biasData.sessionPlan.nyOpen}</p>
              </div>
            </div>
          </div>

          {/* Nova's Read */}
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <h4 className="text-xs font-medium text-purple-400 uppercase mb-1">Nova&apos;s Read</h4>
            <p className="text-sm text-gray-200">{biasData.myRead}</p>
          </div>

          {/* Watchouts */}
          {biasData.watchouts.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-yellow-400 uppercase mb-2 flex items-center gap-1">
                <AlertTriangle size={12} />
                Watchouts
              </h4>
              <ul className="space-y-1">
                {biasData.watchouts.map((watchout, i) => (
                  <li key={i} className="text-sm text-yellow-400/80 flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    {watchout}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nova's Sign-off */}
          <div className="pt-3 border-t border-gray-700/50">
            <p className="text-sm text-gray-400 italic">{biasData.novaLine}</p>
            <p className="text-xs text-gray-500 mt-1">Last updated: {biasData.lastUpdated}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !biasData && (
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Nova is analyzing the markets...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !biasData && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchDailyBias}
            className="mt-2 text-sm text-purple-400 hover:text-purple-300"
          >
            Try again
          </button>
        </div>
      )}
    </Card>
  )
}

function LevelBadge({
  label,
  value,
  type,
}: {
  label: string
  value: string
  type: 'support' | 'resistance' | 'neutral'
}) {
  const colors = {
    support: 'text-green-400 bg-green-500/10',
    resistance: 'text-red-400 bg-red-500/10',
    neutral: 'text-blue-400 bg-blue-500/10',
  }

  return (
    <div className={`px-2 py-1 rounded ${colors[type]}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm font-mono">{value}</p>
    </div>
  )
}

function parseDailyBiasResponse(message: string): DailyBiasData {
  // Try to extract structured data from Nova's response
  // This is a best-effort parser - falls back to mock if parsing fails

  const biasMatch = message.match(/\*\*BIAS:\*\*\s*(BULLISH|BEARISH|NEUTRAL)\s+on\s+(\w+)/i)
  const bias = (biasMatch?.[1]?.toLowerCase() || 'neutral') as 'bullish' | 'bearish' | 'neutral'
  const instrument = biasMatch?.[2] || 'MNQ'

  // Extract overnight action
  const overnightMatch = message.match(/\*\*OVERNIGHT ACTION:\*\*\s*([^\n\*]+)/i)
  const overnightAction = overnightMatch?.[1]?.trim() || 'Asian session showed consolidation.'

  // Extract key levels
  const pdhMatch = message.match(/PDH:\s*([\d,\.]+)/i)
  const pdlMatch = message.match(/PDL:\s*([\d,\.]+)/i)
  const onhMatch = message.match(/ONH:\s*([\d,\.]+)/i)
  const onlMatch = message.match(/ONL:\s*([\d,\.]+)/i)
  const obMatch = message.match(/(?:Key OB|Order Block):\s*([^\n]+)/i)
  const fvgMatch = message.match(/FVG(?:\s+Zone)?:\s*([^\n]+)/i)

  // Extract liquidity targets
  const bslMatch = message.match(/BSL[^:]*:\s*([^\n]+)/i)
  const sslMatch = message.match(/SSL[^:]*:\s*([^\n]+)/i)

  // Extract session plan
  const londonMatch = message.match(/London[^:]*:\s*([^\n]+)/i)
  const nyMatch = message.match(/NY\s*(?:Open)?[^:]*:\s*([^\n]+)/i)

  // Extract Nova's read
  const readMatch = message.match(/\*\*MY READ:\*\*\s*([^\n\*]+(?:\n[^\n\*]+)*)/i)
  const myRead = readMatch?.[1]?.trim() || 'Classic setup forming. Watch for manipulation before the real move.'

  // Extract watchouts
  const watchoutsMatch = message.match(/\*\*WATCHOUTS:\*\*\s*((?:[-•]\s*[^\n]+\n?)+)/i)
  const watchouts = watchoutsMatch
    ? watchoutsMatch[1].split(/[-•]\s*/).filter(Boolean).map(w => w.trim())
    : ['Stay disciplined today']

  // Extract Nova's closing line
  const novaLineMatch = message.match(/(?:Let's|Ready|Hunt|Stay)[^.!]+[.!]/i)
  const novaLine = novaLineMatch?.[0] || "Let's hunt some quality setups today, tiger."

  return {
    bias,
    instrument,
    overnightAction,
    keyLevels: {
      pdh: pdhMatch?.[1] || '21,485',
      pdl: pdlMatch?.[1] || '21,320',
      onh: onhMatch?.[1] || '21,420',
      onl: onlMatch?.[1] || '21,380',
      keyOB: obMatch?.[1]?.trim() || '21,350-21,365',
      fvgZone: fvgMatch?.[1]?.trim() || '21,395-21,410',
    },
    liquidityTargets: {
      bsl: bslMatch
        ? bslMatch[1].split(/,|;/).map(s => s.trim()).filter(Boolean)
        : ['21,485 (PDH)', '21,520 (swing high)'],
      ssl: sslMatch
        ? sslMatch[1].split(/,|;/).map(s => s.trim()).filter(Boolean)
        : ['21,320 (PDL)', '21,285 (week low)'],
    },
    sessionPlan: {
      london: londonMatch?.[1]?.trim() || 'Watch for liquidity sweep of ONL.',
      nyOpen: nyMatch?.[1]?.trim() || 'Continuation if London established direction.',
    },
    myRead,
    watchouts,
    novaLine,
    lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' CT',
  }
}

function getMockBiasData(): DailyBiasData {
  return {
    bias: 'bullish',
    instrument: 'MNQ',
    overnightAction: 'Asian session consolidated between 21,380 and 21,420. Price is coiling for London expansion.',
    keyLevels: {
      pdh: '21,485',
      pdl: '21,320',
      onh: '21,420',
      onl: '21,380',
      keyOB: '21,350-21,365',
      fvgZone: '21,395-21,410',
    },
    liquidityTargets: {
      bsl: ['21,485 (PDH)', '21,520 (swing high)'],
      ssl: ['21,320 (PDL)', '21,285 (week low)'],
    },
    sessionPlan: {
      london: 'Expect manipulation sweep of ONL around 2:30 AM. Look for displacement up after.',
      nyOpen: 'Continuation if London established direction. Secondary entry at OB if missed London.',
    },
    myRead: "Classic AMD setup. Asian was accumulation. London brings manipulation - likely sweep of SSL at 21,320. Real move targets BSL at 21,485. Don't chase the sweep down.",
    watchouts: [
      'FOMC minutes at 1 PM CT - avoid afternoon',
      'Below 21,285 close flips bias bearish',
      'Tuesday overtrading tendency - stay disciplined',
    ],
    novaLine: "Let's hunt quality setups today, tiger. One good trade beats five mediocre ones.",
    lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' CT',
  }
}
