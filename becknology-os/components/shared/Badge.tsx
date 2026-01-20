'use client'

import { ReactNode } from 'react'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple'
  | 'pink'
  | 'gradient'

type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: ReactNode
  pulse?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-700 text-gray-300',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  pink: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
  gradient: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  pulse,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away'
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig = {
    online: { variant: 'success' as BadgeVariant, text: 'Online' },
    offline: { variant: 'default' as BadgeVariant, text: 'Offline' },
    busy: { variant: 'error' as BadgeVariant, text: 'Busy' },
    away: { variant: 'warning' as BadgeVariant, text: 'Away' },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} pulse={status === 'online'}>
      {label || config.text}
    </Badge>
  )
}
