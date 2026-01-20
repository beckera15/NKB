import { NextRequest, NextResponse } from 'next/server'

export interface LinkExtractResult {
  title: string | null
  description: string | null
  content: string | null
  image: string | null
  url: string
  siteName?: string | null
}

// Simple HTML meta tag extraction without heavy dependencies
function extractMetaContent(html: string, property: string): string | null {
  // Try og: or twitter: meta tags
  const ogRegex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  const ogMatch = html.match(ogRegex)
  if (ogMatch) return decodeHTMLEntities(ogMatch[1])

  // Try reverse order (content before property)
  const reverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
  const reverseMatch = html.match(reverseRegex)
  if (reverseMatch) return decodeHTMLEntities(reverseMatch[1])

  return null
}

function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return titleMatch ? decodeHTMLEntities(titleMatch[1].trim()) : null
}

function extractBodyText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  // Remove nav, header, footer for cleaner content
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '')
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '')
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '')
  text = text.replace(/<aside[\s\S]*?<\/aside>/gi, '')
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode common HTML entities
  text = decodeHTMLEntities(text)
  // Clean up whitespace
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

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the page
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 502 }
      )
    }

    const html = await response.text()

    // Extract metadata
    const title =
      extractMetaContent(html, 'og:title') ||
      extractMetaContent(html, 'twitter:title') ||
      extractTitle(html)

    const description =
      extractMetaContent(html, 'og:description') ||
      extractMetaContent(html, 'twitter:description') ||
      extractMetaContent(html, 'description')

    const image =
      extractMetaContent(html, 'og:image') ||
      extractMetaContent(html, 'twitter:image')

    const siteName = extractMetaContent(html, 'og:site_name')

    // Extract body text content (limited)
    const content = extractBodyText(html).slice(0, 5000)

    const result: LinkExtractResult = {
      title: title?.trim() || null,
      description: description?.trim() || null,
      content,
      image: image?.trim() || null,
      url: parsedUrl.toString(),
      siteName: siteName?.trim() || null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Link extraction error:', error)

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to extract link data' },
      { status: 500 }
    )
  }
}
