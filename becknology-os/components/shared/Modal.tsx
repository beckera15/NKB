'use client'

import { ReactNode, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw] max-h-[90vh]',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={`relative ${sizeStyles[size]} w-full mx-4 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl animate-fade-in`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            {title && (
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div
      className={`flex items-center justify-end gap-3 pt-4 border-t border-gray-800 mt-4 ${className}`}
    >
      {children}
    </div>
  )
}
