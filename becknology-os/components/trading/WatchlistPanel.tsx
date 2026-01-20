'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Star, Plus, X, RefreshCw } from 'lucide-react'
import { Card } from '@/components/shared/Card'
import { useMarketData, TickerData } from '@/hooks/useMarketData'

interface WatchlistGroup {
  name: string
  symbols: string[]
  color: string
}

const DEFAULT_GROUPS: WatchlistGroup[] = [
  {
    name: 'Indices',
    symbols: ['NQ', 'ES', 'YM', 'RTY'],
    color: 'text-purple-400',
  },
  {
    name: 'Metals',
    symbols: ['GC', 'SI', 'HG'],
    color: 'text-yellow-400',
  },
  {
    name: 'Energy',
    symbols: ['CL', 'NG'],
    color: 'text-orange-400',
  },
  {
    name: 'Crypto',
    symbols: ['BTC', 'ETH'],
    color: 'text-cyan-400',
  },
  {
    name: 'Other',
    symbols: ['VIX', 'DXY'],
    color: 'text-gray-400',
  },
]

interface WatchlistPanelProps {
  className?: string
}

export function WatchlistPanel({ className = '' }: WatchlistPanelProps) {
  const { data, loading, refresh } = useMarketData()
  const [groups] = useState<WatchlistGroup[]>(DEFAULT_GROUPS)
  const [favorites, setFavorites] = useState<string[]>(['NQ', 'GC', 'BTC'])

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    )
  }

  const getTickerData = (symbol: string): TickerData | undefined => {
    return data.find((d) => d.symbol === symbol)
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Watchlist</h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Favorites Row */}
      {favorites.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-700/50">
          <div className="text-xs text-gray-500 uppercase mb-2">Favorites</div>
          <div className="space-y-1">
            {favorites.map((symbol) => {
              const ticker = getTickerData(symbol)
              return (
                <WatchlistItem
                  key={symbol}
                  symbol={symbol}
                  data={ticker}
                  isFavorite={true}
                  onToggleFavorite={() => toggleFavorite(symbol)}
                  compact
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Grouped Watchlist */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.name}>
            <div className={`text-xs uppercase mb-2 ${group.color}`}>
              {group.name}
            </div>
            <div className="space-y-1">
              {group.symbols.map((symbol) => {
                const ticker = getTickerData(symbol)
                return (
                  <WatchlistItem
                    key={symbol}
                    symbol={symbol}
                    data={ticker}
                    isFavorite={favorites.includes(symbol)}
                    onToggleFavorite={() => toggleFavorite(symbol)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

interface WatchlistItemProps {
  symbol: string
  data?: TickerData
  isFavorite: boolean
  onToggleFavorite: () => void
  compact?: boolean
}

function WatchlistItem({
  symbol,
  data,
  isFavorite,
  onToggleFavorite,
  compact = false,
}: WatchlistItemProps) {
  const isPositive = data ? data.changePercent >= 0 : false
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400'
  const bgColor = isPositive ? 'bg-green-500/10' : 'bg-red-500/10'

  const formatPrice = (price: number) => {
    if (price >= 10000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (price >= 100) return price.toFixed(2)
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(6)
  }

  return (
    <div
      className={`flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/50 transition-colors group ${
        compact ? 'bg-gray-800/30' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Star
            size={12}
            className={isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}
          />
        </button>
        <span className="text-sm font-mono text-white">{symbol}</span>
        {data && (
          <span className="text-xs text-gray-500">{data.name}</span>
        )}
      </div>

      {data ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-200">
            {formatPrice(data.price)}
          </span>
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${bgColor}`}
          >
            {isPositive ? (
              <TrendingUp size={10} className={changeColor} />
            ) : (
              <TrendingDown size={10} className={changeColor} />
            )}
            <span className={`text-xs font-mono ${changeColor}`}>
              {isPositive ? '+' : ''}
              {data.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      ) : (
        <span className="text-xs text-gray-500">Loading...</span>
      )}
    </div>
  )
}
