// Perplexity API integration for TCAS product search

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

export interface PerplexitySearchResult {
  content: string
  citations?: string[]
}

export async function searchProducts(query: string): Promise<PerplexitySearchResult> {
  if (!PERPLEXITY_API_KEY) {
    console.warn('Perplexity API key not configured')
    return { content: '' }
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
            content: `You are a technical sales assistant for industrial automation products.
Provide specific product recommendations with part numbers when possible.
Focus on these vendors: Schneider Electric, Phoenix Contact, SICK, Kollmorgen, Toshiba, SMC, IDEC, Turck, Red Lion, Regal Beloit, Hoffman nVent.
Be concise and technical. Include specific model numbers and key specifications.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1024,
        temperature: 0.2
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Perplexity API error:', error)
      return { content: '' }
    }

    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content || '',
      citations: data.citations || []
    }
  } catch (error) {
    console.error('Perplexity search failed:', error)
    return { content: '' }
  }
}

export async function searchWithContext(query: string, context: string): Promise<PerplexitySearchResult> {
  const enhancedQuery = `Context: ${context}\n\nQuestion: ${query}`
  return searchProducts(enhancedQuery)
}
