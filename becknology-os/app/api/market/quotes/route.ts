import { NextResponse } from 'next/server'
import { TICKER_SYMBOLS, BASE_PRICES } from '@/lib/ticker-symbols'

interface TickerData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  category: string
}

// Cache for rate limiting
let cachedData: TickerData[] | null = null
let lastFetch = 0
const CACHE_DURATION = 30000 // 30 seconds

// Mock data for development/fallback
function generateMockData(): TickerData[] {
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

export async function GET() {
  const now = Date.now()

  // Return cached data if still fresh
  if (cachedData && now - lastFetch < CACHE_DURATION) {
    return NextResponse.json({
      data: cachedData,
      cached: true,
      lastUpdated: new Date(lastFetch).toISOString(),
    })
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY

  // If no API key, return mock data
  if (!apiKey) {
    const mockData = generateMockData()
    cachedData = mockData
    lastFetch = now

    return NextResponse.json({
      data: mockData,
      mock: true,
      message: 'Using mock data. Set TWELVE_DATA_API_KEY for live data.',
      lastUpdated: new Date(now).toISOString(),
    })
  }

  try {
    // Fetch from Twelve Data API
    // Note: Twelve Data has rate limits, so we batch requests
    const symbols = TICKER_SYMBOLS.map((s) => s.apiSymbol).join(',')

    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${apiKey}`,
      { next: { revalidate: 30 } }
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const result = await response.json()

    // Transform API response to our format
    const data: TickerData[] = TICKER_SYMBOLS.map((sym) => {
      const quote = result[sym.apiSymbol] || {}
      const price = parseFloat(quote.close) || 0
      const change = parseFloat(quote.change) || 0
      const changePercent = parseFloat(quote.percent_change) || 0

      return {
        symbol: sym.symbol,
        name: sym.name,
        price,
        change,
        changePercent,
        category: sym.category,
      }
    })

    cachedData = data
    lastFetch = now

    return NextResponse.json({
      data,
      cached: false,
      lastUpdated: new Date(now).toISOString(),
    })
  } catch (error) {
    console.error('Error fetching market data:', error)

    // Return cached data on error if available
    if (cachedData) {
      return NextResponse.json({
        data: cachedData,
        cached: true,
        error: 'Using cached data due to API error',
        lastUpdated: new Date(lastFetch).toISOString(),
      })
    }

    // Fallback to mock data
    const mockData = generateMockData()
    cachedData = mockData
    lastFetch = now

    return NextResponse.json({
      data: mockData,
      mock: true,
      error: 'API error, using mock data',
      lastUpdated: new Date(now).toISOString(),
    })
  }
}
