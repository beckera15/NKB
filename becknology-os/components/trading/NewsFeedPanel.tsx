'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Newspaper,
  RefreshCw,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Clock,
  ExternalLink,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { Card } from '@/components/shared/Card'
import { Badge } from '@/components/shared/Badge'

interface NewsItem {
  id: string
  title: string
  source: string
  timestamp: string
  url?: string
  impact: 'high' | 'medium' | 'low' | 'none'
  category: 'economic' | 'market' | 'forex' | 'crypto' | 'general'
  summary?: string
}

interface EconomicEvent {
  id: string
  time: string
  event: string
  country: string
  impact: 'high' | 'medium' | 'low'
  actual?: string
  forecast?: string
  previous?: string
}

interface NewsFeedPanelProps {
  className?: string
}

export function NewsFeedPanel({ className = '' }: NewsFeedPanelProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'news' | 'calendar'>('news')
  const [filter, setFilter] = useState<'all' | 'high'>('all')

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      // In production, this would fetch from NewsAPI or similar
      // For now, use mock data
      setNews(getMockNews())
      setEvents(getMockEvents())
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  const filteredNews =
    filter === 'high' ? news.filter((n) => n.impact === 'high') : news

  const filteredEvents =
    filter === 'high' ? events.filter((e) => e.impact === 'high') : events

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper size={18} className="text-purple-400" />
          <h3 className="font-semibold text-white">News & Events</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter(filter === 'all' ? 'high' : 'all')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'high'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <AlertTriangle size={10} className="inline mr-1" />
            HIGH IMPACT
          </button>
          <button
            onClick={fetchNews}
            disabled={loading}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw
              size={14}
              className={`text-gray-400 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'news'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Newspaper size={14} className="inline mr-1" />
          News
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'calendar'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Calendar size={14} className="inline mr-1" />
          Calendar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {activeTab === 'news' && (
          <>
            {filteredNews.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No news items available
              </p>
            ) : (
              filteredNews.map((item) => (
                <NewsItemCard key={item.id} item={item} />
              ))
            )}
          </>
        )}

        {activeTab === 'calendar' && (
          <>
            {filteredEvents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No events scheduled
              </p>
            ) : (
              filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </>
        )}
      </div>
    </Card>
  )
}

function NewsItemCard({ item }: { item: NewsItem }) {
  const impactColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    none: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  const categoryIcons = {
    economic: Calendar,
    market: TrendingUp,
    forex: TrendingUp,
    crypto: TrendingUp,
    general: Newspaper,
  }

  const Icon = categoryIcons[item.category]

  return (
    <div className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {item.impact === 'high' && (
            <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded border border-red-500/30">
              HIGH IMPACT
            </span>
          )}
          <span className="text-xs text-gray-500">{item.source}</span>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {item.timestamp}
        </span>
      </div>

      <h4 className="text-sm font-medium text-gray-200 mb-1 line-clamp-2">
        {item.title}
      </h4>

      {item.summary && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.summary}</p>
      )}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Read more <ExternalLink size={10} />
        </a>
      )}
    </div>
  )
}

function EventCard({ event }: { event: EconomicEvent }) {
  const impactColors = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-blue-500/20 text-blue-400',
  }

  const flagEmoji: Record<string, string> = {
    US: 'US',
    UK: 'UK',
    EU: 'EU',
    JP: 'JP',
    CN: 'CN',
    CA: 'CA',
    AU: 'AU',
  }

  return (
    <div className="p-3 bg-gray-800/50 rounded-lg">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">
            {flagEmoji[event.country] || event.country}
          </span>
          <span className={`px-1.5 py-0.5 text-xs rounded ${impactColors[event.impact]}`}>
            {event.impact.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={10} />
          {event.time}
        </div>
      </div>

      <h4 className="text-sm font-medium text-gray-200 mb-2">{event.event}</h4>

      {(event.forecast || event.previous) && (
        <div className="flex items-center gap-4 text-xs">
          {event.actual && (
            <div>
              <span className="text-gray-500">Actual: </span>
              <span className="text-green-400 font-medium">{event.actual}</span>
            </div>
          )}
          {event.forecast && (
            <div>
              <span className="text-gray-500">Forecast: </span>
              <span className="text-gray-300">{event.forecast}</span>
            </div>
          )}
          {event.previous && (
            <div>
              <span className="text-gray-500">Previous: </span>
              <span className="text-gray-400">{event.previous}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getMockNews(): NewsItem[] {
  return [
    {
      id: '1',
      title: 'Fed Minutes Show Officials Divided on Rate Path',
      source: 'Reuters',
      timestamp: '2h ago',
      impact: 'high',
      category: 'economic',
      summary:
        'Federal Reserve officials were divided at their last meeting about the timing of potential rate cuts.',
    },
    {
      id: '2',
      title: 'Tech Stocks Rally as AI Optimism Continues',
      source: 'Bloomberg',
      timestamp: '3h ago',
      impact: 'medium',
      category: 'market',
      summary: 'NASDAQ futures up 0.8% pre-market on continued AI sector strength.',
    },
    {
      id: '3',
      title: 'Gold Holds Gains Near $2,050 Ahead of NFP',
      source: 'FXStreet',
      timestamp: '4h ago',
      impact: 'medium',
      category: 'forex',
      summary: 'Gold consolidates as traders await key US jobs data.',
    },
    {
      id: '4',
      title: 'Bitcoin ETF Inflows Hit New Record',
      source: 'CoinDesk',
      timestamp: '5h ago',
      impact: 'high',
      category: 'crypto',
      summary: 'Spot Bitcoin ETFs see $500M in daily inflows, highest since launch.',
    },
    {
      id: '5',
      title: 'Oil Rises on Middle East Supply Concerns',
      source: 'CNBC',
      timestamp: '6h ago',
      impact: 'medium',
      category: 'market',
      summary: 'Crude oil climbs 1.2% amid Red Sea shipping disruptions.',
    },
    {
      id: '6',
      title: 'European Markets Open Higher',
      source: 'MarketWatch',
      timestamp: '7h ago',
      impact: 'low',
      category: 'market',
    },
  ]
}

function getMockEvents(): EconomicEvent[] {
  const today = new Date()
  return [
    {
      id: '1',
      time: '7:30 AM CT',
      event: 'Initial Jobless Claims',
      country: 'US',
      impact: 'medium',
      forecast: '218K',
      previous: '215K',
    },
    {
      id: '2',
      time: '9:00 AM CT',
      event: 'ISM Manufacturing PMI',
      country: 'US',
      impact: 'high',
      forecast: '47.5',
      previous: '46.8',
    },
    {
      id: '3',
      time: '1:00 PM CT',
      event: 'FOMC Meeting Minutes',
      country: 'US',
      impact: 'high',
    },
    {
      id: '4',
      time: '2:00 AM CT',
      event: 'UK Manufacturing PMI',
      country: 'UK',
      impact: 'medium',
      forecast: '47.0',
      previous: '46.2',
    },
    {
      id: '5',
      time: '3:30 AM CT',
      event: 'ECB Interest Rate Decision',
      country: 'EU',
      impact: 'high',
      forecast: '4.50%',
      previous: '4.50%',
    },
  ]
}
