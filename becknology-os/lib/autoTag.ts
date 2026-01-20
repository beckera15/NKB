// Project detection patterns
const PROJECT_PATTERNS: Record<string, { keywords: string[]; phrases: string[] }> = {
  'Trading': {
    keywords: ['trade', 'trading', 'stock', 'stocks', 'market', 'forex', 'crypto', 'bitcoin', 'ethereum', 'position', 'long', 'short', 'bull', 'bear', 'chart', 'technical', 'analysis', 'indicator', 'rsi', 'macd', 'moving average', 'support', 'resistance', 'breakout', 'volume', 'candlestick', 'options', 'futures', 'hedge', 'portfolio', 'dividend', 'earnings', 'ipo', 'etf', 'spy', 'qqq'],
    phrases: ['price action', 'risk management', 'stop loss', 'take profit', 'entry point', 'exit strategy', 'market cap', 'price target']
  },
  'TCAS': {
    keywords: ['tcas', 'customer', 'client', 'account', 'crm', 'sales', 'lead', 'prospect', 'deal', 'pipeline', 'quota', 'revenue', 'contract', 'renewal', 'upsell', 'churn', 'retention', 'onboarding'],
    phrases: ['customer success', 'account management', 'sales cycle', 'deal flow', 'customer journey']
  },
  'Becknology': {
    keywords: ['becknology', 'dashboard', 'app', 'feature', 'code', 'development', 'deploy', 'api', 'database', 'supabase', 'react', 'next', 'typescript', 'component', 'hook', 'bug', 'fix', 'release', 'version'],
    phrases: ['product development', 'user experience', 'feature request', 'tech debt', 'code review']
  },
  'NKB PR': {
    keywords: ['pr', 'press', 'media', 'journalist', 'publication', 'article', 'interview', 'coverage', 'pitch', 'story', 'headline', 'announcement', 'launch'],
    phrases: ['press release', 'media coverage', 'public relations', 'news story', 'media outreach']
  },
  'Nikki GF Content': {
    keywords: ['nikki', 'content', 'social', 'instagram', 'tiktok', 'youtube', 'video', 'photo', 'post', 'reel', 'story', 'engagement', 'followers', 'influencer', 'brand', 'collaboration', 'sponsorship'],
    phrases: ['content calendar', 'social media', 'content creation', 'brand deal', 'content strategy']
  },
  'Property/Home': {
    keywords: ['property', 'home', 'house', 'apartment', 'real estate', 'mortgage', 'rent', 'lease', 'landlord', 'tenant', 'renovation', 'repair', 'maintenance', 'contractor', 'inspection', 'closing', 'escrow'],
    phrases: ['real estate', 'home improvement', 'property management', 'home value', 'property tax']
  },
  'Family': {
    keywords: ['family', 'kids', 'children', 'parent', 'mom', 'dad', 'brother', 'sister', 'wedding', 'birthday', 'holiday', 'vacation', 'school', 'health', 'doctor', 'appointment'],
    phrases: ['family event', 'family time', 'family meeting']
  },
  'Wealth Building': {
    keywords: ['wealth', 'invest', 'investment', 'retirement', 'savings', 'compound', 'interest', 'asset', 'liability', 'networth', 'passive', 'income', 'financial', 'budget', 'tax', '401k', 'ira', 'roth'],
    phrases: ['wealth building', 'financial freedom', 'passive income', 'net worth', 'financial planning', 'asset allocation', 'compound interest']
  }
}

// Keyword extraction patterns (common stop words to exclude)
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom',
  'this', 'that', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the',
  'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now',
  'also', 'get', 'got', 'like', 'make', 'made', 'see', 'seen', 'want', 'go', 'going'
])

export interface AutoTagResult {
  suggestedProject: string | null
  keywords: string[]
  confidence: number
}

export function autoTag(content: string, title?: string): AutoTagResult {
  const text = `${title || ''} ${content}`.toLowerCase()

  // Score each project
  const scores: Record<string, number> = {}

  for (const [project, patterns] of Object.entries(PROJECT_PATTERNS)) {
    let score = 0

    // Check keywords (1 point each)
    for (const keyword of patterns.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches) {
        score += matches.length
      }
    }

    // Check phrases (3 points each, more specific)
    for (const phrase of patterns.phrases) {
      if (text.includes(phrase.toLowerCase())) {
        score += 3
      }
    }

    if (score > 0) {
      scores[project] = score
    }
  }

  // Find best match
  let suggestedProject: string | null = null
  let maxScore = 0

  for (const [project, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      suggestedProject = project
    }
  }

  // Extract keywords
  const keywords = extractKeywords(text)

  // Calculate confidence (0-1)
  const confidence = maxScore > 0 ? Math.min(maxScore / 10, 1) : 0

  return {
    suggestedProject,
    keywords,
    confidence
  }
}

function extractKeywords(text: string): string[] {
  // Tokenize
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))

  // Count frequency
  const frequency: Record<string, number> = {}
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1
  }

  // Sort by frequency and return top keywords
  const sorted = Object.entries(frequency)
    .filter(([_, count]) => count >= 2) // At least 2 occurrences
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  return sorted
}

// Detect if text contains a URL
export function extractURL(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/gi
  const match = text.match(urlRegex)
  return match ? match[0] : null
}

// Check if content is likely a URL
export function isURL(text: string): boolean {
  const trimmed = text.trim()
  try {
    new URL(trimmed)
    return true
  } catch {
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.')
  }
}
