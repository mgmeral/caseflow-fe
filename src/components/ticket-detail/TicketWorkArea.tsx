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

  const workAreaToneClass =
    activeTab === 'notes'
      ? 'ticket-detail-workarea-notes'
      : activeTab === 'activity'
        ? 'ticket-detail-workarea-activity'
        : 'ticket-detail-workarea-attachments'

  const activeTabClass =
    activeTab === 'notes'
      ? 'ticket-detail-tab-active-notes'
      : activeTab === 'activity'
        ? 'ticket-detail-tab-active-activity'
        : 'ticket-detail-tab-active-attachments'

  const activeCountClass =
    activeTab === 'notes'
      ? 'ticket-detail-tab-count-active-notes'
      : activeTab === 'activity'
        ? 'ticket-detail-tab-count-active-activity'
        : 'ticket-detail-tab-count-active-attachments'

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
    <div className={clsx('flex shrink-0 flex-col border-t border-white/80', workAreaToneClass)} style={{ height: '45%', minHeight: '240px' }}>
      {/* Tab bar */}
      <div className="ticket-detail-tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'ticket-detail-tab',
              activeTab === tab.key && 'ticket-detail-tab-active',
              activeTab === tab.key && activeTabClass,
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count != null && (
              <span
                className={clsx(
                  'ticket-detail-tab-count',
                  activeTab === tab.key
                    ? activeCountClass
                    : '',
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
        <div className="ticket-detail-panel-notes flex flex-col flex-1 min-h-0">
          {/* Notes list — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <NotesList notes={internalNotes} />
          </div>
          {/* Composer — sticky at bottom */}
          <ComposeArea onSendNote={onSendNote} isSendingNote={isSendingNote} />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="ticket-detail-panel-activity flex-1 min-h-0 overflow-y-auto p-5">
          <TicketActivityTimeline activities={activities} isLoading={isActivityLoading} />
        </div>
      )}

      {activeTab === 'attachments' && (
        <div className="ticket-detail-panel-attachments flex-1 min-h-0 overflow-y-auto p-5">
          {isAttachmentLoading ? (
            <div className="py-6 text-center text-sm text-gray-400">Loading attachments…</div>
          ) : attachments.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="ticket-detail-attachments-summary text-xs font-medium">
                  {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                </span>
                {onViewAttachments && (
                  <button
                    type="button"
                    className="ticket-detail-attachments-link text-xs font-semibold"
                    onClick={onViewAttachments}
                  >
                    View All
                  </button>
                )}
              </div>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="ticket-detail-attachment-row"
                >
                  <div className="ticket-detail-attachment-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <Paperclip size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="ticket-detail-attachment-name truncate text-sm font-medium">{att.fileName}</div>
                    <div className="ticket-detail-attachment-meta text-xs">{att.contentType ?? 'Unknown type'}</div>
                  </div>
                  {att.downloadUrl && (
                    <a
                      href={att.downloadUrl}
                      download
                      className="ticket-detail-attachment-action shrink-0 text-xs font-medium"
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
