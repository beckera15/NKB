'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AlertCircle, TrendingUp, Cpu, Star } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  source: string
  category: 'high_impact' | 'market' | 'tech' | 'cowboys' | 'automation'
  url?: string
  timestamp: Date
}

// Category styling
const CATEGORY_STYLES = {
  high_impact: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle, label: 'HIGH' },
  market: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: TrendingUp, label: 'MKT' },
  tech: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Cpu, label: 'TECH' },
  cowboys: { bg: 'bg-gray-500/20', text: 'text-white', icon: Star, label: 'DAL' },
  automation: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Cpu, label: 'IND' },
}

interface NewsTickerProps {
  className?: string
}

export function NewsTicker({ className = '' }: NewsTickerProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchNews = useCallback(async () => {
    try {
      const response = await fetch('/api/news')
      if (response.ok) {
        const data = await response.json()
        if (data.news && data.news.length > 0) {
          setNews(data.news)
        }
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial load
    fetchNews()

    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchNews])

  if (isLoading) {
    return (
      <div className={`w-full h-8 bg-gray-900/80 border-b border-gray-800 flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-500">Loading news...</span>
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className={`w-full h-8 bg-gray-900/80 border-b border-gray-800 flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-500">News unavailable</span>
      </div>
    )
  }

  return (
    <div
      className={`w-full h-8 bg-gray-900/80 border-b border-gray-800 overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={containerRef}
        className={`flex items-center h-full whitespace-nowrap ${isPaused ? '' : 'animate-scroll'}`}
        style={{
          animation: isPaused ? 'none' : 'scroll 60s linear infinite',
        }}
      >
        {/* Duplicate content for seamless loop */}
        {[...news, ...news].map((item, index) => {
          const style = CATEGORY_STYLES[item.category]
          const Icon = style.icon

          return (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-2 px-4 border-r border-gray-800"
            >
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                <Icon size={12} />
                {style.label}
              </span>
              <span className="text-sm text-gray-300">{item.title}</span>
              <span className="text-xs text-gray-500">{item.source}</span>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
      `}</style>
    </div>
  )
}
