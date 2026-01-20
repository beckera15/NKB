'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, Upload, FileText, Lightbulb, CheckSquare, HelpCircle, Image as ImageIcon, MessageCircle, Link2, Camera, Search, Mic, Loader2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { autoTag, isURL, type AutoTagResult } from '@/lib/autoTag'
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
  { id: 'screenshot', label: 'Screenshot', icon: Camera },
  { id: 'link', label: 'Link', icon: Link2 },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'voice_memo', label: 'Voice', icon: Mic },
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
  const [keywords, setKeywords] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [autoTagResult, setAutoTagResult] = useState<AutoTagResult | null>(null)
  const [showAutoTagSuggestion, setShowAutoTagSuggestion] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setType('thought')
      setTitle('')
      setContent('')
      setProject('')
      setPriority('medium')
      setKeywords([])
      setFile(null)
      setProcessingStatus(null)
      setSourceUrl(null)
      setAutoTagResult(null)
      setShowAutoTagSuggestion(false)
    }
  }, [isOpen])

  // Handle initial file from global drag-drop
  useEffect(() => {
    if (initialFile && isOpen) {
      handleFile(initialFile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile, isOpen])

  // Auto-tag when content changes
  useEffect(() => {
    if (content.length > 20 || title.length > 10) {
      const result = autoTag(content, title)
      setAutoTagResult(result)
      if (result.suggestedProject && !project && result.confidence > 0.3) {
        setShowAutoTagSuggestion(true)
      }
    }
  }, [content, title, project])

  // Detect URL in content
  useEffect(() => {
    const trimmedContent = content.trim()
    if (isURL(trimmedContent) && !sourceUrl && !file) {
      handleURLExtraction(trimmedContent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, sourceUrl, file])

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile)

    // Check if it's an image for OCR
    if (selectedFile.type.startsWith('image/')) {
      setType('screenshot')
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
      await performOCR(selectedFile)
    } else if (selectedFile.type.startsWith('audio/')) {
      setType('voice_memo')
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
    } else {
      setType('note')
      if (!title) setTitle(selectedFile.name)
    }
  }

  const performOCR = async (imageFile: File) => {
    setProcessingStatus('Extracting text from image...')

    try {
      // Dynamic import of Tesseract.js
      const Tesseract = await import('tesseract.js')

      const result = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProcessingStatus(`OCR: ${Math.round(m.progress * 100)}%`)
            }
          }
        }
      )

      const extractedText = result.data.text.trim()

      if (extractedText) {
        setContent(prev => prev ? `${prev}\n\n--- Extracted Text ---\n${extractedText}` : extractedText)
        setProcessingStatus('Text extracted successfully!')

        // Auto-tag the extracted content
        const tagResult = autoTag(extractedText, title)
        setAutoTagResult(tagResult)
        if (tagResult.keywords.length > 0) {
          setKeywords(tagResult.keywords)
        }
        if (tagResult.suggestedProject && !project) {
          setShowAutoTagSuggestion(true)
        }
      } else {
        setProcessingStatus('No text found in image')
      }

      setTimeout(() => setProcessingStatus(null), 3000)
    } catch (error) {
      console.error('OCR error:', error)
      setProcessingStatus('OCR failed - image will be saved without text extraction')
      setTimeout(() => setProcessingStatus(null), 3000)
    }
  }

  const handleURLExtraction = async (url: string) => {
    // Normalize URL
    let normalizedUrl = url.trim()
    if (normalizedUrl.startsWith('www.')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

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

      setTitle(data.title || normalizedUrl)
      setContent(data.description ? `${data.description}\n\n${data.content}` : data.content)

      // Auto-tag the extracted content
      const tagResult = autoTag(data.content, data.title)
      setAutoTagResult(tagResult)
      if (tagResult.keywords.length > 0) {
        setKeywords(tagResult.keywords)
      }
      if (tagResult.suggestedProject && !project) {
        setShowAutoTagSuggestion(true)
      }

      setProcessingStatus('Content extracted!')
      setTimeout(() => setProcessingStatus(null), 2000)
    } catch (error) {
      console.error('URL extraction error:', error)
      setProcessingStatus('Could not extract content - URL will be saved')
      setTitle(normalizedUrl)
      setTimeout(() => setProcessingStatus(null), 3000)
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
      handleFile(droppedFile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
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

    setProcessingStatus('Uploading file...')

    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      setProcessingStatus('Upload failed')
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    return { url: publicUrl, fileType: getFileType(file.type) }
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

      // Determine final type
      let finalType = type
      if (file && file.type.startsWith('image/')) {
        finalType = 'screenshot'
      } else if (file && file.type.startsWith('audio/')) {
        finalType = 'voice_memo'
      } else if (sourceUrl) {
        finalType = 'link'
      }

      // Build content with source URL if applicable
      let finalContent = content
      if (sourceUrl && !content.includes(sourceUrl)) {
        finalContent = `Source: ${sourceUrl}\n\n${content}`
      }

      const entry: EntryInsert = {
        type: finalType,
        title: title || 'Untitled',
        content: finalContent,
        project: project || null,
        priority,
        status: 'inbox',
        file_url: fileUrl,
        file_type: fileType,
        keywords: keywords.length > 0 ? keywords : null,
      }

      await onSubmit(entry)
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

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
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
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
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

          {/* Type Selection */}
          <div>
            <label className="text-xs text-gray-500 uppercase mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
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
          {keywords.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 uppercase mb-2 block">Keywords</label>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs flex items-center gap-1"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => setKeywords(keywords.filter((_, j) => j !== i))}
                      className="hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
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

          {/* Source URL indicator */}
          {sourceUrl && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Link2 size={12} />
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
