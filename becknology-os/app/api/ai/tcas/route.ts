import { NextRequest, NextResponse } from 'next/server'
import { getAgentById, TCAS_AGENTS } from '@/lib/tcas-agents'

interface TCASRequest {
  agentId: string
  message: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  context?: {
    customerId?: string
    customerName?: string
    projectName?: string
    additionalInfo?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TCASRequest = await request.json()
    const { agentId, message, history = [], context } = body

    // Get the agent configuration
    const agent = getAgentById(agentId)

    if (!agent) {
      return NextResponse.json(
        { error: `Agent '${agentId}' not found` },
        { status: 404 }
      )
    }

    if (!agent.available) {
      return NextResponse.json(
        { error: `Agent '${agent.name}' is currently unavailable` },
        { status: 503 }
      )
    }

    // Build the system prompt with context
    let systemPrompt = agent.systemPrompt

    if (context) {
      systemPrompt += `\n\n## Current Context:`
      if (context.customerName) {
        systemPrompt += `\n- Customer: ${context.customerName}`
      }
      if (context.projectName) {
        systemPrompt += `\n- Project: ${context.projectName}`
      }
      if (context.additionalInfo) {
        systemPrompt += `\n- Additional Info: ${context.additionalInfo}`
      }
    }

    // Add TCAS branding
    systemPrompt += `\n\n## Company Context:
You are an AI agent for TCAS (Texas Controls & Automation Solutions), a leading industrial automation distributor and integrator. TCAS provides:
- Industrial automation equipment (PLCs, VFDs, sensors, safety devices)
- Engineering and integration services
- Technical support and training
- Located in Texas, serving customers across the region

Always represent TCAS professionally and helpfully.`

    // Build conversation messages
    const conversationHistory = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Check for API key - Anthropic preferred
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (anthropicKey) {
      // Use Anthropic Claude Sonnet
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            ...conversationHistory,
            { role: 'user', content: message },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Anthropic API error:', errorText)
        throw new Error('Anthropic API error')
      }

      const data = await response.json()
      return NextResponse.json({
        message: data.content[0].text,
        agentId: agent.id,
        agentName: agent.name,
      })
    }

    if (openaiKey) {
      // Fallback to OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error('OpenAI API error')
      }

      const data = await response.json()
      return NextResponse.json({
        message: data.choices[0].message.content,
        agentId: agent.id,
        agentName: agent.name,
      })
    }

    // Return mock response for development
    return NextResponse.json({
      message: getMockResponse(agent, message),
      agentId: agent.id,
      agentName: agent.name,
      mock: true,
    })
  } catch (error) {
    console.error('TCAS API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to list available agents
export async function GET() {
  const agents = TCAS_AGENTS.map((agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    specialty: agent.specialty,
    personality: agent.personality,
    avatar: agent.avatar,
    color: agent.color,
    available: agent.available,
  }))

  return NextResponse.json({ agents })
}

function getMockResponse(agent: ReturnType<typeof getAgentById>, message: string): string {
  if (!agent) return "Agent not found."

  const lowerMessage = message.toLowerCase()

  // Agent-specific mock responses
  switch (agent.id) {
    case 'jim':
      if (lowerMessage.includes('vfd') || lowerMessage.includes('drive')) {
        return `Well, let me tell you about VFDs - they're the workhorses of modern motor control.

What specifically are you working with? I've seen just about every scenario in my 30+ years:
- Troubleshooting fault codes?
- Sizing a new drive?
- Harmonics or power quality issues?
- Retrofitting an old system?

Give me the details and I'll share what I've learned. Had a situation just like this back at a paper mill in '95 that taught me a valuable lesson...`
      }
      return `Well, good to hear from you! I'm JIM, TCAS's VFD and motion control specialist.

What can I help you with today? Whether it's:
- Variable frequency drives and motor control
- Troubleshooting motor problems
- Energy efficiency optimization
- Motion control and servo systems

I've been doing this for over 30 years, so I've probably seen whatever you're dealing with. What's on your mind?`

    case 'joshua':
      if (lowerMessage.includes('plc') || lowerMessage.includes('rockwell') || lowerMessage.includes('allen')) {
        return `Happy to help with that!

For Rockwell/Allen-Bradley systems, I can assist with:
- ControlLogix and CompactLogix programming
- Studio 5000 configuration and troubleshooting
- EtherNet/IP networking setup
- HMI development with PanelView and FactoryTalk
- Legacy system migrations

What specifically are you working on? I'll walk you through it step by step and flag any gotchas I know about.`
      }
      return `Hi there! I'm JOSHUA, specializing in Rockwell Automation and industrial networking.

Happy to help with whatever you're working on. My areas include:
- Allen-Bradley PLCs (all families)
- Studio 5000 programming
- Industrial networking (EtherNet/IP, DeviceNet)
- HMI development
- System integration

What can I help you with today?`

    case 'mark':
      if (lowerMessage.includes('safety') || lowerMessage.includes('sensor')) {
        return `Ah, safety systems - where the goal is for absolutely nothing exciting to ever happen!

I can help with:
- Machine safety standards (ISO 13849, IEC 62443)
- Safety PLC configuration
- Risk assessments
- Light curtains, safety mats, E-stops
- Photoelectric and proximity sensors
- Vision systems

What's your application? The key is matching the right technology to the actual risk - over-engineering is almost as problematic as under-engineering. Almost.`
      }
      return `Hello! I'm MARK, the safety and sensor systems specialist.

As I like to say, the best day in machine safety is when nothing happens at all. That means we did our job right.

I work with:
- Machine safety standards and compliance
- Safety PLCs and rated devices
- Sensor technologies (photo, proximity, vision)
- Risk assessment and system design

What safety or sensing challenge can I help you with?`

    case 'brad':
      return `Got it. What do you need?

I can quickly help with:
- Stock availability and lead times
- Pricing and quotes
- Cross-referencing part numbers
- Finding alternatives for backordered items
- Expediting orders

Just give me the part number or description and I'll get you answers fast.`

    case 'sarah':
      return `Hi! So good to connect with you.

I'm SARAH, your Customer Success Manager at TCAS. I'm here to make sure you're getting the most out of our partnership.

How can I help today? Whether it's:
- Checking in on a recent project
- Planning for upcoming needs
- Coordinating with our technical team
- Just catching up

I'm all ears! How's everything going on your end?`

    case 'tony':
      return `Hello. I'm TONY, the technical writer.

I can help you with:
- Technical proposals and quotes
- System specifications and documentation
- RFQ/RFP responses
- User manuals and guides
- Technical editing

What document do you need? I'll make sure we capture everything accurately and present it professionally.`

    case 'maria':
      return `Hi! I'm MARIA, tracking industry trends and market intelligence.

The data shows some interesting patterns lately:
- Automation adoption accelerating post-pandemic
- Supply chain normalization in most categories
- Growing interest in safety system upgrades

What market or industry insights are you looking for? I can help with:
- Industry trend analysis
- Competitive intelligence
- Market opportunity sizing
- Customer segment insights`

    case 'alex':
      return `Hey there! I'm ALEX, outreach specialist.

I help connect the right solutions to the right people. Whether you're:
- Looking to expand your supplier network
- Exploring automation upgrades
- Curious about new technologies

I'd love to understand your goals and see how TCAS might be able to help. What's on your radar these days?`

    case 'chris':
      return `Hello! I'm CHRIS, the project coordinator.

Here's where I can help:
- Project timeline tracking
- Resource coordination
- Delivery and logistics
- Stakeholder communication
- Risk flagging and mitigation

What project are you working on? I'll help keep everything on track and make sure nothing falls through the cracks.`

    case 'dana':
      return `Hi! I'm DANA, the content creator.

I make technical content engaging and accessible. I can help with:
- Technical blog posts and articles
- Product tutorials and how-tos
- Social media content
- Email campaigns
- Educational materials

What kind of content are you thinking about? I love finding creative ways to explain complex topics!`

    case 'evan':
      return `Hello. I'm EVAN, data analyst.

The numbers tell interesting stories when you know where to look. I can help with:
- Sales analytics and trending
- Pipeline analysis and forecasting
- KPI tracking and dashboards
- Business intelligence

What data would be helpful for you to see? I'll pull together the insights.`

    case 'fiona':
      return `Hi there! I'm FIONA, the training coordinator.

Learning is my passion! I can help with:
- Customer product training
- Team skill development
- Certification programs
- Custom training curriculum
- E-learning resources

What skills or knowledge are you looking to build? I'll create a plan that works for your timeline and learning style.`

    default:
      return `Hello! I'm ${agent.name}, ${agent.role} at TCAS.

${agent.personality}

How can I help you today?`
  }
}
