'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/shared'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye,
} from 'lucide-react'
import type { AgentActivity } from '@/hooks/useTCAS'
import { TCAS_AGENTS } from '@/lib/tcas-agents'

interface AgentActivityFeedProps {
  activities: AgentActivity[]
  onReview?: (activity: AgentActivity) => void
  loading?: boolean
  maxItems?: number
}

export function AgentActivityFeed({
  activities,
  onReview,
  loading = false,
  maxItems = 10,
}: AgentActivityFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getStatusConfig = (status: AgentActivity['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'gray', label: 'Pending' }
      case 'in_progress':
        return { icon: Loader2, color: 'blue', label: 'In Progress', animate: true }
      case 'ready_for_review':
        return { icon: Eye, color: 'yellow', label: 'Ready for Review' }
      case 'completed':
        return { icon: CheckCircle2, color: 'green', label: 'Completed' }
      case 'needs_input':
        return { icon: AlertCircle, color: 'orange', label: 'Needs Input' }
      default:
        return { icon: Activity, color: 'gray', label: 'Unknown' }
    }
  }

  const getAgentInfo = (agentName: string) => {
    return TCAS_AGENTS.find((a) => a.id === agentName.toLowerCase() || a.name === agentName)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const displayActivities = activities.slice(0, maxItems)

  if (loading) {
    return (
      <Card>
        <CardHeader
          title="Agent Activity"
          subtitle="What your AI team is working on"
          icon={<Activity size={20} />}
        />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span className="ml-2 text-gray-400">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Agent Activity"
        subtitle="What your AI team is working on"
        icon={<Activity size={20} />}
      />
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No agent activity yet</p>
            <p className="text-sm mt-1">Assign tasks to your agents to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayActivities.map((activity) => {
              const statusConfig = getStatusConfig(activity.status)
              const agent = getAgentInfo(activity.agent_name)
              const isExpanded = expandedId === activity.id
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={activity.id}
                  className={`p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors ${
                    activity.status === 'ready_for_review' ? 'ring-1 ring-yellow-500/50' : ''
                  }`}
                >
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                  >
                    {/* Agent Avatar */}
                    <div className="text-xl">{agent?.avatar || '🤖'}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {agent?.name || activity.agent_name}
                        </span>
                        <Badge
                          variant={
                            statusConfig.color === 'green'
                              ? 'success'
                              : statusConfig.color === 'yellow'
                              ? 'warning'
                              : statusConfig.color === 'blue'
                              ? 'info'
                              : 'default'
                          }
                          size="sm"
                        >
                          <StatusIcon
                            size={12}
                            className={statusConfig.animate ? 'animate-spin' : ''}
                          />
                          <span className="ml-1">{statusConfig.label}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300 truncate">{activity.action}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock size={10} />
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>

                    {/* Expand Arrow */}
                    <ChevronRight
                      size={16}
                      className={`text-gray-500 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && activity.output && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-900 p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                        {activity.output}
                      </pre>
                      {activity.status === 'ready_for_review' && onReview && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onReview(activity)
                            }}
                          >
                            Review & Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (activity.output) {
                                navigator.clipboard.writeText(activity.output)
                              }
                            }}
                          >
                            Copy to Clipboard
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
