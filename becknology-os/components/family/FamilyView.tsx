'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/shared'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import {
  Users,
  Calendar,
  Home,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  CalendarDays,
  Hammer,
  Leaf,
  Sparkles,
} from 'lucide-react'

type ViewTab = 'calendar' | 'property' | 'maintenance'

export function FamilyView() {
  const [activeTab, setActiveTab] = useState<ViewTab>('calendar')

  // Mock data - would come from hooks
  const upcomingEvents = [
    { id: '1', title: "Nikki's Birthday", date: '2026-02-15', type: 'birthday', daysUntil: 26 },
    { id: '2', title: 'Family Dinner', date: '2026-01-25', type: 'event', daysUntil: 5 },
    { id: '3', title: 'Anniversary', date: '2026-03-20', type: 'anniversary', daysUntil: 59 },
    { id: '4', title: 'Kids School Event', date: '2026-01-28', type: 'event', daysUntil: 8 },
  ]

  const propertyTasks = [
    { id: '1', title: 'Fix garage door sensor', priority: 'high', category: 'repair', status: 'pending' },
    { id: '2', title: 'Clean gutters', priority: 'medium', category: 'maintenance', status: 'pending' },
    { id: '3', title: 'Paint bedroom', priority: 'low', category: 'improvement', status: 'in_progress' },
    { id: '4', title: 'Replace HVAC filter', priority: 'medium', category: 'maintenance', status: 'completed' },
  ]

  const maintenanceSchedule = [
    { task: 'HVAC Filter', frequency: 'Monthly', lastDone: '2025-12-20', nextDue: '2026-01-20', status: 'due' },
    { task: 'Smoke Detector Test', frequency: 'Monthly', lastDone: '2026-01-01', nextDue: '2026-02-01', status: 'ok' },
    { task: 'Gutter Cleaning', frequency: 'Quarterly', lastDone: '2025-10-15', nextDue: '2026-01-15', status: 'overdue' },
    { task: 'Lawn Service', frequency: 'Weekly', lastDone: '2026-01-18', nextDue: '2026-01-25', status: 'ok' },
    { task: 'Pest Control', frequency: 'Quarterly', lastDone: '2025-12-01', nextDue: '2026-03-01', status: 'ok' },
  ]

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'birthday':
        return <span className="text-lg">🎂</span>
      case 'anniversary':
        return <span className="text-lg">💕</span>
      default:
        return <Calendar size={18} className="text-purple-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'repair':
        return <Wrench size={16} />
      case 'improvement':
        return <Sparkles size={16} />
      case 'yard':
        return <Leaf size={16} />
      case 'maintenance':
        return <Hammer size={16} />
      default:
        return <Home size={16} />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="error" size="sm">Overdue</Badge>
      case 'due':
        return <Badge variant="warning" size="sm">Due Now</Badge>
      default:
        return <Badge variant="success" size="sm">OK</Badge>
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="text-purple-400" />
            Family & Property
          </h1>
          <p className="text-gray-400">Manage family events and property maintenance</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'calendar' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('calendar')}
            icon={<CalendarDays size={16} />}
          >
            Calendar
          </Button>
          <Button
            variant={activeTab === 'property' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('property')}
            icon={<Home size={16} />}
          >
            Property Tasks
          </Button>
          <Button
            variant={activeTab === 'maintenance' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('maintenance')}
            icon={<Wrench size={16} />}
          >
            Maintenance
          </Button>
        </div>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Events */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader
                  title="Upcoming Events"
                  icon={<Calendar size={20} />}
                  action={<Button size="sm" variant="ghost" icon={<Plus size={14} />}>Add Event</Button>}
                />
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            {getEventIcon(event.type)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{event.title}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={event.daysUntil <= 7 ? 'warning' : 'default'}
                          size="sm"
                        >
                          {event.daysUntil === 0 ? 'Today' : `${event.daysUntil} days`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <Card variant="glass">
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">{upcomingEvents.length}</p>
                    <p className="text-sm text-gray-400">Upcoming Events</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Important Dates" />
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Next Event</span>
                      <span className="text-white">5 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">This Month</span>
                      <span className="text-white">2 events</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Birthdays Soon</span>
                      <span className="text-white">1 coming up</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Property Tasks View */}
        {activeTab === 'property' && (
          <Card>
            <CardHeader
              title="Property Tasks"
              subtitle={`${propertyTasks.filter(t => t.status !== 'completed').length} pending tasks`}
              icon={<Home size={20} />}
              action={<Button size="sm" variant="ghost" icon={<Plus size={14} />}>Add Task</Button>}
            />
            <CardContent>
              <div className="space-y-3">
                {propertyTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      task.status === 'completed' ? 'bg-gray-800/50' : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        task.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {task.status === 'completed' ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          getCategoryIcon(task.category)
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getPriorityColor(task.priority) as 'default' | 'success' | 'warning' | 'error'} size="sm">
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">{task.category}</span>
                        </div>
                      </div>
                    </div>
                    {task.status !== 'completed' && (
                      <Button size="sm" variant="ghost">
                        Complete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance Schedule View */}
        {activeTab === 'maintenance' && (
          <Card>
            <CardHeader
              title="Maintenance Schedule"
              subtitle="Regular home maintenance tasks"
              icon={<Wrench size={20} />}
              action={<Button size="sm" variant="ghost" icon={<Plus size={14} />}>Add Schedule</Button>}
            />
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                      <th className="pb-3 font-medium">Task</th>
                      <th className="pb-3 font-medium">Frequency</th>
                      <th className="pb-3 font-medium">Last Done</th>
                      <th className="pb-3 font-medium">Next Due</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceSchedule.map((item, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 text-white font-medium">{item.task}</td>
                        <td className="py-3 text-gray-400">{item.frequency}</td>
                        <td className="py-3 text-gray-400">{item.lastDone}</td>
                        <td className="py-3 text-gray-400">{item.nextDue}</td>
                        <td className="py-3">{getStatusBadge(item.status)}</td>
                        <td className="py-3">
                          <Button size="sm" variant="ghost">
                            Mark Done
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
