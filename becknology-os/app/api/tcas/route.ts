import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAgentById } from '@/lib/tcas-agents'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, message, conversationHistory = [] } = body

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, message' },
        { status: 400 }
      )
    }

    // Get agent configuration
    const agent = getAgentById(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${agentId}` },
        { status: 404 }
      )
    }

    // Build conversation messages
    const messages: Anthropic.MessageParam[] = conversationHistory.map(
      (msg: { role: 'user' | 'assistant'; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })
    )

    // Add the new user message
    messages.push({
      role: 'user',
      content: message,
    })

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: agent.systemPrompt,
      messages,
    })

    // Extract text response
    const textContent = response.content.find((block) => block.type === 'text')
    const responseText = textContent && 'text' in textContent ? textContent.text : ''

    return NextResponse.json({
      response: responseText,
      agentId: agent.id,
      agentName: agent.name,
    })
  } catch (error) {
    console.error('TCAS API Error:', error)

    // Check for specific error types
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic API Error: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
