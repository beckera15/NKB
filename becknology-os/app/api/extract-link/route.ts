import { NextRequest, NextResponse } from 'next/server'

export interface LinkExtractResult {
  title: string | null
  description: string | null
  content: string | null
  image: string | null
  url: string
}

// Simple HTML meta tag extraction without heavy dependencies
function extractMetaContent(html: string, property: string): string | null {
  // Try og: or twitter: meta tags
  const ogRegex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  const ogMatch = html.match(ogRegex)
  if (ogMatch) return ogMatch[1]

  // Try reverse order (content before property)
  const reverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
  const reverseMatch = html.match(reverseRegex)
  if (reverseMatch) return reverseMatch[1]

  return null
}

function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return titleMatch ? titleMatch[1].trim() : null
}

function extractBodyText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()
  return text
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
        'User-Agent': 'Mozilla/5.0 (compatible; BecknologyBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
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

    // Extract body text content (limited)
    const content = extractBodyText(html).slice(0, 5000)

    const result: LinkExtractResult = {
      title: title?.trim() || null,
      description: description?.trim() || null,
      content,
      image: image?.trim() || null,
      url: parsedUrl.toString(),
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
