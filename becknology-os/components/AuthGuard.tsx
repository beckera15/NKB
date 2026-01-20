'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
}

// Check if demo mode is enabled
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('becknology_demo_mode') === 'true'
}

// Enable demo mode
export function enableDemoMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('becknology_demo_mode', 'true')
  }
}

// Disable demo mode
export function disableDemoMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('becknology_demo_mode')
  }
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [demoMode, setDemoMode] = useState(false)
  const [checkingDemo, setCheckingDemo] = useState(true)

  // Check for demo mode on mount
  useEffect(() => {
    setDemoMode(isDemoMode())
    setCheckingDemo(false)
  }, [])

  useEffect(() => {
    if (!loading && !checkingDemo && !isAuthenticated && !demoMode) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, demoMode, checkingDemo, router])

  // Show loading state while checking auth
  if (loading || checkingDemo) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow access if authenticated OR in demo mode
  if (isAuthenticated || demoMode) {
    return <>{children}</>
  }

  // Don't render children if not authenticated (will redirect)
  return null
}
