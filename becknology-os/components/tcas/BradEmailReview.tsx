'use client'

import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import {
  Mail,
  Copy,
  Check,
  X,
  Edit3,
  Send,
  User,
  Loader2,
} from 'lucide-react'
import type { AgentActivity } from '@/hooks/useTCAS'

interface BradEmailReviewProps {
  activity: AgentActivity | null
  isOpen: boolean
  onClose: () => void
  onApprove: (activityId: string) => Promise<void>
  onReject: (activityId: string) => Promise<void>
}

interface ParsedEmail {
  to: string
  subject: string
  body: string
}

export function BradEmailReview({
  activity,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: BradEmailReviewProps) {
  const [copied, setCopied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedEmail, setEditedEmail] = useState<ParsedEmail | null>(null)

  // Parse Brad's email output format
  const parseEmailOutput = (output: string): ParsedEmail | null => {
    if (!output) return null

    const toMatch = output.match(/\*\*TO:\*\*\s*(.+)/i)
    const subjectMatch = output.match(/\*\*SUBJECT:\*\*\s*(.+)/i)

    // Extract body - everything between the first "---" and the signature
    const bodyMatch = output.match(/---\n\n([\s\S]*?)\n\nBest regards/i)

    return {
      to: toMatch?.[1]?.trim() || 'recipient@example.com',
      subject: subjectMatch?.[1]?.trim() || 'No Subject',
      body: bodyMatch?.[1]?.trim() || output,
    }
  }

  const email = activity?.output
    ? (editMode && editedEmail ? editedEmail : parseEmailOutput(activity.output))
    : null

  const handleCopy = async () => {
    if (!email) return

    const fullEmail = `To: ${email.to}\nSubject: ${email.subject}\n\n${email.body}\n\nBest regards,\nAndrew Becker\nTCAS Automation`

    await navigator.clipboard.writeText(fullEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyBody = async () => {
    if (!email) return
    await navigator.clipboard.writeText(email.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApprove = async () => {
    if (!activity) return
    setIsProcessing(true)
    try {
      await onApprove(activity.id)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!activity) return
    setIsProcessing(true)
    try {
      await onReject(activity.id)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const startEdit = () => {
    if (email) {
      setEditedEmail(email)
      setEditMode(true)
    }
  }

  const cancelEdit = () => {
    setEditedEmail(null)
    setEditMode(false)
  }

  if (!activity || !email) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
      showCloseButton={false}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Mail className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Email Draft from BRAD</h3>
            <p className="text-sm text-gray-400">Review and approve before sending</p>
          </div>
        </div>

        {/* Email Preview */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {/* To Field */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
            <User size={16} className="text-gray-500" />
            <span className="text-sm text-gray-400">To:</span>
            {editMode ? (
              <input
                type="text"
                value={editedEmail?.to || ''}
                onChange={(e) => setEditedEmail((prev) => prev ? { ...prev, to: e.target.value } : null)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            ) : (
              <span className="text-white">{email.to}</span>
            )}
          </div>

          {/* Subject Field */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
            <Mail size={16} className="text-gray-500" />
            <span className="text-sm text-gray-400">Subject:</span>
            {editMode ? (
              <input
                type="text"
                value={editedEmail?.subject || ''}
                onChange={(e) => setEditedEmail((prev) => prev ? { ...prev, subject: e.target.value } : null)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            ) : (
              <span className="text-white font-medium">{email.subject}</span>
            )}
          </div>

          {/* Body */}
          <div className="p-4">
            {editMode ? (
              <textarea
                value={editedEmail?.body || ''}
                onChange={(e) => setEditedEmail((prev) => prev ? { ...prev, body: e.target.value } : null)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                rows={10}
              />
            ) : (
              <div className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                {email.body}
              </div>
            )}

            {/* Signature */}
            <div className="mt-4 pt-4 border-t border-gray-800 text-gray-400 text-sm">
              Best regards,<br />
              Andrew Becker<br />
              TCAS Automation
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {editMode ? (
            <>
              <Button
                onClick={cancelEdit}
                variant="ghost"
                icon={<X size={16} />}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setEditMode(false)}
                icon={<Check size={16} />}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleReject}
                variant="ghost"
                disabled={isProcessing}
                icon={<X size={16} />}
              >
                Reject
              </Button>
              <Button
                onClick={startEdit}
                variant="secondary"
                disabled={isProcessing}
                icon={<Edit3 size={16} />}
              >
                Edit
              </Button>
              <Button
                onClick={handleCopyBody}
                variant="secondary"
                disabled={isProcessing}
                icon={copied ? <Check size={16} /> : <Copy size={16} />}
              >
                {copied ? 'Copied!' : 'Copy Body'}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                icon={isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              >
                {isProcessing ? 'Approving...' : 'Approve & Copy'}
              </Button>
            </>
          )}
        </div>

        {/* Quick Actions Note */}
        <p className="text-xs text-gray-500 text-center">
          Approved emails are copied to clipboard. Open your email client and paste to send.
        </p>
      </div>
    </Modal>
  )
}
