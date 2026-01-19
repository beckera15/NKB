'use client'

import { useState, useCallback } from 'react'
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
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)

  const { entries, stats, createEntry, updateEntry, loading: entriesLoading } = useEntries()
  const { goals, groupedByTimeframe, createGoal, updateGoal, loading: goalsLoading } = useGoals()
  const { insights, loading: insightsLoading } = useInsights()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDraggingFile(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      setDroppedFile(file)
      setShowCaptureModal(true)
    }
  }, [])

  const handleModalClose = useCallback(() => {
    setShowCaptureModal(false)
    setDroppedFile(null)
  }, [])

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
            onCreateGoal={createGoal}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      className="flex h-screen bg-gray-950 text-white relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global drop overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 bg-purple-600/20 border-4 border-dashed border-purple-500 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/90 px-8 py-6 rounded-2xl text-center">
            <p className="text-2xl font-semibold text-purple-400">Drop file to upload</p>
            <p className="text-gray-400 mt-2">Release to open capture modal</p>
          </div>
        </div>
      )}

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
        onClose={handleModalClose}
        onSubmit={createEntry}
        initialFile={droppedFile}
      />
    </div>
  )
}
