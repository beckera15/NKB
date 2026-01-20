'use client'

import { ReactNode } from 'react'
import { Construction } from 'lucide-react'

interface PlaceholderViewProps {
  title: string
  description: string
  icon?: ReactNode
  comingSoon?: string[]
}

export function PlaceholderView({
  title,
  description,
  icon,
  comingSoon = [],
}: PlaceholderViewProps) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6">
          {icon || <Construction size={48} className="text-purple-400" />}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400 mb-6">{description}</p>
        {comingSoon.length > 0 && (
          <div className="text-left bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Coming Soon:</h3>
            <ul className="space-y-2">
              {comingSoon.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
