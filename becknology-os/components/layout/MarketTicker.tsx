'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface TickerSymbol {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  category: 'index' | 'forex' | 'metal' | 'energy' | 'grain' | 'soft' | 'livestock' | 'crypto'
}

// Mock data - will be replaced with real API data
const MOCK_TICKER_DATA: TickerSymbol[] = [
  { symbol: 'ES', name: 'S&P 500 Futures', price: 5892.75, change: 12.50, changePercent: 0.21, category: 'index' },
  { symbol: 'NQ', name: 'NASDAQ Futures', price: 21045.00, change: -45.25, changePercent: -0.21, category: 'index' },
  { symbol: 'YM', name: 'Dow Futures', price: 43250.00, change: 85.00, changePercent: 0.20, category: 'index' },
  { symbol: 'RTY', name: 'Russell 2000', price: 2285.40, change: -8.20, changePercent: -0.36, category: 'index' },
  { symbol: 'VIX', name: 'Volatility Index', price: 14.25, change: -0.45, changePercent: -3.06, category: 'index' },
  { symbol: 'DXY', name: 'US Dollar Index', price: 103.45, change: 0.12, changePercent: 0.12, category: 'forex' },
  { symbol: 'EUR/USD', name: 'Euro/Dollar', price: 1.0892, change: -0.0015, changePercent: -0.14, category: 'forex' },
  { symbol: 'USD/JPY', name: 'Dollar/Yen', price: 149.85, change: 0.35, changePercent: 0.23, category: 'forex' },
  { symbol: 'GBP/USD', name: 'Pound/Dollar', price: 1.2685, change: 0.0025, changePercent: 0.20, category: 'forex' },
  { symbol: 'GC', name: 'Gold', price: 2045.80, change: 8.20, changePercent: 0.40, category: 'metal' },
  { symbol: 'SI', name: 'Silver', price: 24.15, change: 0.28, changePercent: 1.17, category: 'metal' },
  { symbol: 'HG', name: 'Copper', price: 4.12, change: -0.03, changePercent: -0.72, category: 'metal' },
  { symbol: 'PL', name: 'Platinum', price: 985.50, change: 5.50, changePercent: 0.56, category: 'metal' },
  { symbol: 'CL', name: 'Crude Oil', price: 72.45, change: -0.85, changePercent: -1.16, category: 'energy' },
  { symbol: 'NG', name: 'Natural Gas', price: 2.28, change: 0.04, changePercent: 1.79, category: 'energy' },
  { symbol: 'RB', name: 'RBOB Gasoline', price: 2.15, change: -0.02, changePercent: -0.92, category: 'energy' },
  { symbol: 'ZC', name: 'Corn', price: 448.25, change: 2.75, changePercent: 0.62, category: 'grain' },
  { symbol: 'ZS', name: 'Soybeans', price: 1185.50, change: -4.25, changePercent: -0.36, category: 'grain' },
  { symbol: 'ZW', name: 'Wheat', price: 585.75, change: 3.50, changePercent: 0.60, category: 'grain' },
  { symbol: 'ZO', name: 'Oats', price: 358.25, change: 1.25, changePercent: 0.35, category: 'grain' },
  { symbol: 'KC', name: 'Coffee', price: 185.45, change: 2.85, changePercent: 1.56, category: 'soft' },
  { symbol: 'CT', name: 'Cotton', price: 78.25, change: -0.45, changePercent: -0.57, category: 'soft' },
  { symbol: 'SB', name: 'Sugar', price: 21.85, change: 0.15, changePercent: 0.69, category: 'soft' },
  { symbol: 'CC', name: 'Cocoa', price: 4285.00, change: 45.00, changePercent: 1.06, category: 'soft' },
  { symbol: 'OJ', name: 'Orange Juice', price: 385.50, change: -2.50, changePercent: -0.64, category: 'soft' },
  { symbol: 'LE', name: 'Live Cattle', price: 185.45, change: 0.85, changePercent: 0.46, category: 'livestock' },
  { symbol: 'HE', name: 'Lean Hogs', price: 72.15, change: -0.35, changePercent: -0.48, category: 'livestock' },
  { symbol: 'GF', name: 'Feeder Cattle', price: 248.25, change: 1.25, changePercent: 0.51, category: 'livestock' },
  { symbol: 'BTC', name: 'Bitcoin', price: 98542.00, change: 1245.00, changePercent: 1.28, category: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: 3485.25, change: -42.50, changePercent: -1.20, category: 'crypto' },
]

interface MarketTickerProps {
  onSymbolClick?: (symbol: TickerSymbol) => void
}

export function MarketTicker({ onSymbolClick }: MarketTickerProps) {
  const [tickerData, setTickerData] = useState<TickerSymbol[]>(MOCK_TICKER_DATA)
  const [isPaused, setIsPaused] = useState(false)

  // Mock real-time updates - will be replaced with actual API polling
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData((prev) =>
        prev.map((item) => {
          const volatility = item.category === 'crypto' ? 0.005 : 0.001
          const randomChange = (Math.random() - 0.5) * item.price * volatility
          const newPrice = item.price + randomChange
          const newChange = item.change + randomChange
          const newChangePercent = (newChange / (newPrice - newChange)) * 100
          return {
            ...item,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
          }
        })
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number, category: string) => {
    if (category === 'forex' && price < 10) {
      return price.toFixed(4)
    }
    if (category === 'crypto') {
      return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    }
    return price.toFixed(2)
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={12} className="text-green-400" />
    if (change < 0) return <TrendingDown size={12} className="text-red-400" />
    return <Minus size={12} className="text-gray-400" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  return (
    <div
      className="h-10 bg-gray-900 border-b border-gray-800 overflow-hidden relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={`flex items-center h-full ${isPaused ? '' : 'animate-ticker'}`}
        style={{ width: 'max-content' }}
      >
        {/* Duplicate for seamless loop */}
        {[...tickerData, ...tickerData].map((item, index) => (
          <button
            key={`${item.symbol}-${index}`}
            onClick={() => onSymbolClick?.(item)}
            className="flex items-center gap-2 px-4 h-full hover:bg-gray-800/50 transition-colors border-r border-gray-800/50"
          >
            <span className="font-semibold text-white text-sm">{item.symbol}</span>
            <span className="text-gray-300 text-sm">
              {formatPrice(item.price, item.category)}
            </span>
            <span className={`flex items-center gap-1 text-xs ${getChangeColor(item.change)}`}>
              {getTrendIcon(item.change)}
              <span>
                {item.change > 0 ? '+' : ''}
                {item.changePercent.toFixed(2)}%
              </span>
            </span>
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker 120s linear infinite;
        }
      `}</style>
    </div>
  )
}
