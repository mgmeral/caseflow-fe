import { useState } from 'react'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { Mail, MailCheck, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import type { TicketMessage } from '@/types/ticket.types'

interface MessageBubbleProps {
  message: TicketMessage
}

const COLLAPSE_THRESHOLD = 500
const PREVIEW_LENGTH = 400

export function MessageBubble({ message }: MessageBubbleProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (message.type === 'system_event') return null

  const isInbound = message.type === 'public_inbound'
  const isNote = message.type === 'internal_note'
  const isLong = message.content.length > COLLAPSE_THRESHOLD

  const displayContent =
    isLong && collapsed
      ? message.content.slice(0, PREVIEW_LENGTH) + '…'
      : message.content

  // Visual config per type
  const config = isNote
    ? {
        borderColor: 'border-amber-300',
        bg: 'bg-amber-50',
        headerBg: 'bg-amber-100/60',
        accentBar: 'bg-amber-400',
        iconColor: 'text-amber-600',
        icon: <Lock size={13} />,
        label: 'Internal Note',
        labelClass: 'bg-amber-100 text-amber-700 border border-amber-300',
        avatarColor: '#d97706',
      }
    : isInbound
      ? {
          borderColor: 'border-gray-200',
          bg: 'bg-white',
          headerBg: 'bg-gray-50',
          accentBar: 'bg-emerald-500',
          iconColor: 'text-emerald-600',
          icon: <Mail size={13} />,
          label: 'Customer Email',
          labelClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          avatarColor: '#059669',
        }
      : {
          borderColor: 'border-indigo-100',
          bg: 'bg-white',
          headerBg: 'bg-indigo-50/60',
          accentBar: 'bg-indigo-500',
          iconColor: 'text-indigo-500',
          icon: <MailCheck size={13} />,
          label: 'Agent Reply',
          labelClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
          avatarColor: '#4f46e5',
        }

  return (
    <div className={clsx('rounded-lg border overflow-hidden shadow-sm', config.borderColor, config.bg)}>
      {/* Accent bar + header */}
      <div className={clsx('flex items-center gap-3 px-4 py-2.5 border-b', config.headerBg, config.borderColor)}>
        {/* Left accent bar */}
        <div className={clsx('w-1 h-8 rounded-full shrink-0', config.accentBar)} />

        <Avatar name={message.authorName} size="sm" color={config.avatarColor} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{message.authorName}</span>
            <span className={clsx('inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-medium', config.labelClass)}>
              <span className={config.iconColor}>{config.icon}</span>
              {config.label}
            </span>
          </div>
        </div>

        <span className="text-xs text-gray-400 shrink-0">
          {format(new Date(message.createdAt), 'MMM d, HH:mm')}
        </span>

        {isLong && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
        {displayContent}
        {isLong && collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="block mt-2 text-xs text-indigo-600 hover:underline"
          >
            Show full message
          </button>
        )}
      </div>
    </div>
  )
}
