import { NextResponse } from 'next/server'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

interface NewsItem {
  id: string
  title: string
  source: string
  category: 'high_impact' | 'market' | 'tech' | 'cowboys' | 'automation'
  url?: string
  timestamp: Date
}

// Cache for news results (15 minute TTL)
let newsCache: { data: NewsItem[]; timestamp: number } | null = null
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

async function fetchNewsFromPerplexity(): Promise<NewsItem[]> {
  if (!PERPLEXITY_API_KEY) {
    console.warn('Perplexity API key not configured')
    return []
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a news aggregator. Return exactly 8 recent news headlines in JSON array format.
Each item must have: title (string), source (string), category (one of: high_impact, market, tech, cowboys, automation).
Categories:
- high_impact: Fed decisions, major economic events, FOMC, inflation data
- market: Stock market, futures, commodities, forex
- tech: Technology companies, AI, software
- cowboys: Dallas Cowboys NFL news
- automation: Industrial automation, PLCs, manufacturing

Return ONLY valid JSON array, no other text. Example:
[{"title": "Fed signals rate cut", "source": "Reuters", "category": "high_impact"}]`
          },
          {
            role: 'user',
            content: 'Get me the latest headlines for: 1) Federal Reserve and economic news, 2) Stock market and NQ futures, 3) Dallas Cowboys, 4) Industrial automation and Schneider Electric. Return as JSON array.'
          }
        ],
        max_tokens: 1024,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Perplexity API error:', error)
      return []
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('No JSON array found in response:', content)
      return []
    }

    const newsData = JSON.parse(jsonMatch[0])

    // Transform and validate
    const news: NewsItem[] = newsData.map((item: { title?: string; source?: string; category?: string }, index: number) => ({
      id: `news-${Date.now()}-${index}`,
      title: item.title || 'Untitled',
      source: item.source || 'Unknown',
      category: validateCategory(item.category),
      timestamp: new Date(),
    }))

    return news
  } catch (error) {
    console.error('News fetch failed:', error)
    return []
  }
}

function validateCategory(cat: string | undefined): NewsItem['category'] {
  const valid = ['high_impact', 'market', 'tech', 'cowboys', 'automation']
  if (cat && valid.includes(cat)) {
    return cat as NewsItem['category']
  }
  return 'market'
}

export async function GET() {
  try {
    // Check cache
    if (newsCache && Date.now() - newsCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ news: newsCache.data, cached: true })
    }

    // Fetch fresh news
    const news = await fetchNewsFromPerplexity()

    // Update cache if we got results
    if (news.length > 0) {
      newsCache = { data: news, timestamp: Date.now() }
    }

    return NextResponse.json({ news, cached: false })
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news', news: [] },
      { status: 500 }
    )
  }
}
