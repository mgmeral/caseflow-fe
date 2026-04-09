import { useMemo, useState } from 'react'
import { MessageSquare, Activity, Paperclip } from 'lucide-react'
import { clsx } from 'clsx'
import type { TicketMessage, TicketActivityItem, TicketAttachment } from '@/types/ticket.types'
import { ComposeArea } from './ComposeArea'
import { TicketActivityTimeline } from './TicketActivityTimeline'
import { NotesList } from './NotesList'

type WorkAreaTab = 'notes' | 'activity' | 'attachments'

interface TicketWorkAreaProps {
  messages: TicketMessage[]
  activities: TicketActivityItem[]
  attachments: TicketAttachment[]
  attachmentEmptyMessage?: string
  isActivityLoading?: boolean
  isAttachmentLoading?: boolean
  onSendNote: (payload: { content: string; mentionedUserIds: string[] }) => void
  isSendingNote: boolean
  onViewAttachments?: () => void
}

export function TicketWorkArea({
  messages,
  activities,
  attachments,
  attachmentEmptyMessage = 'No attachments found.',
  isActivityLoading = false,
  isAttachmentLoading = false,
  onSendNote,
  isSendingNote,
  onViewAttachments,
}: TicketWorkAreaProps) {
  const [activeTab, setActiveTab] = useState<WorkAreaTab>('notes')

  const internalNotes = useMemo(
    () => messages.filter((m) => m.type === 'internal_note'),
    [messages],
  )

  const tabs: { key: WorkAreaTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      key: 'notes',
      label: 'Notes',
      icon: <MessageSquare size={13} />,
      count: internalNotes.length > 0 ? internalNotes.length : undefined,
    },
    {
      key: 'activity',
      label: 'Recent Activity',
      icon: <Activity size={13} />,
      count: activities.length > 0 ? activities.length : undefined,
    },
    {
      key: 'attachments',
      label: 'Attachments',
      icon: <Paperclip size={13} />,
      count: attachments.length > 0 ? attachments.length : undefined,
    },
  ]

  return (
    <div className="border-t-2 border-gray-200/80 bg-white shrink-0 flex flex-col" style={{ height: '45%', minHeight: '240px' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-gray-200/60 bg-gray-50/60 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count != null && (
              <span
                className={clsx(
                  'ml-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold',
                  activeTab === tab.key
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'bg-gray-100 text-gray-500',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'notes' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Notes list — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <NotesList notes={internalNotes} />
          </div>
          {/* Composer — sticky at bottom */}
          <ComposeArea onSendNote={onSendNote} isSendingNote={isSendingNote} />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          <TicketActivityTimeline activities={activities} isLoading={isActivityLoading} />
        </div>
      )}

      {activeTab === 'attachments' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {isAttachmentLoading ? (
            <div className="py-6 text-center text-sm text-gray-400">Loading attachments…</div>
          ) : attachments.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">
                  {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                </span>
                {onViewAttachments && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    onClick={onViewAttachments}
                  >
                    View All
                  </button>
                )}
              </div>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3.5 py-2.5 text-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    <Paperclip size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-gray-800 text-sm">{att.fileName}</div>
                    <div className="text-xs text-gray-400">{att.contentType ?? 'Unknown type'}</div>
                  </div>
                  {att.downloadUrl && (
                    <a
                      href={att.downloadUrl}
                      download
                      className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-gray-400">{attachmentEmptyMessage}</div>
          )}
        </div>
      )}
    </div>
  )
}
