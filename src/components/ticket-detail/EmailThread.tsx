import { useState } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import {
  ChevronDown, ChevronUp, Mail, MailCheck, Paperclip, AlertCircle, Clock,
  CheckCircle2, ExternalLink,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { TicketEmailMessage } from '@/types/email.types'
import type { TicketMessage } from '@/types/ticket.types'
import { useTicketEmailDetailByDirection } from '@/hooks/useTicketEmails'
import { getDispatchStatusMeta, getEmailDisplayHtml, getEmailDisplayText, isFailedDispatch } from '@/lib/ticketEmailUi'

interface EmailThreadProps {
  ticketPublicId: string | null
  emails: TicketEmailMessage[]
  messageFallbacks?: TicketMessage[]
  onSelectEmail?: (email: TicketEmailMessage) => void
}

function normalizeValue(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function getEmailDirectionMessageType(direction: TicketEmailMessage['direction']): TicketMessage['type'] {
  return direction === 'INBOUND' ? 'public_inbound' : 'public_outbound'
}

function getEmailTimestamp(email: TicketEmailMessage): string {
  return email.receivedAt ?? email.sentAt ?? ''
}

function findMessageFallback(email: TicketEmailMessage, messages: TicketMessage[]): TicketMessage | null {
  const expectedType = getEmailDirectionMessageType(email.direction)
  const emailTimestamp = getEmailTimestamp(email)
  const emailAuthor = normalizeValue(email.from)

  return messages.find((message) => {
    if (message.type !== expectedType) return false
    if (message.id === email.id) return true

    const messageAuthor = normalizeValue(message.authorName)
    const sameTimestamp = emailTimestamp && message.createdAt === emailTimestamp
    const sameAuthor = emailAuthor && messageAuthor && (
      messageAuthor === emailAuthor
      || messageAuthor.includes(emailAuthor)
      || emailAuthor.includes(messageAuthor)
    )

    return Boolean(sameTimestamp && sameAuthor)
  }) ?? null
}

function dispatchStatusDisplay(status: string | null) {
  const meta = getDispatchStatusMeta(status)

  if (!meta) return null

  switch (meta.category) {
    case 'pending':
      return { icon: <Clock size={10} />, label: meta.label, color: 'text-gray-500' }
    case 'active':
      return { icon: <Clock size={10} />, label: meta.label, color: 'text-blue-500' }
    case 'success':
      return { icon: <CheckCircle2 size={10} />, label: meta.label, color: 'text-green-600' }
    case 'error':
      return { icon: <AlertCircle size={10} />, label: meta.label, color: 'text-red-500' }
    default:
      return null
  }
}

function EmailCard({ ticketPublicId, email, messageFallbacks, onSelect }: { ticketPublicId: string | null; email: TicketEmailMessage; messageFallbacks: TicketMessage[]; onSelect?: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const isInbound = email.direction === 'INBOUND'
  const detailLookupId = email.detailId ?? email.emailDocumentId ?? ''
  const needsHydration = expanded
  const shouldLoadDetail = needsHydration && (
    email.attachments.length === 0
    || (!email.sanitizedHtmlBody && !email.bodyText)
    || (isFailedDispatch(email.dispatchStatus) && !email.failureReason)
  )
  const { data: hydratedEmail, isLoading: isHydrating } = useTicketEmailDetailByDirection(
    ticketPublicId ?? '',
    detailLookupId,
    email.detailType ?? email.direction,
    shouldLoadDetail && !!ticketPublicId && !!detailLookupId,
  )
  const displayEmail = hydratedEmail
    ? { ...email, ...hydratedEmail, sourceEventId: email.sourceEventId ?? hydratedEmail.sourceEventId }
    : email
  const fallbackMessage = findMessageFallback(displayEmail, messageFallbacks)

  const timestamp = displayEmail.receivedAt ?? displayEmail.sentAt ?? ''
  const htmlContent = getEmailDisplayHtml(displayEmail)
  const textContent = getEmailDisplayText(displayEmail) ?? fallbackMessage?.content ?? null

  const dispatch = !isInbound ? dispatchStatusDisplay(displayEmail.dispatchStatus) : null
  const failedReason = !isInbound && isFailedDispatch(displayEmail.dispatchStatus) ? displayEmail.failureReason : null

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
          <span className="text-sm font-medium text-gray-800 truncate">{displayEmail.from ?? 'Unknown'}</span>
          {displayEmail.subject && (
            <span className="text-xs text-gray-400 truncate hidden sm:inline">— {displayEmail.subject}</span>
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
          {displayEmail.attachmentCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-gray-400 text-xs">
              <Paperclip size={10} /> {displayEmail.attachmentCount}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {timestamp ? format(new Date(timestamp), 'MMM d, HH:mm') : ''}
          </span>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {/* Preview — always shown */}
      {!expanded && displayEmail.bodyPreview && (
        <div className="px-4 pb-3 text-xs text-gray-500 line-clamp-2">{displayEmail.bodyPreview}</div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Address info */}
          <div className="px-4 py-2 bg-gray-50/60 text-xs space-y-0.5">
            <div><span className="text-gray-400 w-10 inline-block">From:</span> <span className="text-gray-700">{displayEmail.from ?? '—'}</span></div>
            <div><span className="text-gray-400 w-10 inline-block">To:</span> <span className="text-gray-700">{displayEmail.to.join(', ') || '—'}</span></div>
            {displayEmail.cc.length > 0 && (
              <div><span className="text-gray-400 w-10 inline-block">Cc:</span> <span className="text-gray-700">{displayEmail.cc.join(', ')}</span></div>
            )}
            {displayEmail.bcc.length > 0 && (
              <div><span className="text-gray-400 w-10 inline-block">Bcc:</span> <span className="text-gray-700">{displayEmail.bcc.join(', ')}</span></div>
            )}
            {displayEmail.mailboxName && (
              <div><span className="text-gray-400 w-10 inline-block">Via:</span> <span className="text-gray-700">{displayEmail.mailboxName}</span></div>
            )}
            {displayEmail.mailboxAddress && (
              <div><span className="text-gray-400 w-10 inline-block">Box:</span> <span className="text-gray-700">{displayEmail.mailboxAddress}</span></div>
            )}
            {displayEmail.resolvedReplyTarget && (
              <div><span className="text-gray-400 w-10 inline-block">Reply:</span> <span className="text-gray-700 break-all">{displayEmail.resolvedReplyTarget}</span></div>
            )}
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            {isHydrating && !hydratedEmail && !htmlContent && !textContent ? (
              <p className="text-sm text-gray-400 italic">Loading message details...</p>
            ) : htmlContent ? (
              <div className="prose prose-sm max-w-none text-gray-800 overflow-x-auto" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            ) : textContent ? (
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{textContent}</pre>
            ) : (
              <p className="text-sm text-gray-400 italic">No body content available.</p>
            )}
            {failedReason && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                Delivery failed: {failedReason}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export function EmailThread({ ticketPublicId, emails, messageFallbacks = [], onSelectEmail }: EmailThreadProps) {
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
            <EmailCard ticketPublicId={ticketPublicId} email={email} messageFallbacks={messageFallbacks} onSelect={onSelectEmail ? () => onSelectEmail(email) : undefined} />
          </div>
        )
      })}
    </div>
  )
}
