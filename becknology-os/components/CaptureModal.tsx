'use client'

import { useState, useCallback } from 'react'
import { X, Upload, FileText, Lightbulb, CheckSquare, HelpCircle, Image } from 'lucide-react'
import type { Database } from '@/types/database'

type EntryInsert = Database['public']['Tables']['entries']['Insert']

interface CaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (entry: EntryInsert) => Promise<void>
}

const TYPES = [
  { id: 'note', label: 'Note', icon: FileText },
  { id: 'idea', label: 'Idea', icon: Lightbulb },
  { id: 'task', label: 'Task', icon: CheckSquare },
  { id: 'decision', label: 'Decision', icon: HelpCircle },
  { id: 'media', label: 'Media', icon: Image },
]

const PROJECTS = [
  'TCAS',
  'Trading',
  'Becknology',
  'NKB PR',
  'Nikki GF Content',
  'Property/Home',
  'Family',
  'Wealth Building',
]

const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'gray' },
  { id: 'medium', label: 'Medium', color: 'yellow' },
  { id: 'high', label: 'High', color: 'orange' },
  { id: 'critical', label: 'Critical', color: 'red' },
]

export function CaptureModal({ isOpen, onClose, onSubmit }: CaptureModalProps) {
  const [type, setType] = useState('note')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [project, setProject] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setType('media')
      if (!title) setTitle(droppedFile.name)
    }
  }, [title])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setType('media')
      if (!title) setTitle(selectedFile.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const entry: EntryInsert = {
        type,
        title: title || 'Untitled',
        content,
        project: project || null,
        priority,
        status: 'inbox',
      }

      await onSubmit(entry)

      // Reset form
      setType('note')
      setTitle('')
      setContent('')
      setProject('')
      setPriority('medium')
      setFile(null)
      onClose()
    } catch (err) {
      console.error('Failed to create entry:', err)
      setError(err instanceof Error ? err.message : 'Failed to save entry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">Quick Capture</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && document.getElementById('file-input')?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <Image size={24} className="text-purple-400" />
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-500 mb-2" />
                <p className="text-gray-400">Drop files here or click to upload</p>
              </>
            )}
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Type Selection */}
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Type</label>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    type === t.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add details..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Project & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase mb-2 block">Project</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">No Project</option>
                {PROJECTS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase mb-2 block">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                      priority === p.id
                        ? p.color === 'gray' ? 'bg-gray-600 text-white'
                        : p.color === 'yellow' ? 'bg-yellow-600 text-white'
                        : p.color === 'orange' ? 'bg-orange-600 text-white'
                        : 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
