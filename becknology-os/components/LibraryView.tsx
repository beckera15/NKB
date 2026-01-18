'use client'

import { useState } from 'react'
import { Image, Video, FileText, Music, File, X, ExternalLink } from 'lucide-react'
import type { Database } from '@/types/database'

type Entry = Database['public']['Tables']['entries']['Row']

interface LibraryViewProps {
  entries: Entry[]
  selectedProject: string | null
}

const FILE_TYPES = ['all', 'image', 'video', 'audio', 'document', 'other']

export function LibraryView({ entries, selectedProject }: LibraryViewProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedFile, setSelectedFile] = useState<Entry | null>(null)

  const mediaEntries = entries.filter(entry => entry.file_url)

  const filteredEntries = mediaEntries.filter(entry => {
    if (selectedProject && entry.project !== selectedProject) return false
    if (typeFilter !== 'all' && entry.file_type !== typeFilter) return false
    return true
  })

  const getFileIcon = (fileType: string | null) => {
    switch (fileType) {
      case 'image': return Image
      case 'video': return Video
      case 'audio': return Music
      case 'document': return FileText
      default: return File
    }
  }

  const getFilePreview = (entry: Entry) => {
    if (entry.file_type === 'image' && entry.file_url) {
      return (
        <img
          src={entry.file_url}
          alt={entry.title || ''}
          className="w-full h-full object-cover"
        />
      )
    }

    const Icon = getFileIcon(entry.file_type)
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <Icon size={32} className="text-gray-500" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className={`flex-1 flex flex-col ${selectedFile ? 'border-r border-gray-800' : ''}`}>
        {/* Filters */}
        <div className="p-4 border-b border-gray-800 flex gap-4">
          <div className="flex gap-2">
            {FILE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  typeFilter === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-400 ml-auto self-center">
            {filteredEntries.length} files
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No media files found
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredEntries.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedFile(entry)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-purple-500 ${
                    selectedFile?.id === entry.id
                      ? 'border-purple-500'
                      : 'border-transparent'
                  }`}
                >
                  {getFilePreview(entry)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedFile && (
        <div className="w-80 flex flex-col bg-gray-900/50">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold">File Details</h3>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Preview */}
            <div className="aspect-video">
              {getFilePreview(selectedFile)}
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Title</label>
                <p className="mt-1">{selectedFile.title || 'Untitled'}</p>
              </div>

              {selectedFile.content && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Description</label>
                  <p className="mt-1 text-sm text-gray-400">{selectedFile.content}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Type</label>
                  <p className="mt-1 text-sm">{selectedFile.file_type || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Project</label>
                  <p className="mt-1 text-sm">{selectedFile.project || 'None'}</p>
                </div>
              </div>

              {selectedFile.keywords && selectedFile.keywords.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Keywords</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFile.keywords.map((keyword, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <a
                href={selectedFile.file_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
              >
                Open File
                <ExternalLink size={16} />
              </a>

              <div className="text-xs text-gray-600 pt-4 border-t border-gray-800">
                <p>Added: {new Date(selectedFile.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
