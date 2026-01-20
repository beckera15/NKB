'use client'

import { useState, useCallback, useRef } from 'react'
import type { NovaConversation, NovaConversationInsert, RuleCheckResult } from '@/types/trading'
import { TRADING_RULES, isInKillZone, PRE_SESSION_CHECKLIST } from '@/lib/nova-prompts'

interface NovaMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  contextType: NovaConversation['context_type']
}

interface UseNovaOptions {
  sessionId?: string
  preSessionComplete?: boolean
  todayTradeCount?: number
  todayPnL?: number
  consecutiveLosses?: number
  lastLossTime?: Date
}

export function useNova(options: UseNovaOptions = {}) {
  const [messages, setMessages] = useState<NovaMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const checkTradingRules = useCallback((): RuleCheckResult[] => {
    const results: RuleCheckResult[] = []
    const {
      preSessionComplete = false,
      todayTradeCount = 0,
      todayPnL = 0,
      consecutiveLosses = 0,
      lastLossTime,
    } = options

    // Check pre-session completion
    if (!preSessionComplete) {
      results.push({
        passed: false,
        rule: TRADING_RULES[3].name,
        message: 'You need to complete your pre-session checklist before trading, tiger.',
        canOverride: false,
      })
    }

    // Check max trades
    if (todayTradeCount >= 3) {
      results.push({
        passed: false,
        rule: TRADING_RULES[0].name,
        message: "That's 3 trades today. Pack it up - we'll get 'em tomorrow.",
        canOverride: false,
      })
    }

    // Check loss cooldown
    if (consecutiveLosses >= 2 && lastLossTime) {
      const cooldownEnd = new Date(lastLossTime.getTime() + 30 * 60 * 1000)
      if (new Date() < cooldownEnd) {
        const minutesLeft = Math.ceil((cooldownEnd.getTime() - Date.now()) / 60000)
        results.push({
          passed: false,
          rule: TRADING_RULES[1].name,
          message: `Take a breather, babe. ${minutesLeft} minutes left on your cooldown after those losses.`,
          canOverride: false,
        })
      }
    }

    // Check daily loss limit
    if (todayPnL <= -500) {
      results.push({
        passed: false,
        rule: TRADING_RULES[2].name,
        message: "Daily loss limit hit. I know it's tough, but protecting capital is priority #1.",
        canOverride: false,
      })
    }

    // Check kill zone (warning only)
    const killZoneCheck = isInKillZone()
    if (!killZoneCheck.inKillZone) {
      results.push({
        passed: true, // Warning, not blocking
        rule: TRADING_RULES[4].name,
        message: "Heads up - we're outside kill zones. Lower probability setups right now.",
        canOverride: true,
      })
    }

    return results
  }, [options])

  const canTrade = useCallback((): { allowed: boolean; violations: RuleCheckResult[] } => {
    const ruleChecks = checkTradingRules()
    const blockingViolations = ruleChecks.filter((r) => !r.passed && !r.canOverride)
    return {
      allowed: blockingViolations.length === 0,
      violations: ruleChecks.filter((r) => !r.passed),
    }
  }, [checkTradingRules])

  const sendMessage = useCallback(
    async (
      content: string,
      contextType: NovaConversation['context_type'] = 'general'
    ): Promise<NovaMessage | null> => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // Add user message
      const userMessage: NovaMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
        contextType,
      }
      setMessages((prev) => [...prev, userMessage])
      setIsTyping(true)
      setError(null)

      try {
        const response = await fetch('/api/ai/nova', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            contextType,
            sessionId: options.sessionId,
            history: messages.slice(-10), // Last 10 messages for context
            tradingContext: {
              preSessionComplete: options.preSessionComplete,
              todayTradeCount: options.todayTradeCount,
              todayPnL: options.todayPnL,
              consecutiveLosses: options.consecutiveLosses,
              inKillZone: isInKillZone(),
            },
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to get response from Nova')
        }

        const data = await response.json()

        const assistantMessage: NovaMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          contextType,
        }

        setMessages((prev) => [...prev, assistantMessage])
        return assistantMessage
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return null
        }
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)

        // Add error message from Nova
        const errorResponse: NovaMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Sorry tiger, I hit a technical snag. Give me a sec and try again?",
          timestamp: new Date(),
          contextType,
        }
        setMessages((prev) => [...prev, errorResponse])
        return errorResponse
      } finally {
        setIsTyping(false)
      }
    },
    [messages, options]
  )

  const getPreSessionBriefing = useCallback(async (): Promise<NovaMessage | null> => {
    return sendMessage(
      'Give me the pre-session briefing for today.',
      'pre_session'
    )
  }, [sendMessage])

  const getPostSessionReview = useCallback(async (sessionSummary: string): Promise<NovaMessage | null> => {
    return sendMessage(
      `Review my session today: ${sessionSummary}`,
      'post_session'
    )
  }, [sendMessage])

  const analyzeSetup = useCallback(async (setupDetails: string): Promise<NovaMessage | null> => {
    return sendMessage(
      `Analyze this setup: ${setupDetails}`,
      'trade_analysis'
    )
  }, [sendMessage])

  const getMotivation = useCallback(async (): Promise<NovaMessage | null> => {
    const prompts = [
      "I need some motivation to stay focused.",
      "Feeling a bit off today. Talk to me.",
      "Help me get my head in the game.",
    ]
    return sendMessage(prompts[Math.floor(Math.random() * prompts.length)], 'general')
  }, [sendMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const getGreeting = useCallback((): NovaMessage => {
    const hour = new Date().getHours()
    let greeting = ''

    if (hour < 5) {
      greeting = "You're up early, tiger! The London session is about to kick off. Let's see what opportunities Europe brings us today."
    } else if (hour < 8) {
      greeting = "Morning, handsome! London is in play. Markets are moving - ready to find our edge?"
    } else if (hour < 11) {
      greeting = "NY Open time - this is our moment, tiger. Highest probability setups coming. You ready?"
    } else if (hour < 14) {
      greeting = "Hey babe, we're in that mid-day chop zone. Be extra selective with setups right now."
    } else if (hour < 17) {
      greeting = "Afternoon session, tiger. Looking for end-of-day positioning plays. How's your day been?"
    } else {
      greeting = "Markets are closing up. Great time to review the day and prep for tomorrow. How'd we do?"
    }

    const { inKillZone, currentSession } = isInKillZone()
    if (inKillZone && currentSession) {
      greeting += ` We're in the ${currentSession.name} kill zone right now - prime time!`
    }

    return {
      id: 'greeting',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
      contextType: 'general',
    }
  }, [])

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    getPreSessionBriefing,
    getPostSessionReview,
    analyzeSetup,
    getMotivation,
    clearMessages,
    getGreeting,
    checkTradingRules,
    canTrade,
    preSessionChecklist: PRE_SESSION_CHECKLIST,
  }
}
