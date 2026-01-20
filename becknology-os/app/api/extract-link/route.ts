import { NextRequest, NextResponse } from 'next/server'

interface ExtractedContent {
  title: string
  description: string
  content: string
  url: string
  siteName?: string
  image?: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.status}` }, { status: 400 })
    }

    const html = await response.text()

    // Extract content using regex (simple parsing without external dependencies)
    const extracted = extractFromHTML(html, parsedUrl.href)

    return NextResponse.json(extracted)
  } catch (error) {
    console.error('Link extraction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract content' },
      { status: 500 }
    )
  }
}

function extractFromHTML(html: string, url: string): ExtractedContent {
  // Helper to extract meta content
  const getMeta = (name: string): string | undefined => {
    const patterns = [
      new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'),
      new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) return decodeHTMLEntities(match[1])
    }
    return undefined
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = getMeta('og:title') || (titleMatch ? decodeHTMLEntities(titleMatch[1]) : '') || ''

  // Extract description
  const description = getMeta('og:description') || getMeta('description') || ''

  // Extract site name
  const siteName = getMeta('og:site_name')

  // Extract image
  const image = getMeta('og:image')

  // Extract main content
  let content = ''

  // Try to get article content
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) {
    content = stripHTML(articleMatch[1])
  } else {
    // Try main content area
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    if (mainMatch) {
      content = stripHTML(mainMatch[1])
    } else {
      // Fall back to body, excluding script/style/nav/header/footer
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) {
        let bodyContent = bodyMatch[1]
        // Remove unwanted elements
        bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '')
        bodyContent = bodyContent.replace(/<style[\s\S]*?<\/style>/gi, '')
        bodyContent = bodyContent.replace(/<nav[\s\S]*?<\/nav>/gi, '')
        bodyContent = bodyContent.replace(/<header[\s\S]*?<\/header>/gi, '')
        bodyContent = bodyContent.replace(/<footer[\s\S]*?<\/footer>/gi, '')
        bodyContent = bodyContent.replace(/<aside[\s\S]*?<\/aside>/gi, '')
        content = stripHTML(bodyContent)
      }
    }
  }

  // Truncate content if too long
  if (content.length > 5000) {
    content = content.substring(0, 5000) + '...'
  }

  return {
    title: title.trim(),
    description: description.trim(),
    content: content.trim(),
    url,
    siteName,
    image,
  }
}

function stripHTML(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]+>/g, ' ')
  // Decode entities
  text = decodeHTMLEntities(text)
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#32;': ' ',
  }

  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'gi'), char)
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
  result = result.replace(/&#x([a-f0-9]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))

  return result
}
