'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface NovaChatProps {
  messages: Message[]
  isTyping: boolean
  onSendMessage: (message: string) => Promise<void>
  className?: string
}

export function NovaChat({ messages, isTyping, onSendMessage, className = '' }: NovaChatProps) {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const message = input.trim()
    setInput('')
    setIsSending(true)

    try {
      await onSendMessage(message)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className={`flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Nova</h3>
          <p className="text-xs text-gray-400">Your ICT Trading Coach</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Sparkles size={32} className="mx-auto mb-2 text-purple-400" />
            <p className="text-sm">Hey tiger! Ready when you are.</p>
            <p className="text-xs mt-1">Ask me anything about trading or the markets.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gray-700'
              }`}
            >
              {message.role === 'assistant' ? (
                <Sparkles size={16} className="text-white" />
              ) : (
                <User size={16} className="text-gray-300" />
              )}
            </div>
            <div
              className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}
            >
              <div
                className={`inline-block max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  message.role === 'assistant'
                    ? 'bg-gray-800 text-gray-100 rounded-tl-none'
                    : 'bg-purple-600 text-white rounded-tr-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 px-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Nova..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            disabled={isSending || isTyping}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isSending || isTyping}
            variant="gradient"
            icon={isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
