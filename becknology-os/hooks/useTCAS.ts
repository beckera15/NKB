'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AgentActivityStatus, AgentTaskPriority } from '@/lib/tcas-agents'

// Types for agent activity and tasks
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

export interface AgentActivityInsert {
  agent_name: string
  action: string
  status: AgentActivityStatus
  output?: string | null
  metadata?: Record<string, unknown>
}

export interface AgentTaskInsert {
  agent_name: string
  task: string
  priority?: AgentTaskPriority
  due_by?: string | null
}

export interface TCASStats {
  pipelineValue: number
  activeQuotes: number
  customers: number
  wonThisMonth: number
  pipelineByStage: Record<string, number>
}

export function useTCAS() {
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [stats, setStats] = useState<TCASStats>({
    pipelineValue: 0,
    activeQuotes: 0,
    customers: 0,
    wonThisMonth: 0,
    pipelineByStage: {},
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all agent activities
  const fetchAgentActivity = useCallback(async (agentName?: string) => {
    try {
      let query = supabase
        .from('agent_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (agentName) {
        query = query.eq('agent_name', agentName)
      }

      const { data, error } = await query

      if (error) throw error
      setActivities((data as AgentActivity[]) || [])
      return data as AgentActivity[]
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activities'
      setError(message)
      return []
    }
  }, [])

  // Fetch all agent tasks
  const fetchAgentTasks = useCallback(async (agentName?: string) => {
    try {
      let query = supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (agentName) {
        query = query.eq('agent_name', agentName)
      }

      const { data, error } = await query

      if (error) throw error
      setTasks((data as AgentTask[]) || [])
      return data as AgentTask[]
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks'
      setError(message)
      return []
    }
  }, [])

  // Fetch TCAS stats from database
  const fetchStats = useCallback(async () => {
    try {
      // Fetch pipeline data for total value and won this month
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pipelineData, error: pipelineError } = await (supabase as any)
        .from('tcas_pipeline')
        .select('stage, value, updated_at')

      if (pipelineError) throw pipelineError

      // Calculate pipeline value and won this month
      let pipelineValue = 0
      let wonThisMonth = 0
      const pipelineByStage: Record<string, number> = {}

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      if (pipelineData) {
        for (const item of pipelineData as Array<{ stage?: string; value?: number; updated_at?: string }>) {
          pipelineValue += item.value || 0

          // Track by stage
          const stage = item.stage || 'unknown'
          pipelineByStage[stage] = (pipelineByStage[stage] || 0) + (item.value || 0)

          // Count won this month
          if (item.stage === 'won' && item.updated_at) {
            const updatedAt = new Date(item.updated_at)
            if (updatedAt >= startOfMonth) {
              wonThisMonth++
            }
          }
        }
      }

      // Fetch active quotes count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: activeQuotes, error: quotesError } = await (supabase as any)
        .from('tcas_quotes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'sent'])

      if (quotesError) throw quotesError

      // Fetch customers count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: customers, error: customersError } = await (supabase as any)
        .from('tcas_customers')
        .select('*', { count: 'exact', head: true })

      if (customersError) throw customersError

      setStats({
        pipelineValue,
        activeQuotes: activeQuotes || 0,
        customers: customers || 0,
        wonThisMonth,
        pipelineByStage,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats'
      setError(message)
    }
  }, [])

  // Create a new agent task
  const createAgentTask = useCallback(async (
    agentName: string,
    task: string,
    priority: AgentTaskPriority = 'normal',
    dueBy?: string
  ): Promise<AgentTask | null> => {
    try {
      const insertData: AgentTaskInsert = {
        agent_name: agentName,
        task,
        priority,
        due_by: dueBy || null,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('agent_tasks')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      const newTask = data as AgentTask
      setTasks((prev) => [newTask, ...prev])
      return newTask
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task'
      setError(message)
      return null
    }
  }, [])

  // Update task status
  const updateTaskStatus = useCallback(async (
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed',
    result?: string
  ): Promise<AgentTask | null> => {
    try {
      const updates: Partial<AgentTask> = { status }
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }
      if (result !== undefined) {
        updates.result = result
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('agent_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      const updatedTask = data as AgentTask
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)))
      return updatedTask
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task'
      setError(message)
      return null
    }
  }, [])

  // Log agent activity
  const logAgentActivity = useCallback(async (
    agentName: string,
    action: string,
    status: AgentActivityStatus,
    output?: string,
    metadata?: Record<string, unknown>
  ): Promise<AgentActivity | null> => {
    try {
      const insertData: AgentActivityInsert = {
        agent_name: agentName,
        action,
        status,
        output: output || null,
        metadata: metadata || {},
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('agent_activity')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      const newActivity = data as AgentActivity
      setActivities((prev) => [newActivity, ...prev])
      return newActivity
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to log activity'
      setError(message)
      return null
    }
  }, [])

  // Review and approve/reject activity
  const reviewActivity = useCallback(async (
    activityId: string,
    approved: boolean
  ): Promise<AgentActivity | null> => {
    try {
      const updates = {
        reviewed_at: new Date().toISOString(),
        approved,
        status: approved ? 'completed' : 'needs_input',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('agent_activity')
        .update(updates)
        .eq('id', activityId)
        .select()
        .single()

      if (error) throw error

      const updatedActivity = data as AgentActivity
      setActivities((prev) => prev.map((a) => (a.id === activityId ? updatedActivity : a)))
      return updatedActivity
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to review activity'
      setError(message)
      return null
    }
  }, [])

  // Update activity status
  const updateActivityStatus = useCallback(async (
    activityId: string,
    status: AgentActivityStatus,
    output?: string
  ): Promise<AgentActivity | null> => {
    try {
      const updates: Partial<AgentActivity> = { status }
      if (output !== undefined) {
        updates.output = output
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('agent_activity')
        .update(updates)
        .eq('id', activityId)
        .select()
        .single()

      if (error) throw error

      const updatedActivity = data as AgentActivity
      setActivities((prev) => prev.map((a) => (a.id === activityId ? updatedActivity : a)))
      return updatedActivity
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update activity'
      setError(message)
      return null
    }
  }, [])

  // Delete a task
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agent_tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task'
      setError(message)
      return false
    }
  }, [])

  // Get pending tasks count for an agent
  const getPendingTasksCount = useCallback((agentName: string): number => {
    return tasks.filter(
      (t) => t.agent_name === agentName && t.status !== 'completed'
    ).length
  }, [tasks])

  // Get activities ready for review
  const getActivitiesForReview = useCallback((): AgentActivity[] => {
    return activities.filter((a) => a.status === 'ready_for_review')
  }, [activities])

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchAgentActivity(), fetchAgentTasks(), fetchStats()])
      setLoading(false)
    }
    loadData()
  }, [fetchAgentActivity, fetchAgentTasks, fetchStats])

  return {
    activities,
    tasks,
    stats,
    loading,
    error,
    fetchAgentActivity,
    fetchAgentTasks,
    fetchStats,
    createAgentTask,
    updateTaskStatus,
    logAgentActivity,
    reviewActivity,
    updateActivityStatus,
    deleteTask,
    getPendingTasksCount,
    getActivitiesForReview,
  }
}
