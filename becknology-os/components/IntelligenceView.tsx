'use client'

import { Brain, AlertTriangle, HelpCircle, TrendingUp, Activity } from 'lucide-react'
import type { Database } from '@/types/database'

type Entry = Database['public']['Tables']['entries']['Row']
type Insight = Database['public']['Tables']['insights']['Row']

interface IntelligenceViewProps {
  entries: Entry[]
  insights: Insight[]
  selectedProject: string | null
}

const PROJECTS = [
  'TCAS', 'Trading', 'Becknology', 'NKB PR',
  'Nikki GF Content', 'Property/Home', 'Family', 'Wealth Building'
]

export function IntelligenceView({ entries, insights, selectedProject }: IntelligenceViewProps) {
  const filteredEntries = selectedProject
    ? entries.filter(e => e.project === selectedProject)
    : entries

  const criticalItems = filteredEntries.filter(e => e.priority === 'critical')
  const pendingDecisions = filteredEntries.filter(e => e.type === 'decision' && e.status !== 'completed')
  const themes = insights.filter(i => i.type === 'theme')
  const questions = insights.filter(i => i.type === 'question')

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const projectActivity = PROJECTS.map(project => ({
    name: project,
    count: entries.filter(e => e.project === project).length,
    recent: entries.filter(e => e.project === project &&
      new Date(e.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/20">
        <h1 className="text-2xl font-bold">{getGreeting()}, Andrew</h1>
        <p className="text-gray-400 mt-1">
          {filteredEntries.length} entries across your system. {criticalItems.length} items need attention.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <Section title="AI Insights" icon={Brain}>
          {insights.length === 0 ? (
            <EmptyState text="No insights generated yet" />
          ) : (
            <div className="space-y-3">
              {insights.slice(0, 5).map(insight => (
                <div key={insight.id} className="p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-purple-400 uppercase">{insight.type}</span>
                  <h4 className="font-medium mt-1">{insight.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">{insight.description}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Strategic Questions */}
        <Section title="Strategic Questions" icon={HelpCircle}>
          {questions.length === 0 ? (
            <EmptyState text="No strategic questions yet" />
          ) : (
            <div className="space-y-3">
              {questions.map(q => (
                <div key={q.id} className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-sm">{q.title}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Themes */}
        <Section title="Emerging Themes" icon={TrendingUp}>
          {themes.length === 0 ? (
            <EmptyState text="No themes identified yet" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {themes.map(theme => (
                <span
                  key={theme.id}
                  className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm"
                >
                  {theme.title}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Critical Items */}
        <Section title="Critical Items" icon={AlertTriangle} highlight>
          {criticalItems.length === 0 ? (
            <EmptyState text="No critical items" />
          ) : (
            <div className="space-y-2">
              {criticalItems.map(item => (
                <div key={item.id} className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{item.project}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Pending Decisions */}
        <Section title="Pending Decisions" icon={HelpCircle}>
          {pendingDecisions.length === 0 ? (
            <EmptyState text="No pending decisions" />
          ) : (
            <div className="space-y-2">
              {pendingDecisions.map(decision => (
                <div key={decision.id} className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <h4 className="font-medium">{decision.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{decision.project}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Project Activity Grid */}
        <Section title="Project Activity" icon={Activity} className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {projectActivity.map(project => (
              <div
                key={project.name}
                className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <h4 className="font-medium text-sm truncate">{project.name}</h4>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-bold text-purple-400">{project.count}</span>
                  {project.recent > 0 && (
                    <span className="text-xs text-green-400">+{project.recent} this week</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
  highlight = false,
  className = ''
}: {
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
  highlight?: boolean
  className?: string
}) {
  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className={highlight ? 'text-red-400' : 'text-purple-400'} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-gray-500 text-sm text-center py-4">{text}</p>
  )
}
