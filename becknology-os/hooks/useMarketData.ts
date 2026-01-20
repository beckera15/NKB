'use client'

import { useState, useEffect, useCallback } from 'react'
import { TICKER_SYMBOLS, BASE_PRICES } from '@/lib/ticker-symbols'
import type { TickerSymbol } from '@/components/layout/MarketTicker'

// Re-export for convenience
export { TICKER_SYMBOLS }
export type { TickerSymbol }
// Alias for backwards compatibility
export type TickerData = TickerSymbol

// Mock data generator for development
function generateMockData(): TickerSymbol[] {
  return TICKER_SYMBOLS.map((sym) => {
    const basePrice = BASE_PRICES[sym.symbol] || 100
    const volatility = sym.category === 'crypto' ? 0.02 : 0.005
    const change = (Math.random() - 0.5) * basePrice * volatility
    const price = basePrice + change
    const changePercent = (change / basePrice) * 100

    return {
      symbol: sym.symbol,
      name: sym.name,
      price,
      change,
      changePercent,
      category: sym.category,
    }
  })
}

interface UseMarketDataOptions {
  refreshInterval?: number // in milliseconds
  enabled?: boolean
}

interface UseMarketDataReturn {
  data: TickerSymbol[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
}

export function useMarketData(options: UseMarketDataOptions = {}): UseMarketDataReturn {
  const { refreshInterval = 30000, enabled = true } = options

  const [data, setData] = useState<TickerSymbol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMarketData = useCallback(async () => {
    if (!enabled) return

    try {
      // Check if API key is configured
      const hasApiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY

      if (hasApiKey) {
        // Fetch from API route
        const response = await fetch('/api/market/quotes')
        if (!response.ok) {
          throw new Error('Failed to fetch market data')
        }
        const result = await response.json()
        setData(result.data)
      } else {
        // Use mock data with slight variations
        setData((prev) => {
          if (prev.length === 0) {
            return generateMockData()
          }
          // Add small random changes to simulate real-time updates
          return prev.map((item) => {
            const volatility = item.category === 'crypto' ? 0.003 : 0.0005
            const randomChange = (Math.random() - 0.5) * item.price * volatility
            const newPrice = item.price + randomChange
            const newChange = item.change + randomChange * 0.5
            const newChangePercent = (newChange / (newPrice - newChange)) * 100
            return {
              ...item,
              price: newPrice,
              change: newChange,
              changePercent: newChangePercent,
            }
          })
        })
      }

      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Error fetching market data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch market data')
      // On error, use mock data as fallback
      if (data.length === 0) {
        setData(generateMockData())
      }
    } finally {
      setLoading(false)
    }
  }, [enabled, data.length])

  // Initial fetch
  useEffect(() => {
    fetchMarketData()
  }, []) // Only run on mount

  // Set up polling interval
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return

    const interval = setInterval(fetchMarketData, refreshInterval)
    return () => clearInterval(interval)
  }, [enabled, refreshInterval, fetchMarketData])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh: fetchMarketData,
  }
}

// Hook for individual symbol data
export function useSymbolData(symbol: string) {
  const { data, loading, error } = useMarketData()

  const symbolData = data.find((item) => item.symbol === symbol)

  return {
    data: symbolData,
    loading,
    error,
  }
}
