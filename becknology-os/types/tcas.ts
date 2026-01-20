// TCAS Types for Command Center

import type { PipelineStage, AgentActivityStatus, AgentTaskPriority } from '@/lib/tcas-agents'

// Agent Activity Types
export interface AgentActivity {
  id: string
  user_id: string
  agent_name: string
  action: string
  status: AgentActivityStatus
  output: string | null
  metadata: Record<string, unknown>
  created_at: string
  reviewed_at: string | null
  approved: boolean
}

export interface AgentTask {
  id: string
  user_id: string
  agent_name: string
  task: string
  priority: AgentTaskPriority
  due_by: string | null
  status: 'pending' | 'in_progress' | 'completed'
  result: string | null
  created_at: string
  completed_at: string | null
}

export interface TCASCustomer {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  industry: string | null
  address: string | null
  city: string | null
  state: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TCASQuote {
  id: string
  customer_id: string
  quote_number: string
  title: string
  description: string | null
  items: QuoteItem[]
  subtotal: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  valid_until: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface QuoteItem {
  part_number: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface TCASPipelineItem {
  id: string
  customer_id: string
  customer?: TCASCustomer
  title: string
  value: number
  stage: PipelineStage
  probability: number
  expected_close_date: string | null
  assigned_to: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TCASAgentConversation {
  id: string
  user_id: string
  agent_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface TCASStats {
  totalCustomers: number
  activeQuotes: number
  pipelineValue: number
  pipelineByStage: Record<PipelineStage, number>
  wonThisMonth: number
  quotesToFollowUp: number
}
