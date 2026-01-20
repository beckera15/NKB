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
import { autoTag, isURL, type AutoTagResult } from '@/lib/autoTag'
import type { Database } from '@/types/database'
import { ENTRY_TYPES, PROJECTS, type EntryType } from '@/lib/constants'
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
  const [keywords, setKeywords] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string>('')
  const [ocrText, setOcrText] = useState('')
  const [autoTagResult, setAutoTagResult] = useState<AutoTagResult | null>(null)
  const [showAutoTagSuggestion, setShowAutoTagSuggestion] = useState(false)
  const [isExtractingLink, setIsExtractingLink] = useState(false)

  // OCR hook
  const { extractText, progress: ocrProgress, isProcessing: isOcrProcessing } = useOCR()

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

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
    if (text.length > 20) {
      const result = autoTag(text, title)
      setAutoTagResult(result)
      if (result.suggestedProject && !project && result.confidence > 0.3) {
        setShowAutoTagSuggestion(true)
      }
    }
  }, [title, content, ocrText, project])

  // Detect URL in content
  useEffect(() => {
    const trimmedContent = content.trim()
    if (isURL(trimmedContent) && !sourceUrl && !file) {
      handleURLExtraction(trimmedContent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  const handleFileSelected = async (selectedFile: File) => {
    if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))

    // Determine type based on file
    if (selectedFile.type.startsWith('image/')) {
      setType('screenshot')
      // Run OCR on images
      try {
        setProcessingStatus('Extracting text from image...')
        const text = await extractText(selectedFile)
        if (text) {
          setOcrText(text)
          setProcessingStatus('Text extracted successfully!')
        } else {
          setProcessingStatus('No text found in image')
        }
        setTimeout(() => setProcessingStatus(null), 2000)
      } catch (err) {
        console.error('OCR failed:', err)
        setProcessingStatus('OCR failed - image will be saved without text extraction')
        setTimeout(() => setProcessingStatus(null), 3000)
      }
    } else if (selectedFile.type.startsWith('audio/')) {
      setType('voice_memo')
    } else {
      setType('media')
    }
  }

  const handleURLExtraction = async (url: string) => {
    // Normalize URL
    let normalizedUrl = url.trim()
    if (normalizedUrl.startsWith('www.')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    setIsExtractingLink(true)
    setProcessingStatus('Extracting content from URL...')
    setSourceUrl(normalizedUrl)
    setType('link')

    try {
      const response = await fetch('/api/extract-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl })
      })

      if (!response.ok) {
        throw new Error('Failed to extract content')
      }

      const data = await response.json()

      if (data.title && !title) setTitle(data.title)
      if (data.description) {
        setContent(data.description + (data.content ? '\n\n' + data.content.slice(0, 500) : ''))
      }

      setProcessingStatus('Content extracted!')
      setTimeout(() => setProcessingStatus(null), 2000)
    } catch (error) {
      console.error('URL extraction error:', error)
      setProcessingStatus('Could not extract content - URL will be saved')
      if (!title) setTitle(normalizedUrl)
      setTimeout(() => setProcessingStatus(null), 3000)
    } finally {
      setIsExtractingLink(false)
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

  // Handle URL paste detection in title field
  const handleUrlPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text')

    // Check if it's a URL
    if (isURL(pastedText) && !sourceUrl && !file) {
      e.preventDefault()
      await handleURLExtraction(pastedText)
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

  const uploadFile = async (fileToUpload: File): Promise<{ url: string; fileType: string } | null> => {
    const fileExt = fileToUpload.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `uploads/${fileName}`

    setProcessingStatus('Uploading file...')

    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, fileToUpload)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      setProcessingStatus('Upload failed')
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    return { url: publicUrl, fileType: getFileType(fileToUpload.type) }
  }

  const acceptAutoTagSuggestion = () => {
    if (autoTagResult?.suggestedProject) {
      setProject(autoTagResult.suggestedProject)
    }
    if (autoTagResult?.keywords && autoTagResult.keywords.length > 0) {
      setKeywords(autoTagResult.keywords)
    }
    setShowAutoTagSuggestion(false)
  }

  const resetForm = () => {
    setType('thought')
    setTitle('')
    setContent('')
    setProject('')
    setPriority('medium')
    setKeywords([])
    setFile(null)
    setProcessingStatus(null)
    setSourceUrl('')
    setOcrText('')
    setAutoTagResult(null)
    setShowAutoTagSuggestion(false)
    setIsExtractingLink(false)
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
        content: content || null,
        project: project || null,
        priority,
        status: 'inbox',
        file_url: fileUrl,
        file_type: fileType,
        keywords: keywords.length > 0 ? keywords : (autoTagResult?.keywords || null),
        source_url: sourceUrl || null,
        ocr_text: ocrText || null,
      }

      await onSubmit(entry)
      resetForm()
      onClose()
    } catch (error) {
      console.error('Failed to create entry:', error)
      setProcessingStatus('Failed to save entry')
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
          {/* Processing Status */}
          {processingStatus && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 text-sm">
              <Loader2 size={16} className="animate-spin" />
              {processingStatus}
            </div>
          )}

          {/* Auto-tag Suggestion */}
          {showAutoTagSuggestion && autoTagResult && (
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-sm">
                  Suggested: <strong className="text-purple-400">{autoTagResult.suggestedProject}</strong>
                  {autoTagResult.keywords.length > 0 && (
                    <span className="text-gray-400 ml-2">
                      Keywords: {autoTagResult.keywords.slice(0, 3).join(', ')}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAutoTagSuggestion(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={acceptAutoTagSuggestion}
                  className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

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
                {file.type.startsWith('image/') ? (
                  <Camera size={24} className="text-purple-400" />
                ) : file.type.startsWith('audio/') ? (
                  <Mic size={24} className="text-purple-400" />
                ) : (
                  <ImageIcon size={24} className="text-purple-400" />
                )}
                <span className="truncate max-w-[300px]">{file.name}</span>
                {isOcrProcessing && (
                  <span className="text-sm text-purple-400">OCR: {ocrProgress}%</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setOcrText('')
                    setType('thought')
                  }}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-500 mb-2" />
                <p className="text-gray-400">Drop files here, paste a URL, or click to upload</p>
                <p className="text-xs text-gray-500 mt-1">Images will be OCR processed automatically</p>
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
              onPaste={handleUrlPaste}
              placeholder="Enter title or paste URL..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add details or paste a URL to extract content..."
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Keywords */}
          {(keywords.length > 0 || (autoTagResult?.keywords && autoTagResult.keywords.length > 0)) && (
            <div>
              <label className="text-xs text-gray-500 uppercase mb-2 block">Keywords</label>
              <div className="flex flex-wrap gap-2">
                {(keywords.length > 0 ? keywords : autoTagResult?.keywords || []).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs flex items-center gap-1"
                  >
                    {kw}
                    {keywords.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setKeywords(keywords.filter((_, j) => j !== i))}
                        className="hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
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
                  setShowAutoTagSuggestion(false)
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

          {/* Source URL indicator */}
          {sourceUrl && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <LinkIcon size={12} />
              <span className="truncate">{sourceUrl}</span>
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
              disabled={isSubmitting || isOcrProcessing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isOcrProcessing ? `Processing (${ocrProgress}%)` : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
