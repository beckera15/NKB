import { PROJECTS, PROJECT_KEYWORDS, STOP_WORDS, type Project } from './constants'

/**
 * Extract keywords from text content
 * @param text - The text to extract keywords from
 * @param maxKeywords - Maximum number of keywords to return (default: 10)
 * @returns Array of extracted keywords sorted by frequency
 */
export function extractKeywords(text: string, maxKeywords = 10): string[] {
  if (!text || typeof text !== 'string') return []

  // Normalize text: lowercase, remove special characters
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Split into words
  const words = normalized.split(' ')

  // Count word frequency, filtering out stop words and short words
  const wordCount = new Map<string, number>()

  for (const word of words) {
    // Skip stop words, short words, and numbers
    if (STOP_WORDS.has(word) || word.length < 3 || /^\d+$/.test(word)) {
      continue
    }

    wordCount.set(word, (wordCount.get(word) || 0) + 1)
  }

  // Sort by frequency and return top keywords
  const sortedWords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, maxKeywords)

  return sortedWords
}

/**
 * Suggest a project based on text content and keywords
 * @param text - The text content to analyze
 * @param keywords - Optional pre-extracted keywords
 * @returns The suggested project name or null if no match
 */
export function suggestProject(text: string, keywords?: string[]): Project | null {
  if (!text && (!keywords || keywords.length === 0)) return null

  const textLower = (text || '').toLowerCase()
  const keywordsLower = (keywords || []).map(k => k.toLowerCase())

  // Score each project based on keyword matches
  const projectScores: Map<Project, number> = new Map()

  for (const project of PROJECTS) {
    const projectKeywords = PROJECT_KEYWORDS[project]
    let score = 0

    for (const keyword of projectKeywords) {
      const keywordLower = keyword.toLowerCase()

      // Check if keyword appears in text (weighted by 2)
      if (textLower.includes(keywordLower)) {
        score += 2
      }

      // Check if keyword appears in extracted keywords (weighted by 3)
      if (keywordsLower.includes(keywordLower)) {
        score += 3
      }
    }

    if (score > 0) {
      projectScores.set(project, score)
    }
  }

  // Find the project with the highest score
  let bestProject: Project | null = null
  let highestScore = 0

  projectScores.forEach((score, project) => {
    if (score > highestScore) {
      highestScore = score
      bestProject = project
    }
  })

  return bestProject
}

/**
 * Auto-tag content with keywords and project suggestion
 * @param text - The text content to analyze
 * @returns Object with extracted keywords and suggested project
 */
export function autoTag(text: string): {
  keywords: string[]
  suggestedProject: Project | null
} {
  const keywords = extractKeywords(text)
  const suggestedProject = suggestProject(text, keywords)

  return {
    keywords,
    suggestedProject,
  }
}
