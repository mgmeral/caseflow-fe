import type { TicketMessage } from '@/types/ticket.types'
import { parseMentionSegmentsWithMetadata } from '@/lib/mentions'

interface MentionTextProps {
  content: string
  mentions?: TicketMessage['mentions']
}

/**
 * Renders note content with @mentions visually highlighted.
 * Reusable anywhere a note body needs to display mention tokens.
 */
export function MentionText({ content, mentions }: MentionTextProps) {
  const segments = parseMentionSegmentsWithMetadata(content, mentions)

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'mention' ? (
          <span
            key={i}
            className="inline-flex items-baseline rounded bg-indigo-100 text-indigo-700 font-medium px-0.5 -mx-px"
          >
            {seg.value}
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </>
  )
}
