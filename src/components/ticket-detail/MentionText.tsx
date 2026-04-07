import { parseMentionSegments } from '@/lib/mentions'

interface MentionTextProps {
  content: string
}

/**
 * Renders note content with @mentions visually highlighted.
 * Reusable anywhere a note body needs to display mention tokens.
 */
export function MentionText({ content }: MentionTextProps) {
  const segments = parseMentionSegments(content)

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
