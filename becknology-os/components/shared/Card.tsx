'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'gradient' | 'glow' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  hover?: boolean
}

const variantStyles = {
  default: 'bg-gray-900 border border-gray-800',
  glass: 'glass',
  gradient: 'bg-gradient-to-br from-gray-900 via-gray-850 to-gray-800 border border-gray-700/50',
  glow: 'bg-gray-900 border border-purple-500/30 glow',
  elevated: 'bg-gray-900 border border-gray-800 shadow-xl shadow-black/20',
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
  hover = false,
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-200'
  const interactive = onClick ? 'cursor-pointer hover:border-purple-500/50' : ''
  const hoverEffect = hover ? 'card-hover' : ''

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${interactive} ${hoverEffect} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
  gradient?: boolean
}

export function CardHeader({ title, subtitle, icon, action, gradient = false }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`p-2 rounded-lg ${gradient ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10' : 'bg-purple-500/10'} text-purple-400`}>
            {icon}
          </div>
        )}
        <div>
          <h3 className={`font-semibold ${gradient ? 'gradient-text' : 'text-white'}`}>{title}</h3>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>
}

// New: Stat Card for Bloomberg-style metrics
interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: ReactNode
  variant?: 'default' | 'positive' | 'negative' | 'neutral'
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
}: StatCardProps) {
  const variantColors = {
    default: 'border-gray-700',
    positive: 'border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent',
    negative: 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent',
    neutral: 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent',
  }

  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  }

  const changeVariant = change === undefined ? 'neutral' : change >= 0 ? 'positive' : 'negative'

  return (
    <div className={`p-4 rounded-xl bg-gray-900 border ${variantColors[variant]} transition-all hover:border-opacity-60`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        {icon && <span className="text-gray-500">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {change !== undefined && (
          <span className={`text-sm ${changeColors[changeVariant]}`}>
            {change >= 0 ? '+' : ''}{change}%
            {changeLabel && <span className="text-gray-500 ml-1">{changeLabel}</span>}
          </span>
        )}
      </div>
    </div>
  )
}
