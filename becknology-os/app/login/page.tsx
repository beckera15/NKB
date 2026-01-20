'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { enableDemoMode } from '@/components/AuthGuard'
import { Zap, ArrowLeft, Eye, EyeOff } from 'lucide-react'

type ViewMode = 'login' | 'signup' | 'forgot-password'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp, resetPassword, isAuthenticated, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      if (viewMode === 'forgot-password') {
        await resetPassword(email)
        setSuccess('Password reset email sent! Check your inbox.')
        setEmail('')
      } else if (viewMode === 'signup') {
        await signUp(email, password)
        setSuccess('Check your email to confirm your account')
      } else {
        await signIn(email, password)
        router.push('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoMode = () => {
    enableDemoMode()
    router.push('/')
  }

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Don't show login if already authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold gradient-text">BECKNOLOGY</span>
          </div>
          <p className="text-gray-400">War Room Command Center</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {/* Back button for forgot password */}
          {viewMode === 'forgot-password' && (
            <button
              type="button"
              onClick={() => {
                setViewMode('login')
                setError(null)
                setSuccess(null)
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </button>
          )}

          <h2 className="text-xl font-semibold mb-6 text-center">
            {viewMode === 'forgot-password'
              ? 'Reset Password'
              : viewMode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {viewMode !== 'forgot-password' && (
              <div>
                <label className="text-xs text-gray-500 uppercase mb-2 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    minLength={6}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {viewMode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot-password')
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="text-sm p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm p-3 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? 'Please wait...'
                : viewMode === 'forgot-password'
                  ? 'Send Reset Email'
                  : viewMode === 'signup'
                    ? 'Sign Up'
                    : 'Sign In'}
            </button>
          </form>

          {/* Toggle between login/signup */}
          {viewMode !== 'forgot-password' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setViewMode(viewMode === 'login' ? 'signup' : 'login')
                  setError(null)
                  setSuccess(null)
                }}
                className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
              >
                {viewMode === 'signup'
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-500">or</span>
            </div>
          </div>

          {/* Demo Mode Button */}
          <button
            type="button"
            onClick={handleDemoMode}
            className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500/50 rounded-lg font-medium transition-all text-gray-300 hover:text-white"
          >
            <span className="flex items-center justify-center gap-2">
              <Zap size={18} className="text-purple-400" />
              Enter Demo Mode
            </span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Explore the War Room without an account
          </p>
        </div>

        {/* Supabase config hint */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm font-medium mb-1">Supabase Not Configured</p>
          <p className="text-yellow-400/70 text-xs">
            To enable authentication, update <code className="bg-gray-800 px-1 rounded">.env.local</code> with
            your Supabase URL and anon key. Use Demo Mode to explore the app.
          </p>
        </div>
      </div>
    </div>
  )
}
