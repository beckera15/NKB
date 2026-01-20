'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/shared'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { Badge } from '@/components/shared/Badge'
import {
  ListTodo,
  Plus,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { TCAS_AGENTS, type AgentTaskPriority } from '@/lib/tcas-agents'
import type { AgentTask } from '@/hooks/useTCAS'

interface TaskAssignmentProps {
  tasks: AgentTask[]
  onCreateTask: (agentName: string, task: string, priority: AgentTaskPriority, dueBy?: string) => Promise<void>
  onUpdateStatus?: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => Promise<void>
  loading?: boolean
}

export function TaskAssignment({
  tasks,
  onCreateTask,
  onUpdateStatus,
  loading = false,
}: TaskAssignmentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [priority, setPriority] = useState<AgentTaskPriority>('normal')
  const [dueBy, setDueBy] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pendingTasks = tasks.filter((t) => t.status !== 'completed').slice(0, 5)

  const handleSubmit = async () => {
    if (!selectedAgent || !taskDescription.trim()) return

    setIsSubmitting(true)
    try {
      await onCreateTask(selectedAgent, taskDescription, priority, dueBy || undefined)
      setIsModalOpen(false)
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedAgent('')
    setTaskDescription('')
    setPriority('normal')
    setDueBy('')
  }

  const getPriorityConfig = (priority: AgentTaskPriority) => {
    switch (priority) {
      case 'critical':
        return { color: 'red', label: 'Critical' }
      case 'high':
        return { color: 'orange', label: 'High' }
      case 'normal':
        return { color: 'blue', label: 'Normal' }
      case 'low':
        return { color: 'gray', label: 'Low' }
    }
  }

  const getStatusIcon = (status: AgentTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} className="text-gray-400" />
      case 'in_progress':
        return <Loader2 size={14} className="text-blue-400 animate-spin" />
      case 'completed':
        return <CheckCircle2 size={14} className="text-green-400" />
    }
  }

  const getAgentInfo = (agentName: string) => {
    return TCAS_AGENTS.find((a) => a.id === agentName.toLowerCase() || a.name === agentName)
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Active Tasks"
          subtitle="Assigned work for your AI team"
          icon={<ListTodo size={20} />}
          action={
            <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>
              New Task
            </Button>
          }
        />
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active tasks</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsModalOpen(true)}
                className="mt-2"
              >
                Assign a task
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => {
                const agent = getAgentInfo(task.agent_name)
                const priorityConfig = getPriorityConfig(task.priority)

                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                  >
                    <span className="text-lg">{agent?.avatar || '🤖'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{task.task}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{agent?.name || task.agent_name}</span>
                        {task.priority !== 'normal' && (
                          <Badge
                            variant={
                              priorityConfig.color === 'red' ? 'error' :
                              priorityConfig.color === 'orange' ? 'warning' :
                              'default'
                            }
                            size="sm"
                          >
                            {priorityConfig.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {getStatusIcon(task.status)}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Assign New Task"
        size="md"
      >
        <div className="space-y-4">
          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assign to Agent
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TCAS_AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedAgent === agent.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                  }`}
                >
                  <span className="text-xl">{agent.avatar}</span>
                  <p className="font-medium text-white text-sm mt-1">{agent.name}</p>
                  <p className="text-xs text-gray-500 truncate">{agent.role}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Task Description
            </label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder={
                selectedAgent === 'brad'
                  ? 'e.g., Draft outreach emails for automotive manufacturers in Texas'
                  : selectedAgent === 'chase'
                  ? 'e.g., Write a Python script to parse pricing from distributor PDFs'
                  : 'Describe what you need the agent to do...'
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              rows={4}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(['low', 'normal', 'high', 'critical'] as AgentTaskPriority[]).map((p) => {
                const config = getPriorityConfig(p)
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-4 py-2 rounded-lg border capitalize transition-all ${
                      priority === p
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-750'
                    }`}
                  >
                    {p === 'critical' && <AlertTriangle size={14} className="inline mr-1" />}
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Due By (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due By (optional)
            </label>
            <input
              type="text"
              value={dueBy}
              onChange={(e) => setDueBy(e.target.value)}
              placeholder="e.g., End of day, Tomorrow morning, Friday"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedAgent || !taskDescription.trim() || isSubmitting}
              icon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              fullWidth
            >
              {isSubmitting ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
