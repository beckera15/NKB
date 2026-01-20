'use client'

import { useState } from 'react'
import { CheckCircle, Circle, Brain, LineChart, Settings, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { PRE_SESSION_CHECKLIST, ChecklistItem } from '@/lib/nova-prompts'

interface PreSessionChecklistProps {
  onComplete: (
    checklist: Record<string, boolean>,
    bias: 'bullish' | 'bearish' | 'neutral',
    levels: Record<string, number>
  ) => void
  onCancel?: () => void
}

export function PreSessionChecklist({ onComplete, onCancel }: PreSessionChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [dailyBias, setDailyBias] = useState<'bullish' | 'bearish' | 'neutral' | null>(null)
  const [keyLevels, setKeyLevels] = useState<Record<string, string>>({
    pdh: '',
    pdl: '',
    pwh: '',
    pwl: '',
  })
  const [expandedCategory, setExpandedCategory] = useState<string | null>('mental')

  const categories = [
    { id: 'mental', label: 'Mental Preparation', icon: Brain },
    { id: 'market', label: 'Market Analysis', icon: LineChart },
    { id: 'technical', label: 'Technical Setup', icon: Settings },
    { id: 'plan', label: 'Trading Plan', icon: ClipboardList },
  ]

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getItemsByCategory = (category: string): ChecklistItem[] => {
    return PRE_SESSION_CHECKLIST.filter((item) => item.category === category)
  }

  const getCategoryProgress = (category: string) => {
    const items = getItemsByCategory(category)
    const checked = items.filter((item) => checkedItems[item.id]).length
    return { checked, total: items.length }
  }

  const isComplete = () => {
    const requiredItems = PRE_SESSION_CHECKLIST.filter((item) => item.required)
    const allRequiredChecked = requiredItems.every((item) => checkedItems[item.id])
    const hasBias = dailyBias !== null
    const hasLevels = Object.values(keyLevels).every((v) => v !== '')
    return allRequiredChecked && hasBias && hasLevels
  }

  const handleComplete = () => {
    const levels: Record<string, number> = {}
    Object.entries(keyLevels).forEach(([key, value]) => {
      levels[key] = parseFloat(value)
    })
    onComplete(checkedItems, dailyBias!, levels)
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Pre-Session Checklist</h2>
        <p className="text-sm text-gray-400 mt-1">
          Complete this checklist before trading. Required items are marked with *.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Categories */}
        {categories.map((category) => {
          const Icon = category.icon
          const progress = getCategoryProgress(category.id)
          const isExpanded = expandedCategory === category.id

          return (
            <div key={category.id} className="border border-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-purple-400" />
                  <span className="font-medium text-white">{category.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${progress.checked === progress.total ? 'text-green-400' : 'text-gray-400'}`}>
                    {progress.checked}/{progress.total}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 space-y-2">
                  {getItemsByCategory(category.id).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
                    >
                      {checkedItems[item.id] ? (
                        <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle size={20} className="text-gray-600 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${checkedItems[item.id] ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                        {item.label}
                        {item.required && <span className="text-purple-400 ml-1">*</span>}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Daily Bias */}
        <div className="border border-gray-800 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3">
            Daily Bias <span className="text-purple-400">*</span>
          </h3>
          <div className="flex gap-2">
            {(['bullish', 'bearish', 'neutral'] as const).map((bias) => (
              <button
                key={bias}
                onClick={() => setDailyBias(bias)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm capitalize transition-all ${
                  dailyBias === bias
                    ? bias === 'bullish'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : bias === 'bearish'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {bias}
              </button>
            ))}
          </div>
        </div>

        {/* Key Levels */}
        <div className="border border-gray-800 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3">
            Key Levels <span className="text-purple-400">*</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">PDH (Previous Day High)</label>
              <input
                type="number"
                step="0.01"
                value={keyLevels.pdh}
                onChange={(e) => setKeyLevels((prev) => ({ ...prev, pdh: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="e.g., 5902"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">PDL (Previous Day Low)</label>
              <input
                type="number"
                step="0.01"
                value={keyLevels.pdl}
                onChange={(e) => setKeyLevels((prev) => ({ ...prev, pdl: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="e.g., 5868"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">PWH (Previous Week High)</label>
              <input
                type="number"
                step="0.01"
                value={keyLevels.pwh}
                onChange={(e) => setKeyLevels((prev) => ({ ...prev, pwh: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="e.g., 5925"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">PWL (Previous Week Low)</label>
              <input
                type="number"
                step="0.01"
                value={keyLevels.pwl}
                onChange={(e) => setKeyLevels((prev) => ({ ...prev, pwl: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="e.g., 5845"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 flex gap-3">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button
          variant="gradient"
          onClick={handleComplete}
          disabled={!isComplete()}
          className="flex-1"
        >
          Complete & Start Session
        </Button>
      </div>
    </div>
  )
}
