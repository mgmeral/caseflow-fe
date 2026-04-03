import { useState } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import {
  ChevronDown, ChevronUp, Mail, MailCheck, Paperclip, AlertCircle, Clock,
  CheckCircle2, ExternalLink,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { TicketEmailMessage } from '@/types/email.types'
import { Badge } from '@/components/shared/Badge'
import { AttachmentViewerModal } from './AttachmentViewerModal'

function getDisplayHtml(email: TicketEmailMessage): string | null {
  return email.sanitizedHtmlBody ?? null
}

function getDisplayText(email: TicketEmailMessage): string | null {
  return email.bodyText ?? email.bodyPreview ?? null
}

interface EmailThreadProps {
  emails: TicketEmailMessage[]
  onSelectEmail?: (email: TicketEmailMessage) => void
}

function dispatchStatusDisplay(status: string | null) {
  switch (status) {
    case 'QUEUED': return { icon: <Clock size={10} />, label: 'Queued', color: 'text-gray-500' }
    case 'PROCESSING':
    case 'SENDING':
      return { icon: <Clock size={10} />, label: 'Sending', color: 'text-blue-500' }
    case 'SENT': return { icon: <CheckCircle2 size={10} />, label: 'Sent', color: 'text-green-600' }
    case 'DISPATCHED': return { icon: <CheckCircle2 size={10} />, label: 'Dispatched', color: 'text-green-600' }
    case 'DELIVERED': return { icon: <CheckCircle2 size={10} />, label: 'Delivered', color: 'text-green-600' }
    case 'FAILED':
    case 'PERMANENTLY_FAILED':
      return { icon: <AlertCircle size={10} />, label: 'Failed', color: 'text-red-500' }
    default: return null
  }
}

function EmailCard({ email, onSelect }: { email: TicketEmailMessage; onSelect?: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const isInbound = email.direction === 'INBOUND'

  const timestamp = email.receivedAt ?? email.sentAt ?? ''
  const htmlContent = getDisplayHtml(email)
  const textContent = getDisplayText(email)

  const dispatch = !isInbound ? dispatchStatusDisplay(email.dispatchStatus) : null

  return (
    <div
      className={clsx(
        'rounded-lg border shadow-sm overflow-hidden',
        isInbound ? 'border-gray-200 bg-white' : 'border-indigo-200 bg-indigo-50/30',
      )}
    >
      {/* Header — clickable to expand */}
      <div
        role="button"
        tabIndex={0}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded((v) => !v)
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isInbound ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-xs">
              <Mail size={10} /> Inbound
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-xs">
              <MailCheck size={10} /> Outbound
            </span>
          )}
          <span className="text-sm font-medium text-gray-800 truncate">{email.from ?? 'Unknown'}</span>
          {email.subject && (
            <span className="text-xs text-gray-400 truncate hidden sm:inline">— {email.subject}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {onSelect && (
            <button
              type="button"
              aria-label="Open email detail"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
            >
              <ExternalLink size={11} />
              Detail
            </button>
          )}
          {dispatch && (
            <span className={clsx('inline-flex items-center gap-1 text-xs', dispatch.color)}>
              {dispatch.icon} {dispatch.label}
            </span>
          )}
          {email.attachmentCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-gray-400 text-xs">
              <Paperclip size={10} /> {email.attachmentCount}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {timestamp ? format(new Date(timestamp), 'MMM d, HH:mm') : ''}
          </span>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {/* Preview — always shown */}
      {!expanded && email.bodyPreview && (
        <div className="px-4 pb-3 text-xs text-gray-500 line-clamp-2">{email.bodyPreview}</div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Address info */}
          <div className="px-4 py-2 bg-gray-50/60 text-xs space-y-0.5">
            <div><span className="text-gray-400 w-10 inline-block">From:</span> <span className="text-gray-700">{email.from ?? '—'}</span></div>
            <div><span className="text-gray-400 w-10 inline-block">To:</span> <span className="text-gray-700">{email.to.join(', ') || '—'}</span></div>
            {email.cc.length > 0 && (
              <div><span className="text-gray-400 w-10 inline-block">Cc:</span> <span className="text-gray-700">{email.cc.join(', ')}</span></div>
            )}
            {email.bcc.length > 0 && (
              <div><span className="text-gray-400 w-10 inline-block">Bcc:</span> <span className="text-gray-700">{email.bcc.join(', ')}</span></div>
            )}
            {email.mailboxName && (
              <div><span className="text-gray-400 w-10 inline-block">Via:</span> <span className="text-gray-700">{email.mailboxName}</span></div>
            )}
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            {htmlContent ? (
              <div className="prose prose-sm max-w-none text-gray-800 overflow-x-auto" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            ) : textContent ? (
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{textContent}</pre>
            ) : (
              <p className="text-sm text-gray-400 italic">No body content available.</p>
            )}
          </div>

          {/* Attachments */}
          {email.attachmentCount > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/40">
              <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800" onClick={() => setShowAttachments(true)}>
                <Paperclip size={12} />
                View Attachments
              </button>
            </div>
          )}
        </div>
      )}

      <AttachmentViewerModal
        isOpen={showAttachments}
        onClose={() => setShowAttachments(false)}
        title="Email Attachments"
        attachments={email.attachments.map((att) => ({
          id: att.id,
          fileName: att.fileName,
          contentType: att.contentType,
          size: att.sizeBytes ?? att.size,
          downloadUrl: att.downloadUrl,
        }))}
        unavailableMessage="Attachment metadata is not available for this message."
      />
    </div>
  )
}

export function EmailThread({ emails, onSelectEmail }: EmailThreadProps) {
  if (emails.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">
        No email messages in this thread.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-3">
      {emails.map((email, idx) => {
        const prev = emails[idx - 1]
        const ts = email.receivedAt ?? email.sentAt ?? ''
        const prevTs = prev ? (prev.receivedAt ?? prev.sentAt ?? '') : ''

        let divider: React.ReactNode = null
        if (prev && ts && prevTs) {
          const gapMins = differenceInMinutes(new Date(ts), new Date(prevTs))
          if (gapMins > 30) {
            divider = (
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 px-2">— {format(new Date(ts), 'MMMM d, HH:mm')} —</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )
          }
        }

        return (
          <div key={email.id}>
            {divider}
            <EmailCard email={email} onSelect={onSelectEmail ? () => onSelectEmail(email) : undefined} />
          </div>
        )
      })}
    </div>
  )
}
