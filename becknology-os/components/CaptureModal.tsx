'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  X,
  Upload,
  FileText,
  Lightbulb,
  CheckSquare,
  HelpCircle,
  Image as ImageIcon,
  MessageCircle,
  Link as LinkIcon,
  Camera,
  Search,
  Mic,
  Loader2,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { ENTRY_TYPES, PROJECTS, type EntryType } from '@/lib/constants'
import { autoTag } from '@/lib/autoTag'
import { useOCR } from '@/hooks/useOCR'

type EntryInsert = Database['public']['Tables']['entries']['Insert']

interface CaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (entry: EntryInsert) => Promise<unknown>
  initialFile?: File | null
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number | string }>> = {
  thought: MessageCircle,
  idea: Lightbulb,
  decision: HelpCircle,
  task: CheckSquare,
  note: FileText,
  media: ImageIcon,
  screenshot: Camera,
  link: LinkIcon,
  research: Search,
  voice_memo: Mic,
}

const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'gray' },
  { id: 'medium', label: 'Medium', color: 'yellow' },
  { id: 'high', label: 'High', color: 'orange' },
  { id: 'critical', label: 'Critical', color: 'red' },
]

export function CaptureModal({ isOpen, onClose, onSubmit, initialFile }: CaptureModalProps) {
  const [type, setType] = useState<EntryType>('thought')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [project, setProject] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  // New fields for universal intake
  const [sourceUrl, setSourceUrl] = useState('')
  const [ocrText, setOcrText] = useState('')
  const [suggestedProject, setSuggestedProject] = useState<string | null>(null)
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([])
  const [isExtractingLink, setIsExtractingLink] = useState(false)

  // OCR hook
  const { extractText, progress: ocrProgress, isProcessing: isOcrProcessing } = useOCR()

  // Handle initial file from global drag-drop
  useEffect(() => {
    if (initialFile && isOpen) {
      setFile(initialFile)
      handleFileSelected(initialFile)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile, isOpen])

  // Auto-tag when content changes
  useEffect(() => {
    const text = [title, content, ocrText].filter(Boolean).join(' ')
    if (text.length > 10) {
      const { keywords, suggestedProject: suggested } = autoTag(text)
      setExtractedKeywords(keywords)
      if (suggested && !project) {
        setSuggestedProject(suggested)
      }
    }
  }, [title, content, ocrText, project])

  const handleFileSelected = async (selectedFile: File) => {
    if (!title) setTitle(selectedFile.name)

    // Determine type based on file
    if (selectedFile.type.startsWith('image/')) {
      setType('screenshot')
      // Run OCR on images
      try {
        const text = await extractText(selectedFile)
        if (text) {
          setOcrText(text)
        }
      } catch (err) {
        console.error('OCR failed:', err)
      }
    } else if (selectedFile.type.startsWith('audio/')) {
      setType('voice_memo')
    } else {
      setType('media')
    }
  }

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
      handleFileSelected(droppedFile)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      handleFileSelected(selectedFile)
    }
  }

  // Handle URL paste detection
  const handleUrlPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text')

    // Check if it's a URL
    try {
      new URL(pastedText)
      // It's a valid URL, extract content
      setIsExtractingLink(true)
      setType('link')

      try {
        const response = await fetch('/api/extract-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: pastedText }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.title && !title) setTitle(data.title)
          if (data.description && !content) setContent(data.description)
        }
      } catch (err) {
        console.error('Link extraction failed:', err)
      } finally {
        setIsExtractingLink(false)
      }
    } catch {
      // Not a URL, ignore
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
        type,
        title: title || 'Untitled',
        content,
        project: project || null,
        priority,
        status: 'inbox',
        file_url: fileUrl,
        file_type: fileType,
        keywords: extractedKeywords.length > 0 ? extractedKeywords : null,
        source_url: sourceUrl || null,
        ocr_text: ocrText || null,
      }

      await onSubmit(entry)

      // Reset form
      resetForm()
      onClose()
    } catch (error) {
      console.error('Failed to create entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setType('thought')
    setTitle('')
    setContent('')
    setProject('')
    setPriority('medium')
    setFile(null)
    setUploadProgress(null)
    setSourceUrl('')
    setOcrText('')
    setSuggestedProject(null)
    setExtractedKeywords([])
  }

  const acceptSuggestedProject = () => {
    if (suggestedProject) {
      setProject(suggestedProject)
      setSuggestedProject(null)
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
          {/* URL Input */}
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Link URL</label>
            <div className="relative">
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                onPaste={handleUrlPaste}
                placeholder="Paste a URL to extract content..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              {isExtractingLink && (
                <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${
              isDragging
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <ImageIcon size={24} className="text-purple-400" />
                <span>{file.name}</span>
                {isOcrProcessing && (
                  <span className="text-sm text-purple-400">OCR: {ocrProgress}%</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setOcrText('')
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
                <p className="text-xs text-gray-600 mt-1">Images will be processed with OCR</p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>

          {/* OCR Text Display */}
          {ocrText && (
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Camera size={14} className="text-purple-400" />
                <span className="text-xs text-gray-400 uppercase">Extracted Text (OCR)</span>
              </div>
              <p className="text-sm text-gray-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                {ocrText}
              </p>
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {ENTRY_TYPES.map(t => {
                const Icon = TYPE_ICONS[t.id] || FileText
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as EntryType)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      type === t.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                )
              })}
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

          {/* Auto-tag Suggestions */}
          {(suggestedProject || extractedKeywords.length > 0) && (
            <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-xs text-purple-400 uppercase">Auto-detected</span>
              </div>

              {suggestedProject && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-300">Project suggestion:</span>
                  <button
                    type="button"
                    onClick={acceptSuggestedProject}
                    className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded text-sm transition-colors"
                  >
                    {suggestedProject}
                  </button>
                </div>
              )}

              {extractedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {extractedKeywords.slice(0, 8).map((keyword, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Project & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase mb-2 block">Project</label>
              <select
                value={project}
                onChange={(e) => {
                  setProject(e.target.value)
                  setSuggestedProject(null)
                }}
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
              disabled={isSubmitting || isOcrProcessing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {isSubmitting ? (uploadProgress || 'Saving...') : isOcrProcessing ? `Processing (${ocrProgress}%)` : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
