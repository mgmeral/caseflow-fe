import { useState } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import { ChevronDown, ChevronUp, Lock, Mail, MailCheck } from 'lucide-react'
import { clsx } from 'clsx'
import type { TicketMessage } from '@/types/ticket.types'

interface ConversationThreadProps {
  messages: TicketMessage[]
}

interface MessageGroup {
  type: 'message' | 'system_group'
  messages: TicketMessage[]
}

function buildGroups(messages: TicketMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  let i = 0

  while (i < messages.length) {
    const msg = messages[i]
    if (msg.type === 'system_event') {
      // Collect consecutive system events
      const systemMsgs: TicketMessage[] = [msg]
      while (i + 1 < messages.length && messages[i + 1].type === 'system_event') {
        i++
        systemMsgs.push(messages[i])
      }
      groups.push({ type: 'system_group', messages: systemMsgs })
    } else {
      groups.push({ type: 'message', messages: [msg] })
    }
    i++
  }

  return groups
}

function SystemEventGroup({ messages }: { messages: TicketMessage[] }) {
  const [expanded, setExpanded] = useState(false)

  if (messages.length === 1) {
    return (
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 px-2">{messages[0].content}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    )
  }

  return (
    <div className="my-2">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 mx-auto text-xs text-gray-400 hover:text-gray-600"
      >
        <div className="w-16 h-px bg-gray-200" />
        {messages.length} system events
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        <div className="w-16 h-px bg-gray-200" />
      </button>
      {expanded && (
        <div className="mt-1 space-y-1">
          {messages.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 px-2">{m.content}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CommentCard({ message }: { message: TicketMessage }) {
  const isNote = message.type === 'internal_note'
  const isInbound = message.type === 'public_inbound'

  return (
    <div
      className={clsx(
        'rounded-lg border shadow-sm overflow-hidden',
        isNote ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white',
      )}
    >
      <div className="px-4 py-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            {isNote ? (
              <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                <Lock size={10} />
                Internal Note
              </span>
            ) : isInbound ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                <Mail size={10} />
                Customer
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                <MailCheck size={10} />
                Agent Reply
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{format(new Date(message.createdAt), 'MMM d, HH:mm')}</span>
            <span className="font-medium text-gray-600">{message.authorName}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ConversationThread({ messages }: ConversationThreadProps) {
  const groups = buildGroups(messages)

  return (
    <div className="p-6 space-y-3">
      {groups.map((group, gIdx) => {
        const prevGroup = groups[gIdx - 1]
        const prevMsg = prevGroup?.messages[prevGroup.messages.length - 1]
        const currMsg = group.messages[0]

        // Date divider if >30 min gap
        let divider: React.ReactNode = null
        if (prevMsg && group.type === 'message') {
          const gapMins = differenceInMinutes(
            new Date(currMsg.createdAt),
            new Date(prevMsg.createdAt),
          )
          if (gapMins > 30) {
            divider = (
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 px-2">
                  — {format(new Date(currMsg.createdAt), 'MMMM d, HH:mm')} —
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )
          }
        }

        return (
          <div key={gIdx}>
            {divider}
            {group.type === 'system_group' ? (
              <SystemEventGroup messages={group.messages} />
            ) : (
              <CommentCard message={group.messages[0]} />
            )}
          </div>
        )
      })}
    </div>
  )
}
