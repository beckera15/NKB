import { NextRequest, NextResponse } from 'next/server'
import {
  NOVA_SYSTEM_PROMPT,
  NOVA_DAILY_BIAS_PROMPT,
  TRADER_PROFILE,
  PRE_SESSION_CHECKLIST,
  TRADING_RULES,
  getCurrentSession,
  isInKillZone,
} from '@/lib/nova-prompts'

interface NovaRequest {
  message: string
  contextType: 'general' | 'daily_bias' | 'trade_analysis' | 'post_session' | 'rule_check' | 'checklist'
  sessionId?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  tradingContext?: {
    preSessionComplete?: boolean
    todayTradeCount?: number
    todayPnL?: number
    consecutiveLosses?: number
    lastLossTime?: string
    checklistStatus?: Record<string, boolean>
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: NovaRequest = await request.json()
    const { message, contextType, history = [], tradingContext } = body

    // Get current session info
    const currentSession = getCurrentSession()
    const killZoneStatus = isInKillZone()

    // Build context-specific system prompt
    let systemPrompt = NOVA_SYSTEM_PROMPT

    // Add context-specific instructions
    switch (contextType) {
      case 'daily_bias':
        systemPrompt += `\n\n## SPECIAL INSTRUCTION:\n${NOVA_DAILY_BIAS_PROMPT}`
        break
      case 'trade_analysis':
        systemPrompt += `\n\n## SPECIAL INSTRUCTION:
The user is asking you to analyze a trade setup. Consider:
1. Is the higher timeframe structure supportive?
2. Has liquidity been swept on the side we're trading against?
3. Is there a valid PD Array (OB, FVG, Breaker)?
4. Are we in a kill zone?
5. What's the R:R ratio?
6. Your honest assessment - take it or wait?

Be specific with ICT concepts. Reference exact levels. Give a rating out of 10.`
        break
      case 'post_session':
        systemPrompt += `\n\n## SPECIAL INSTRUCTION:
Review the trading session. Analyze:
1. Trades taken and outcomes
2. Were rules followed?
3. Quality of entries and exits - were we patient?
4. Psychology during the session - any revenge tendencies?
5. Lessons learned
6. What to do differently tomorrow

Be honest but constructive. Celebrate discipline, not just profits.`
        break
      case 'rule_check':
        systemPrompt += `\n\n## SPECIAL INSTRUCTION:
You are checking trading rules. Be FIRM about rule enforcement. Do NOT let Andrew negotiate or make exceptions. The rules exist for a reason.`
        break
      case 'checklist':
        systemPrompt += `\n\n## SPECIAL INSTRUCTION:
You are helping with the pre-session checklist. For each item not completed, provide your Nova comment explaining why it matters.`
        break
    }

    // Add current trading context
    const currentTradingContext = buildTradingContext(tradingContext, currentSession, killZoneStatus)
    systemPrompt += currentTradingContext

    // Build messages array for Anthropic format
    const conversationHistory = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Check for API key - Anthropic preferred per V2 spec
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (anthropicKey) {
      // Use Anthropic Claude Sonnet per V2 spec
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', // V2 spec specified model
          max_tokens: 1500,
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
        session: currentSession?.name || 'No active session',
        inKillZone: killZoneStatus.inKillZone,
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
          temperature: 0.8,
          max_tokens: 1500,
        }),
      })

      if (!response.ok) {
        throw new Error('OpenAI API error')
      }

      const data = await response.json()
      return NextResponse.json({
        message: data.choices[0].message.content,
        session: currentSession?.name || 'No active session',
        inKillZone: killZoneStatus.inKillZone,
      })
    }

    // Return mock response for development
    return NextResponse.json({
      message: getMockResponse(message, contextType, tradingContext, currentSession, killZoneStatus),
      mock: true,
      session: currentSession?.name || 'No active session',
      inKillZone: killZoneStatus.inKillZone,
    })
  } catch (error) {
    console.error('Nova API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function buildTradingContext(
  tradingContext: NovaRequest['tradingContext'],
  currentSession: ReturnType<typeof getCurrentSession>,
  killZoneStatus: ReturnType<typeof isInKillZone>
): string {
  const now = new Date()
  const ctTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }))

  let context = `\n\n## CURRENT CONTEXT (${ctTime.toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT):
- Current Session: ${currentSession?.name || 'No active session'}
- Session Priority: ${currentSession?.priority || 'N/A'}
- Kill Zone Status: ${killZoneStatus.inKillZone ? `IN KILL ZONE (${killZoneStatus.currentSession?.name})` : 'Outside kill zones'}
`

  if (tradingContext) {
    context += `
## TODAY'S TRADING STATUS:
- Pre-session checklist: ${tradingContext.preSessionComplete ? 'COMPLETE' : 'INCOMPLETE'}
- Trades taken: ${tradingContext.todayTradeCount || 0}/${TRADER_PROFILE.maxTrades}
- Today's P&L: $${tradingContext.todayPnL || 0} (Goal: $${TRADER_PROFILE.dailyGoal}, Limit: -$${TRADER_PROFILE.maxDailyLoss})
- Consecutive losses: ${tradingContext.consecutiveLosses || 0}
`

    // Check rule violations
    const violations: string[] = []

    if (tradingContext.todayTradeCount && tradingContext.todayTradeCount >= TRADER_PROFILE.maxTrades) {
      violations.push('TRADE LIMIT REACHED - No more trades allowed today')
    }

    if (tradingContext.todayPnL && tradingContext.todayPnL <= -TRADER_PROFILE.maxDailyLoss) {
      violations.push('DAILY LOSS LIMIT HIT - Trading must stop')
    }

    if (tradingContext.consecutiveLosses && tradingContext.consecutiveLosses >= 2) {
      violations.push('COOLDOWN REQUIRED - 2 consecutive losses, 30-min break needed')
    }

    if (!tradingContext.preSessionComplete) {
      violations.push('CHECKLIST INCOMPLETE - Cannot trade until completed')
    }

    if (!killZoneStatus.inKillZone) {
      violations.push('OUTSIDE KILL ZONE - Low probability environment')
    }

    if (violations.length > 0) {
      context += `
## ⚠️ RULE VIOLATIONS DETECTED:
${violations.map(v => `- ${v}`).join('\n')}

ENFORCE THESE RULES. Do not let Andrew trade if any blocking rules are violated.
`
    }
  }

  return context
}

function getMockResponse(
  message: string,
  contextType: string,
  tradingContext?: NovaRequest['tradingContext'],
  currentSession?: ReturnType<typeof getCurrentSession>,
  killZoneStatus?: ReturnType<typeof isInKillZone>
): string {
  const lowerMessage = message.toLowerCase()
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  // Check for rule violations first
  if (tradingContext?.todayTradeCount && tradingContext.todayTradeCount >= 3) {
    return `That's trade three, handsome. I know NQ is looking juicy right now, but rules are rules. You've got ${tradingContext.todayPnL ? `$${tradingContext.todayPnL}` : 'your gains'} in the pocket today - protect it.

Shut it down, go live your life, and come back tomorrow hungry. The market isn't going anywhere.

Trust the process.`
  }

  if (tradingContext?.consecutiveLosses && tradingContext.consecutiveLosses >= 2) {
    return `Okay, stop. Right now. I see what's happening, mister.

Two losses in a row. That's exactly when revenge trading happens. I know you want to make it back, but that's not trading - that's gambling.

Close the charts. Set a 30-minute timer. Go drink some water and reset. The market will still be here, but your capital won't be if you keep this up.

I'll let you know when you can come back. 🤍`
  }

  if (tradingContext?.todayPnL && tradingContext.todayPnL <= -300) {
    return `You hit your daily limit, tiger. Charts are closed.

I know this isn't what you want to hear, but -$300 is the line. That's not a suggestion - it's capital preservation.

Today is done. Go decompress. Review your trades. Figure out what went wrong. But do NOT touch another chart today.

See you tomorrow. We'll get it back.`
  }

  // Daily bias report
  if (contextType === 'daily_bias') {
    return `**NOVA'S DAILY BIAS REPORT**
📅 ${dateStr} | ⏰ ${now.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' })} CT

**BIAS:** BULLISH on MNQ

**OVERNIGHT ACTION:**
Asian session was a textbook consolidation between 21,380 and 21,420. No significant levels taken. Price is coiling for expansion during London.

**KEY LEVELS:**
- PDH: 21,485
- PDL: 21,320
- ONH: 21,420
- ONL: 21,380
- Key OB: 21,350-21,365 (bullish, unmitigated)
- FVG Zone: 21,395-21,410

**LIQUIDITY TARGETS:**
- BSL (Buy Side): 21,485 (PDH), 21,520 (swing high)
- SSL (Sell Side): 21,320 (PDL), 21,285 (week's low)

**SESSION PLAN:**
- London (2-5 AM CT): Expect manipulation sweep of ONL around 2:30 AM. If we get displacement up after the sweep, that's our long entry signal.
- NY Open (8:30-11 AM CT): Continuation if London established direction. Watch for secondary entry at OB if you miss London.

**MY READ:**
Classic AMD setup forming. Asian was accumulation. London will bring the manipulation - likely a sweep of 21,320 SSL. The real move targets BSL at 21,485. Don't chase the sweep down - wait for the displacement showing buyer intent.

**WATCHOUTS:**
- FOMC minutes at 1 PM CT - avoid afternoon session
- If we break AND CLOSE below 21,285, bias flips bearish
- You've been overtrading on Tuesdays - stay disciplined, tiger

Let's hunt some quality setups today, handsome. One good trade beats five mediocre ones. 🎯`
  }

  // Trade analysis
  if (contextType === 'trade_analysis') {
    return `Let me break down this setup, tiger.

**Higher Timeframe:** 4H structure is bullish - we have a clear sequence of HH/HL. This supports longs.

**Liquidity:** SSL at 21,320 was swept during London. That's exactly what we want to see for a long setup.

**PD Array:** There's a valid bullish OB at 21,350-21,365. Price is currently retracing into it.

**Kill Zone:** ${killZoneStatus?.inKillZone ? `We're IN the ${killZoneStatus.currentSession?.name} - good timing.` : `We're outside kill zones right now. This is a warning sign.`}

**Risk:Reward:** Entry at 21,360, stop below 21,340, target 21,485. That's about 3:1. Within parameters.

**My Rating:** 7.5/10

**Verdict:** This has the ingredients of a solid MMBM setup. SSL swept, retracing to discount OB, targeting BSL. But I need you to answer me honestly - is your head clear? Are you taking this because it's a good setup, or because you want to make back yesterday's loss?

If it's the former, this is tradeable. If it's the latter, step away.

What's it gonna be? 💜`
  }

  // Post session review
  if (contextType === 'post_session') {
    return `Alright tiger, let's break down today's session.

**The Numbers:**
- Trades: ${tradingContext?.todayTradeCount || 0}
- P&L: ${tradingContext?.todayPnL ? `$${tradingContext.todayPnL}` : 'TBD'}

**What Worked:**
- You waited for the London sweep before entering - that's discipline
- Position sizing was on point - 1% risk respected
- You didn't overtrade despite seeing additional setups

**What Needs Work:**
- I noticed hesitation on that second entry - you almost missed it. Trust your analysis more.
- The exit was a bit early - could've held for the full FVG fill

**Psychology Check:**
How did you FEEL during the session? Any moments where you almost broke a rule? Be honest with me.

**Tomorrow's Focus:**
Keep doing what you did today. One more session like this and we're building real momentum toward that $170K.

Proud of you today, handsome. Now go rest - you've earned it. 🤍`
  }

  // Motivation/focus
  if (lowerMessage.includes('motivation') || lowerMessage.includes('focus') || lowerMessage.includes('help') || lowerMessage.includes('can\'t')) {
    return `Listen to me, tiger.

You're not just trading - you're building something. Every time you follow a rule when you don't want to. Every time you walk away after 3 trades when you see a fourth setup. Every time you take that 30-minute break instead of revenge trading.

That's not weakness. That's the discipline that separates the 1% from everyone else.

$170K isn't a fantasy. It's math. Consistent execution, proper risk management, and TIME. You have all three.

But I need you to trust the process even when it's hard. ESPECIALLY when it's hard. That's when it counts the most.

Now - what's actually on your mind? Let me help. 🔥`
  }

  // Kill zone check
  if (lowerMessage.includes('kill zone') || lowerMessage.includes('can i trade') || lowerMessage.includes('should i trade')) {
    if (killZoneStatus?.inKillZone) {
      return `We're currently in the ${killZoneStatus.currentSession?.name} kill zone. This is prime hunting time, tiger.

But before you do anything - is your checklist complete? Have you identified your levels? Do you have a clear bias?

If yes to all three, then yes - you're cleared to look for setups. Just remember: quality over quantity. We're hunting A+ setups only.

What are you seeing? 🎯`
    } else {
      return `We're outside kill zones right now, handsome. ${currentSession ? `Currently in ${currentSession.name} which is ${currentSession.priority} priority.` : ''}

The highest probability setups happen during London (2-5 AM CT) and NY Open (8:30-11 AM CT). Anything outside those windows is lower probability.

Can you trade? Technically yes. Should you? Probably not. Let's wait for our window.

What else can I help you with while we wait?`
    }
  }

  // Default greeting
  return `Hey tiger! Ready to make some money?

Current status:
- Session: ${currentSession?.name || 'No active session'}
- Kill Zone: ${killZoneStatus?.inKillZone ? `IN (${killZoneStatus.currentSession?.name})` : 'Outside'}
- Trades today: ${tradingContext?.todayTradeCount || 0}/3
- P&L: ${tradingContext?.todayPnL ? `$${tradingContext.todayPnL}` : '$0'}

What do you need?
- **"daily bias"** - Get today's market read
- **"analyze"** - Break down a trade setup
- **"review"** - Post-session analysis
- **"checklist"** - Pre-session preparation

What's it gonna be? 💜`
}
