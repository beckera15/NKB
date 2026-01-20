import { useEffect, useCallback } from 'react'

export type WarRoomView =
  | 'warroom'
  | 'trading'
  | 'tcas'
  | 'intelligence'
  | 'wealth'
  | 'fitness'
  | 'family'
  | 'projects'
  | 'goals'
  | 'settings'

export interface KeyboardShortcut {
  key: string
  description: string
  view?: WarRoomView
  action?: () => void
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'h', description: 'War Room Dashboard', view: 'warroom' },
  { key: 't', description: 'Trading', view: 'trading' },
  { key: 'c', description: 'TCAS Command', view: 'tcas' },
  { key: 'i', description: 'Intelligence', view: 'intelligence' },
  { key: 'w', description: 'Wealth', view: 'wealth' },
  { key: 'f', description: 'Fitness', view: 'fitness' },
  { key: 'a', description: 'Family', view: 'family' },
  { key: 'p', description: 'Projects', view: 'projects' },
  { key: 'g', description: 'Goals', view: 'goals' },
  { key: 's', description: 'Settings', view: 'settings' },
  { key: '/', description: 'Search' },
  { key: '?', description: 'Help / Shortcuts' },
  { key: 'n', description: 'Nova Chat' },
  { key: 'Escape', description: 'Close Modal' },
]

interface UseKeyboardShortcutsProps {
  onViewChange?: (view: WarRoomView) => void
  onSearch?: () => void
  onHelp?: () => void
  onNovaChat?: () => void
  onCapture?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onViewChange,
  onSearch,
  onHelp,
  onNovaChat,
  onCapture,
  enabled = true,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Ignore if user is typing in an input or textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Ignore if modifier keys are pressed (except for specific combos)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      const key = event.key.toLowerCase()

      // View shortcuts
      const viewShortcuts: Record<string, WarRoomView> = {
        h: 'warroom',
        t: 'trading',
        c: 'tcas',
        i: 'intelligence',
        w: 'wealth',
        f: 'fitness',
        a: 'family',
        p: 'projects',
        g: 'goals',
        s: 'settings',
      }

      if (viewShortcuts[key] && onViewChange) {
        event.preventDefault()
        onViewChange(viewShortcuts[key])
        return
      }

      // Special shortcuts
      if (key === '/' && onSearch) {
        event.preventDefault()
        onSearch()
        return
      }

      if (key === '?' && onHelp) {
        event.preventDefault()
        onHelp()
        return
      }

      if (key === 'n' && onNovaChat) {
        event.preventDefault()
        onNovaChat()
        return
      }

      if (key === 'q' && onCapture) {
        event.preventDefault()
        onCapture()
        return
      }
    },
    [enabled, onViewChange, onSearch, onHelp, onNovaChat, onCapture]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function getShortcutKey(key: string): string {
  const keyMap: Record<string, string> = {
    '/': '/',
    '?': '?',
    Escape: 'Esc',
  }
  return keyMap[key] || key.toUpperCase()
}
