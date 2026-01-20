// Entry types with display info
export const ENTRY_TYPES = [
  { id: 'thought', label: 'Thought' },
  { id: 'idea', label: 'Idea' },
  { id: 'decision', label: 'Decision' },
  { id: 'task', label: 'Task' },
  { id: 'note', label: 'Note' },
  { id: 'media', label: 'Media' },
  { id: 'screenshot', label: 'Screenshot' },
  { id: 'link', label: 'Link' },
  { id: 'research', label: 'Research' },
  { id: 'voice_memo', label: 'Voice Memo' },
] as const

export type EntryType = typeof ENTRY_TYPES[number]['id']

// Predefined projects
export const PROJECTS = [
  'TCAS',
  'Trading',
  'Becknology',
  'NKB PR',
  'Nikki GF Content',
  'Property/Home',
  'Family',
  'Wealth Building',
] as const

export type Project = typeof PROJECTS[number]

// Keywords mapped to projects for auto-tagging
export const PROJECT_KEYWORDS: Record<Project, string[]> = {
  'TCAS': [
    'tcas', 'traffic', 'collision', 'avoidance', 'aircraft', 'aviation', 'ads-b',
    'transponder', 'altitude', 'flight', 'pilot', 'cockpit', 'radar'
  ],
  'Trading': [
    'trade', 'trading', 'stock', 'option', 'futures', 'forex', 'crypto',
    'bitcoin', 'ethereum', 'market', 'chart', 'indicator', 'rsi', 'macd',
    'candle', 'bullish', 'bearish', 'long', 'short', 'position', 'portfolio',
    'dividend', 'earnings', 'ticker', 'spy', 'qqq', 'nasdaq', 'dow'
  ],
  'Becknology': [
    'becknology', 'ai', 'machine learning', 'ml', 'claude', 'gpt', 'llm',
    'automation', 'bot', 'script', 'code', 'api', 'integration', 'tech',
    'software', 'development', 'programming', 'algorithm'
  ],
  'NKB PR': [
    'nkb', 'pr', 'public relations', 'media', 'press', 'interview', 'brand',
    'marketing', 'social media', 'instagram', 'twitter', 'linkedin', 'content'
  ],
  'Nikki GF Content': [
    'nikki', 'girlfriend', 'relationship', 'date', 'anniversary', 'gift',
    'travel', 'vacation', 'dinner', 'surprise'
  ],
  'Property/Home': [
    'property', 'home', 'house', 'apartment', 'rent', 'mortgage', 'real estate',
    'renovation', 'repair', 'maintenance', 'furniture', 'decor', 'kitchen',
    'bathroom', 'bedroom', 'living room', 'garage'
  ],
  'Family': [
    'family', 'mom', 'dad', 'parent', 'sibling', 'brother', 'sister',
    'grandparent', 'aunt', 'uncle', 'cousin', 'holiday', 'birthday', 'reunion'
  ],
  'Wealth Building': [
    'wealth', 'investment', 'retire', 'retirement', '401k', 'ira', 'roth',
    'savings', 'budget', 'finance', 'net worth', 'asset', 'passive income',
    'compound', 'interest', 'diversify', 'etf', 'index fund'
  ],
}

// Common stop words to filter out during keyword extraction
export const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'this', 'but', 'they', 'have', 'had', 'what', 'when', 'where',
  'who', 'which', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now', 'i', 'you', 'we',
  'my', 'your', 'our', 'their', 'me', 'him', 'her', 'us', 'them', 'been', 'being',
  'do', 'does', 'did', 'doing', 'would', 'could', 'might', 'must', 'shall',
  'also', 'am', 'up', 'down', 'out', 'if', 'then', 'else', 'over', 'under',
  'again', 'further', 'once', 'here', 'there', 'any', 'about', 'into', 'through'
])
