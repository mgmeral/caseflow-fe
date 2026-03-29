import { useState, useRef } from 'react'
import { Send, Mail, X, Paperclip, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useSendTicketReply } from '@/hooks/useTicketEmails'
import { useMailboxes } from '@/hooks/useMailboxes'
import { useToast } from '@/hooks/useToast'
import type { SendTicketReplyRequest, TicketEmailMessage } from '@/types/email.types'

interface EmailReplyComposerProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  /** Last inbound email in thread — used to populate defaults */
  lastInbound?: TicketEmailMessage | null
  /** Ticket subject fallback */
  ticketSubject?: string
}

export function EmailReplyComposer({
  isOpen,
  onClose,
  ticketId,
  lastInbound,
  ticketSubject,
}: EmailReplyComposerProps) {
  const { success, error: toastError } = useToast()
  const { data: mailboxData } = useMailboxes({ active: true })
  const mailboxes = mailboxData?.items ?? []
  const sendMutation = useSendTicketReply(ticketId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [mailboxId, setMailboxId] = useState<string>(lastInbound?.mailboxId ?? '')
  const [to, setTo] = useState(lastInbound?.from ? lastInbound.from : '')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState(
    lastInbound?.subject
      ? (lastInbound.subject.startsWith('Re:') ? lastInbound.subject : `Re: ${lastInbound.subject}`)
      : ticketSubject
        ? `Re: ${ticketSubject}`
        : '',
  )
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  if (!isOpen) return null

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return
    setAttachments((prev) => [...prev, ...Array.from(files)])
  }

  const handleRemoveFile = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const parseAddresses = (str: string): string[] =>
    str.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)

  const handleSend = () => {
    const toList = parseAddresses(to)
    if (toList.length === 0) {
      toastError('At least one recipient is required.')
      return
    }
    if (!body.trim()) {
      toastError('Message body cannot be empty.')
      return
    }

    const payload: SendTicketReplyRequest = {
      mailboxId: mailboxId || null,
      to: toList,
      cc: parseAddresses(cc),
      bcc: parseAddresses(bcc),
      subject: subject.trim(),
      body: body.trim(),
      isHtml: false,
      attachments,
    }

    sendMutation.mutate(payload, {
      onSuccess: (result) => {
        success(result.status === 'QUEUED' || result.status === 'PROCESSING'
          ? 'Reply queued for delivery'
          : result.status === 'DISPATCHED' || result.status === 'DELIVERED'
            ? 'Reply sent successfully'
            : `Reply submitted (${result.status})`)
        resetAndClose()
      },
      onError: (err) => {
        toastError(err instanceof Error ? err.message : 'Failed to send reply')
      },
    })
  }

  const resetAndClose = () => {
    setMailboxId(lastInbound?.mailboxId ?? '')
    setTo(lastInbound?.from ?? '')
    setCc('')
    setBcc('')
    setSubject(
      lastInbound?.subject
        ? (lastInbound.subject.startsWith('Re:') ? lastInbound.subject : `Re: ${lastInbound.subject}`)
        : ticketSubject ? `Re: ${ticketSubject}` : '',
    )
    setBody('')
    setAttachments([])
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={resetAndClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">Send Email Reply</span>
            </div>
            <button type="button" onClick={resetAndClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Mailbox */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Send From (Mailbox)</label>
              <select
                value={mailboxId}
                onChange={(e) => setMailboxId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">— Auto / Default —</option>
                {mailboxes.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.emailAddress})</option>
                ))}
              </select>
            </div>

            {/* To */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To *</label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* CC / BCC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CC</label>
                <input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Comma-separated"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">BCC</label>
                <input
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Comma-separated"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Body *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                autoFocus
                placeholder="Type your reply…"
                className="w-full text-sm resize-none border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
                }}
              />
            </div>

            {/* Attachments */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleAddFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <Paperclip size={12} /> Attach files
              </button>
              {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs text-gray-600">
                      {file.name} ({(file.size / 1024).toFixed(0)}KB)
                      <button type="button" onClick={() => handleRemoveFile(idx)} className="text-gray-400 hover:text-red-500 ml-0.5">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <span className="text-xs text-gray-400">Ctrl + Enter to send</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send size={13} />}
                onClick={handleSend}
                isLoading={sendMutation.isPending}
                disabled={!to.trim() || !body.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
