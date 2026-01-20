'use client'

import { useState, useCallback } from 'react'
import Tesseract from 'tesseract.js'

interface UseOCRResult {
  extractText: (imageFile: File) => Promise<string>
  progress: number
  isProcessing: boolean
  error: string | null
}

/**
 * Client-side OCR hook using Tesseract.js
 * Extracts text from images using optical character recognition
 */
export function useOCR(): UseOCRResult {
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractText = useCallback(async (imageFile: File): Promise<string> => {
    if (!imageFile) {
      throw new Error('No image file provided')
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Create object URL for the image
      const imageUrl = URL.createObjectURL(imageFile)

      const result = await Tesseract.recognize(imageUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })

      // Clean up the object URL
      URL.revokeObjectURL(imageUrl)

      // Return the extracted text
      const text = result.data.text.trim()
      return text
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR failed'
      setError(message)
      throw new Error(message)
    } finally {
      setIsProcessing(false)
      setProgress(100)
    }
  }, [])

  return {
    extractText,
    progress,
    isProcessing,
    error,
  }
}
