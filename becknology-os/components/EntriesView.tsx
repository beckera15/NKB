'use client'

import { useState, useEffect } from 'react'
import {
  X,
  FileText,
  Image,
  Video,
  File,
  ExternalLink,
  MessageCircle,
  Lightbulb,
  CheckSquare,
  HelpCircle,
  Link as LinkIcon,
  Camera,
  Search,
  Mic,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { Database } from '@/types/database'
import { ENTRY_TYPES } from '@/lib/constants'

type Entry = Database['public']['Tables']['entries']['Row']

interface EntriesViewProps {
  entries: Entry[]
  selectedProject: string | null
  onUpdateEntry: (id: string, updates: Partial<Entry>) => Promise<Entry | void>
}

const STATUSES = ['inbox', 'action', 'reference', 'archive', 'completed']
const TYPES = ENTRY_TYPES.map(t => t.id)
const PRIORITIES = ['low', 'medium', 'high', 'critical']

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  thought: MessageCircle,
  idea: Lightbulb,
  decision: HelpCircle,
  task: CheckSquare,
  note: FileText,
  media: Image,
  screenshot: Camera,
  link: LinkIcon,
  research: Search,
  voice_memo: Mic,
  video: Video,
}

export function EntriesView({ entries, selectedProject, onUpdateEntry }: EntriesViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [isOcrExpanded, setIsOcrExpanded] = useState(false)

  // Sync selected entry with real-time updates
  useEffect(() => {
    if (selectedEntry) {
      const updated = entries.find(e => e.id === selectedEntry.id)
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedEntry)) {
        setSelectedEntry(updated)
      } else if (!updated) {
        // Entry was deleted
        setSelectedEntry(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries])

  const filteredEntries = entries.filter(entry => {
    if (selectedProject && entry.project !== selectedProject) return false
    if (statusFilter !== 'all' && entry.status !== statusFilter) return false
    if (typeFilter !== 'all' && entry.type !== typeFilter) return false
    return true
  })

  const getTypeIcon = (type: string | null) => {
    return TYPE_ICONS[type || 'note'] || FileText
  }

  const getTypeLabel = (type: string | null) => {
    const entryType = ENTRY_TYPES.find(t => t.id === type)
    return entryType?.label || 'Note'
  }

  return (
    <div className="flex h-full">
      {/* Entry List */}
      <div className={`flex-1 flex flex-col ${selectedEntry ? 'border-r border-gray-800' : ''}`}>
        {/* Filters */}
        <div className="p-4 border-b border-gray-800 flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Types</option>
            {TYPES.map(t => (
              <option key={t} value={t}>{getTypeLabel(t)}</option>
            ))}
          </select>

          <span className="text-sm text-gray-400 ml-auto self-center">
            {filteredEntries.length} entries
          </span>
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No entries found
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredEntries.map(entry => {
                const Icon = getTypeIcon(entry.type)
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`w-full p-4 text-left hover:bg-gray-800/50 transition-colors ${
                      selectedEntry?.id === entry.id ? 'bg-purple-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={18} className="text-gray-500 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{entry.title || 'Untitled'}</h4>
                        <p className="text-sm text-gray-400 truncate mt-1">
                          {entry.content || 'No content'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            entry.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                            entry.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            entry.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {entry.priority}
                          </span>
                          {entry.type === 'link' && entry.source_url && (
                            <span className="text-xs text-purple-400">
                              <LinkIcon size={12} className="inline mr-1" />
                              link
                            </span>
                          )}
                          {entry.ocr_text && (
                            <span className="text-xs text-purple-400">
                              <Camera size={12} className="inline mr-1" />
                              OCR
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{entry.project}</span>
                          <span className="text-xs text-gray-600">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedEntry && (
        <div className="w-96 flex flex-col bg-gray-900/50">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold">Entry Details</h3>
            <button
              onClick={() => setSelectedEntry(null)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Title</label>
              <p className="mt-1">{selectedEntry.title || 'Untitled'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">Content</label>
              <p className="mt-1 text-gray-300 whitespace-pre-wrap">
                {selectedEntry.content || 'No content'}
              </p>
            </div>

            {/* Source URL */}
            {selectedEntry.source_url && (
              <div>
                <label className="text-xs text-gray-500 uppercase">Source URL</label>
                <a
                  href={selectedEntry.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 text-purple-400 hover:text-purple-300 break-all"
                >
                  <LinkIcon size={14} className="shrink-0" />
                  <span className="text-sm truncate">{selectedEntry.source_url}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>
            )}

            {/* OCR Text (collapsible) */}
            {selectedEntry.ocr_text && (
              <div>
                <button
                  onClick={() => setIsOcrExpanded(!isOcrExpanded)}
                  className="w-full flex items-center justify-between text-xs text-gray-500 uppercase hover:text-gray-400"
                >
                  <span className="flex items-center gap-1">
                    <Camera size={12} />
                    Extracted Text (OCR)
                  </span>
                  {isOcrExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isOcrExpanded && (
                  <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {selectedEntry.ocr_text}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <select
                  value={selectedEntry.status}
                  onChange={(e) => onUpdateEntry(selectedEntry.id, { status: e.target.value })}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase">Priority</label>
                <select
                  value={selectedEntry.priority}
                  onChange={(e) => onUpdateEntry(selectedEntry.id, { priority: e.target.value })}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">Project</label>
              <p className="mt-1">{selectedEntry.project || 'None'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">Type</label>
              <p className="mt-1">{getTypeLabel(selectedEntry.type)}</p>
            </div>

            {selectedEntry.keywords && selectedEntry.keywords.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 uppercase">Keywords</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedEntry.keywords.map((keyword, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedEntry.file_url && (
              <div>
                <label className="text-xs text-gray-500 uppercase">Attachment</label>
                <a
                  href={selectedEntry.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2 text-purple-400 hover:text-purple-300"
                >
                  <File size={16} />
                  <span className="text-sm">View file</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            <div className="text-xs text-gray-600 pt-4 border-t border-gray-800">
              <p>Created: {new Date(selectedEntry.created_at).toLocaleString()}</p>
              <p>Updated: {new Date(selectedEntry.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
