'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WarRoomLayout } from '@/components/layout'
import { WarRoomDashboard } from '@/components/views'
import { TradingView } from '@/components/trading'
import { FitnessView } from '@/components/fitness'
import { TCASCommandView } from '@/components/tcas'
import { WealthView } from '@/components/wealth'
import { FamilyView } from '@/components/family'
import { SettingsView } from '@/components/settings'
import { IntelligenceView } from '@/components/IntelligenceView'
import { EntriesView } from '@/components/EntriesView'
import { LibraryView } from '@/components/LibraryView'
import { GoalsView } from '@/components/GoalsView'
import { CaptureModal } from '@/components/CaptureModal'
import { AuthGuard, isDemoMode, disableDemoMode } from '@/components/AuthGuard'
import { useEntries } from '@/hooks/useEntries'
import { useGoals } from '@/hooks/useGoals'
import { useInsights } from '@/hooks/useInsights'
import { useAuth } from '@/hooks/useAuth'
import { WarRoomView } from '@/lib/keyboard-shortcuts'
import { X, Zap } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<WarRoomView>('warroom')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showCaptureModal, setShowCaptureModal] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [inDemoMode, setInDemoMode] = useState(false)

  const { signOut, isAuthenticated } = useAuth()
  const { entries, stats, createEntry, updateEntry, loading: entriesLoading } = useEntries()
  const { goals, groupedByTimeframe, createGoal, updateGoal, loading: goalsLoading } = useGoals()
  const { insights, loading: insightsLoading } = useInsights()

  // Check demo mode on mount
  useEffect(() => {
    setInDemoMode(isDemoMode())
  }, [])

  const handleLogout = useCallback(async () => {
    // If in demo mode, just disable it and redirect
    if (inDemoMode) {
      disableDemoMode()
      router.push('/login')
      return
    }

    try {
      await signOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }, [signOut, inDemoMode, router])

  const handleExitDemoMode = useCallback(() => {
    disableDemoMode()
    router.push('/login')
  }, [router])

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
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading War Room...</p>
          </div>
        </div>
      )
    }

    switch (currentView) {
      case 'warroom':
        return (
          <WarRoomDashboard
            entries={entries}
            goals={goals}
            insights={insights}
          />
        )
      case 'trading':
        return <TradingView />
      case 'tcas':
        return <TCASCommandView />
      case 'intelligence':
        return (
          <IntelligenceView
            entries={entries}
            insights={insights}
            selectedProject={selectedProject}
          />
        )
      case 'wealth':
        return <WealthView />
      case 'fitness':
        return <FitnessView />
      case 'family':
        return <FamilyView />
      case 'projects':
        return (
          <EntriesView
            entries={entries}
            selectedProject={selectedProject}
            onUpdateEntry={updateEntry}
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
      case 'settings':
        return <SettingsView />
      default:
        return null
    }
  }

  return (
    <AuthGuard>
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Demo Mode Banner */}
        {inDemoMode && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2">
            <div className="flex items-center justify-center gap-3">
              <Zap size={16} />
              <span className="text-sm font-medium">
                Demo Mode - Data is not saved. Configure Supabase for full functionality.
              </span>
              <button
                onClick={handleExitDemoMode}
                className="ml-4 flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition-colors"
              >
                <X size={12} />
                Exit Demo
              </button>
            </div>
          </div>
        )}

        {/* Global drop overlay */}
        {isDraggingFile && (
          <div className="fixed inset-0 z-50 bg-purple-600/20 border-4 border-dashed border-purple-500 flex items-center justify-center pointer-events-none">
            <div className="bg-gray-900/90 px-8 py-6 rounded-2xl text-center">
              <p className="text-2xl font-semibold text-purple-400">Drop file to capture</p>
              <p className="text-gray-400 mt-2">Release to open capture modal</p>
            </div>
          </div>
        )}

        <div className={inDemoMode ? 'pt-10' : ''}>
          <WarRoomLayout
            currentView={currentView}
            onViewChange={setCurrentView}
            onCapture={() => setShowCaptureModal(true)}
            onLogout={handleLogout}
          >
            {renderView()}
          </WarRoomLayout>
        </div>

        <CaptureModal
          isOpen={showCaptureModal}
          onClose={handleModalClose}
          onSubmit={createEntry}
          initialFile={droppedFile}
        />
      </div>
    </AuthGuard>
  )
}
