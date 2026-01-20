'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 hover:bg-purple-500 text-white',
  secondary: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700',
  ghost: 'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  gradient: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading,
  fullWidth,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  )
}
