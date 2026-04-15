import { useCallback, useRef, useState } from 'react'
import { Lock, Send } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useUsers } from '@/hooks/useUsers'
import { collectMentionedUserIds, detectMentionQuery, filterMentionUsers, insertMention } from '@/lib/mentions'
import { MentionSuggestions } from './MentionSuggestions'
import type { User } from '@/types/user.types'

interface ComposeAreaProps {
  onSendNote: (payload: { content: string; mentionedUserIds: string[] }) => void
  isSendingNote: boolean
}

export function ComposeArea({ onSendNote, isSendingNote }: ComposeAreaProps) {
  const { canAddInternalNote } = usePermissions()
  const { users } = useUsers()
  const [content, setContent] = useState('')
  const [selectedMentions, setSelectedMentions] = useState<Array<{ userId: string; displayText: string }>>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filteredUsers = mentionQuery !== null ? filterMentionUsers(users, mentionQuery) : []

  if (!canAddInternalNote) return null

  const handleSend = () => {
    if (!content.trim()) return
    onSendNote({
      content: content.trim(),
      mentionedUserIds: collectMentionedUserIds(content, selectedMentions),
    })
    setContent('')
    setSelectedMentions([])
    setMentionQuery(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    const pos = e.target.selectionStart ?? val.length
    const query = detectMentionQuery(val, pos)
    setMentionQuery(query)
    setActiveIndex(0)
  }

  const handleSelect = useCallback(
    (user: User) => {
      const pos = textareaRef.current?.selectionStart ?? content.length
      const { newText, newCursorPos } = insertMention(content, pos, user)
      setContent(newText)
      setSelectedMentions((current) => {
        if (current.some((mention) => mention.userId === user.id)) return current
        return [...current, { userId: user.id, displayText: user.fullName }]
      })
      setMentionQuery(null)
      setActiveIndex(0)
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      })
    },
    [content],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % filteredUsers.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + filteredUsers.length) % filteredUsers.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSelect(filteredUsers[activeIndex])
        return
      }
    }

    if (e.key === 'Escape' && mentionQuery !== null) {
      e.preventDefault()
      setMentionQuery(null)
      return
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="ticket-detail-composer">
      {/* Mention suggestions — anchored above composer */}
      {mentionQuery !== null && (
        <MentionSuggestions
          users={filteredUsers}
          activeIndex={activeIndex}
          onSelect={handleSelect}
        />
      )}

      <div className="flex items-start gap-2">
        <Lock size={12} className="text-amber-500 mt-2 shrink-0" />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Add an internal note… Type @ to mention someone"
          rows={2}
          className="ticket-detail-composer-input"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || isSendingNote}
          className="mt-1 p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed transition-colors shrink-0"
          title="Save Note (Ctrl+Enter)"
        >
          <Send size={14} />
        </button>
      </div>
      <div className="flex items-center justify-between mt-1 px-5">
        <span className="text-[10px] text-amber-600/70">Team only — not visible to customer</span>
        <span className="text-[10px] text-gray-400">Ctrl+Enter</span>
      </div>
    </div>
  )
}
