'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '@/components/shared'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { AgentActivityFeed } from './AgentActivityFeed'
import { TaskAssignment } from './TaskAssignment'
import { BradEmailReview } from './BradEmailReview'
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  MessageSquare,
  Send,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { TCAS_AGENTS, PIPELINE_STAGES, TCASAgent } from '@/lib/tcas-agents'
import { useTCAS, type AgentActivity } from '@/hooks/useTCAS'

export function TCASCommandView() {
  const [selectedAgent, setSelectedAgent] = useState<TCASAgent | null>(null)
  const [agentInput, setAgentInput] = useState('')
  const [agentMessages, setAgentMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const [emailReviewActivity, setEmailReviewActivity] = useState<AgentActivity | null>(null)

  const {
    activities,
    tasks,
    loading,
    createAgentTask,
    logAgentActivity,
    reviewActivity,
  } = useTCAS()

  // Mock stats
  const stats = {
    pipelineValue: 245000,
    activeQuotes: 12,
    customers: 89,
    wonThisMonth: 3,
  }

  const handleSendToAgent = async () => {
    if (!agentInput.trim() || !selectedAgent) return

    const userMessage = agentInput
    setAgentInput('')
    setAgentMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsAgentTyping(true)

    try {
      // Call the TCAS API
      const response = await fetch('/api/tcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          message: userMessage,
          conversationHistory: agentMessages,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAgentMessages((prev) => [...prev, { role: 'assistant', content: data.response }])

        // If Brad and looks like email output, log as activity ready for review
        if (selectedAgent.id === 'brad' && data.response.includes('**TO:**')) {
          await logAgentActivity(
            selectedAgent.id,
            `Drafted email: ${userMessage.substring(0, 50)}...`,
            'ready_for_review',
            data.response,
            { originalRequest: userMessage }
          )
        } else {
          // Log as completed activity for other agents
          await logAgentActivity(
            selectedAgent.id,
            userMessage.substring(0, 100),
            'completed',
            data.response
          )
        }
      } else {
        // Fallback to mock response if API fails
        const mockResponse = getMockAgentResponse(selectedAgent, userMessage)
        setAgentMessages((prev) => [...prev, { role: 'assistant', content: mockResponse }])
      }
    } catch {
      // Fallback to mock response on error
      const mockResponse = getMockAgentResponse(selectedAgent, userMessage)
      setAgentMessages((prev) => [...prev, { role: 'assistant', content: mockResponse }])
    }

    setIsAgentTyping(false)
  }

  const openAgentChat = (agent: TCASAgent) => {
    setSelectedAgent(agent)
    setAgentMessages([
      {
        role: 'assistant',
        content: getAgentGreeting(agent),
      },
    ])
  }

  const handleCreateTask = async (
    agentName: string,
    task: string,
    priority: 'critical' | 'high' | 'normal' | 'low',
    dueBy?: string
  ) => {
    await createAgentTask(agentName, task, priority, dueBy)
  }

  const handleReviewActivity = (activity: AgentActivity) => {
    // For Brad's emails, open the email review modal
    if (activity.agent_name === 'brad' || activity.agent_name === 'BRAD') {
      setEmailReviewActivity(activity)
    }
  }

  const handleApproveEmail = async (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId)
    if (activity?.output) {
      await navigator.clipboard.writeText(activity.output)
    }
    await reviewActivity(activityId, true)
  }

  const handleRejectEmail = async (activityId: string) => {
    await reviewActivity(activityId, false)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="text-purple-400" />
            TCAS Command Center
          </h1>
          <p className="text-gray-400">6 AI agents ready to assist your business</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Pipeline Value"
            value={`$${(stats.pipelineValue / 1000).toFixed(0)}K`}
            icon={<DollarSign size={18} />}
            color="green"
          />
          <StatCard
            label="Active Quotes"
            value={stats.activeQuotes}
            icon={<FileText size={18} />}
            color="purple"
          />
          <StatCard
            label="Customers"
            value={stats.customers}
            icon={<Users size={18} />}
            color="blue"
          />
          <StatCard
            label="Won This Month"
            value={stats.wonThisMonth}
            icon={<TrendingUp size={18} />}
            color="yellow"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Agents - 6 Agent Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                title="AI Team"
                subtitle="Click an agent to start a conversation"
                icon={<MessageSquare size={20} />}
              />
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TCAS_AGENTS.map((agent) => {
                    const pendingCount = tasks.filter(
                      (t) => t.agent_name === agent.id && t.status !== 'completed'
                    ).length

                    return (
                      <button
                        key={agent.id}
                        onClick={() => openAgentChat(agent)}
                        className="p-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-left transition-all group relative"
                      >
                        {pendingCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {pendingCount}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{agent.avatar}</span>
                          <div>
                            <p className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                              {agent.name}
                            </p>
                            <p className="text-xs text-gray-500">{agent.role}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{agent.specialty}</p>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Agent Activity Feed */}
            <div className="mt-6">
              <AgentActivityFeed
                activities={activities}
                onReview={handleReviewActivity}
                loading={loading}
                maxItems={5}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Assignment */}
            <TaskAssignment
              tasks={tasks}
              onCreateTask={handleCreateTask}
              loading={loading}
            />

            {/* Pipeline Summary */}
            <Card>
              <CardHeader
                title="Pipeline"
                subtitle="By stage"
                action={
                  <Button size="sm" variant="ghost">
                    View All
                  </Button>
                }
              />
              <CardContent>
                <div className="space-y-2">
                  {PIPELINE_STAGES.slice(0, 4).map((stage) => (
                    <div
                      key={stage.id}
                      className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full`}
                          style={{
                            backgroundColor:
                              stage.color === 'gray'
                                ? '#9ca3af'
                                : stage.color === 'blue'
                                ? '#60a5fa'
                                : stage.color === 'purple'
                                ? '#a78bfa'
                                : stage.color === 'yellow'
                                ? '#fbbf24'
                                : '#4ade80',
                          }}
                        />
                        <span className="text-sm text-gray-300">{stage.name}</span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        ${Math.floor(Math.random() * 80 + 20)}K
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Agent Chat Modal */}
      <Modal
        isOpen={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        title=""
        size="lg"
        showCloseButton={false}
      >
        {selectedAgent && (
          <div className="flex flex-col h-[70vh]">
            {/* Agent Header */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-800">
              <span className="text-3xl">{selectedAgent.avatar}</span>
              <div className="flex-1">
                <h3 className="font-bold text-white">{selectedAgent.name}</h3>
                <p className="text-sm text-gray-400">{selectedAgent.role}</p>
              </div>
              <Badge variant="success" size="sm">Online</Badge>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAgent(null)}>
                Close
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {agentMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'assistant'
                        ? 'bg-gray-800 text-gray-100 rounded-tl-none'
                        : 'bg-purple-600 text-white rounded-tr-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isAgentTyping && (
                <div className="flex gap-3">
                  <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendToAgent()}
                  placeholder={`Ask ${selectedAgent.name}...`}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <Button onClick={handleSendToAgent} icon={<Send size={18} />} disabled={isAgentTyping}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Brad Email Review Modal */}
      <BradEmailReview
        activity={emailReviewActivity}
        isOpen={!!emailReviewActivity}
        onClose={() => setEmailReviewActivity(null)}
        onApprove={handleApproveEmail}
        onReject={handleRejectEmail}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: 'green' | 'purple' | 'blue' | 'yellow'
}) {
  const colorStyles = {
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  }

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colorStyles[color]} border`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function getAgentGreeting(agent: TCASAgent): string {
  const greetings: Record<string, string> = {
    brad: "Hey! Brad here. Ready to help with outreach, emails, or prospect communication. What do you need drafted?",
    john: "Hi there! John here, your Schneider and R&D specialist. What technical challenge can I help you think through?",
    jim: "Well, hello there! JIM here. What can I help you with today? VFD trouble? Motor issues? I've probably seen it before.",
    joshua: "Happy to help! I'm JOSHUA, your Rockwell and networking specialist. What are you working on?",
    mark: "Hey there! MARK here - *adjusts imaginary spectacles* - Ready to make your machines safer and smarter. What's on your mind?",
    chase: "Chase here. Need code? Let me write something for that.",
  }
  return greetings[agent.id] || `Hello! I'm ${agent.name}. How can I help you today?`
}

function getMockAgentResponse(agent: TCASAgent, message: string): string {
  const lowerMsg = message.toLowerCase()

  if (agent.id === 'brad') {
    if (lowerMsg.includes('email') || lowerMsg.includes('outreach') || lowerMsg.includes('draft')) {
      return `**TO:** [prospect@company.com]
**SUBJECT:** Quick question about your automation needs

---

Hi [Name],

I came across [Company] and was impressed by your recent expansion. We specialize in helping manufacturers like you optimize their automation systems.

Quick question: are you currently evaluating any VFD or PLC upgrades? We've helped similar operations reduce downtime by 40%.

Worth a 15-minute call to see if there's a fit?

Best regards,
Andrew Becker
TCAS Automation

---

I've drafted this template for you. Want me to customize it further for a specific prospect?`
    }
    return "Got it. Let me know what you need drafted - prospect emails, follow-ups, or outreach campaigns. I'll make sure it sounds like you."
  }

  if (agent.id === 'jim') {
    if (lowerMsg.includes('vfd') || lowerMsg.includes('drive')) {
      return "Well, let me tell you about VFDs... What specific issue are you running into? Is it a fault code, sizing question, or application challenge? I've probably seen something similar in my 30+ years in the field."
    }
    return "That's a good question. Let me think about the best way to help you with that. What's the specific application or situation you're dealing with?"
  }

  if (agent.id === 'joshua') {
    if (lowerMsg.includes('plc') || lowerMsg.includes('rockwell') || lowerMsg.includes('allen')) {
      return "Happy to help with that! For Rockwell systems, the approach depends on what you're trying to achieve. Can you tell me more about your current setup and what you're looking to do? I'll walk you through the best approach."
    }
    return "I'd be glad to help! Let me know a bit more about what you're working with and I'll provide some guidance."
  }

  if (agent.id === 'john') {
    if (lowerMsg.includes('schneider') || lowerMsg.includes('modicon') || lowerMsg.includes('hms')) {
      return "Let me think through this... For Schneider systems, we have several options depending on your requirements. What's the primary challenge you're trying to solve? I'll map out the best approach."
    }
    return "Interesting question. Let me break this down. What's the specific technical challenge you're facing?"
  }

  if (agent.id === 'mark') {
    if (lowerMsg.includes('safety') || lowerMsg.includes('sensor') || lowerMsg.includes('sick')) {
      return "Ah, safety systems - where the goal is to be boring! *adjusts spectacles* Now, what's the application? Let me ask you this first: what's the worst thing that could happen if the system fails? That's where we start."
    }
    return "Here's what's interesting about that... Let me ask a few questions to make sure I point you in the right direction. What's the environment and application?"
  }

  if (agent.id === 'chase') {
    if (lowerMsg.includes('script') || lowerMsg.includes('code') || lowerMsg.includes('python') || lowerMsg.includes('api')) {
      return "Let me write something for that. What's the data source and expected output format? I'll put together a clean solution."
    }
    return "I can build that. Give me the specifics - input data, desired output, any constraints. I'll have code for you."
  }

  return `Thanks for reaching out! As your ${agent.role}, I'm here to help. Could you provide a few more details about what you're looking for? That way I can give you the most useful guidance.`
}
