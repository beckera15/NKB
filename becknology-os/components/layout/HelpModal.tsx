'use client'

import { Modal } from '@/components/shared/Modal'
import { KEYBOARD_SHORTCUTS, getShortcutKey } from '@/lib/keyboard-shortcuts'
import { Keyboard, Command } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const viewShortcuts = KEYBOARD_SHORTCUTS.filter((s) => s.view)
  const actionShortcuts = KEYBOARD_SHORTCUTS.filter((s) => !s.view)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="space-y-6">
        {/* Navigation shortcuts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Command size={16} className="text-purple-400" />
            <h3 className="font-semibold text-white">Navigation</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {viewShortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg"
              >
                <span className="text-sm text-gray-300">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-purple-400">
                  {getShortcutKey(shortcut.key)}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Action shortcuts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Keyboard size={16} className="text-purple-400" />
            <h3 className="font-semibold text-white">Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {actionShortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg"
              >
                <span className="text-sm text-gray-300">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-purple-400">
                  {getShortcutKey(shortcut.key)}
                </kbd>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-300">Quick Capture</span>
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-purple-400">
                Q
              </kbd>
            </div>
          </div>
        </div>

        {/* Pro tips */}
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <h4 className="font-medium text-purple-400 mb-2">Pro Tips</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs font-mono">N</kbd> anywhere to summon Nova</li>
            <li>Market ticker pauses on hover for easy reading</li>
            <li>Click any symbol in the ticker for a mini-chart</li>
            <li>Drag and drop files anywhere to capture them</li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}
