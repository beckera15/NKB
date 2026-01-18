'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { IntelligenceView } from '@/components/IntelligenceView'
import { EntriesView } from '@/components/EntriesView'
import { LibraryView } from '@/components/LibraryView'
import { GoalsView } from '@/components/GoalsView'
import { CaptureModal } from '@/components/CaptureModal'
import { useEntries } from '@/hooks/useEntries'
import { useGoals } from '@/hooks/useGoals'
import { useInsights } from '@/hooks/useInsights'

type View = 'intelligence' | 'entries' | 'library' | 'goals'

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('intelligence')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showCaptureModal, setShowCaptureModal] = useState(false)

  const { entries, stats, createEntry, updateEntry, loading: entriesLoading } = useEntries()
  const { goals, groupedByTimeframe, updateGoal, loading: goalsLoading } = useGoals()
  const { insights, loading: insightsLoading } = useInsights()

  const isLoading = entriesLoading || goalsLoading || insightsLoading

  const renderView = () => {
    switch (currentView) {
      case 'intelligence':
        return (
          <IntelligenceView
            entries={entries}
            insights={insights}
            selectedProject={selectedProject}
          />
        )
      case 'entries':
        return (
          <EntriesView
            entries={entries}
            selectedProject={selectedProject}
            onUpdateEntry={updateEntry}
          />
        )
      case 'library':
        return (
          <LibraryView
            entries={entries}
            selectedProject={selectedProject}
          />
        )
      case 'goals':
        return (
          <GoalsView
            goals={goals}
            groupedByTimeframe={groupedByTimeframe}
            selectedProject={selectedProject}
            onUpdateGoal={updateGoal}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        stats={stats}
        onCapture={() => setShowCaptureModal(true)}
      />

      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        ) : (
          renderView()
        )}
      </main>

      <CaptureModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        onSubmit={createEntry}
      />
    </div>
  )
}
