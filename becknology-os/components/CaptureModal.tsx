'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, Upload, FileText, Lightbulb, CheckSquare, HelpCircle, Image as ImageIcon, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type EntryInsert = Database['public']['Tables']['entries']['Insert']

interface CaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (entry: EntryInsert) => Promise<void>
  initialFile?: File | null
}

const TYPES = [
  { id: 'thought', label: 'Thought', icon: MessageCircle },
  { id: 'idea', label: 'Idea', icon: Lightbulb },
  { id: 'decision', label: 'Decision', icon: HelpCircle },
  { id: 'task', label: 'Task', icon: CheckSquare },
  { id: 'note', label: 'Note', icon: FileText },
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

export function CaptureModal({ isOpen, onClose, onSubmit, initialFile }: CaptureModalProps) {
  const [type, setType] = useState('thought')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [project, setProject] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  // Handle initial file from global drag-drop
  useEffect(() => {
    if (initialFile && isOpen) {
      setFile(initialFile)
      setType('media')
      if (!title) setTitle(initialFile.name)
    }
  }, [initialFile, isOpen, title])

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

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'document'
    if (mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'document'
    return 'other'
  }

  const uploadFile = async (file: File): Promise<{ url: string; fileType: string } | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `uploads/${fileName}`

    setUploadProgress('Uploading...')

    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      setUploadProgress('Upload failed')
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    setUploadProgress(null)
    return { url: publicUrl, fileType: getFileType(file.type) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let fileUrl: string | null = null
      let fileType: string | null = null

      if (file) {
        const uploadResult = await uploadFile(file)
        if (uploadResult) {
          fileUrl = uploadResult.url
          fileType = uploadResult.fileType
        }
      }

      const entry: EntryInsert = {
        type: file ? 'media' : type,
        title: title || 'Untitled',
        content,
        project: project || null,
        priority,
        status: 'inbox',
        file_url: fileUrl,
        file_type: fileType,
      }

      await onSubmit(entry)

      // Reset form
      setType('thought')
      setTitle('')
      setContent('')
      setProject('')
      setPriority('medium')
      setFile(null)
      setUploadProgress(null)
      onClose()
    } catch (error) {
      console.error('Failed to create entry:', error)
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
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <ImageIcon size={24} className="text-purple-400" />
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-500 mb-2" />
                <p className="text-gray-400">Drop files here or click to upload</p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ position: 'relative' }}
                />
              </>
            )}
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
              {isSubmitting ? (uploadProgress || 'Saving...') : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
