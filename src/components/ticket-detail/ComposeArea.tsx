import { useState } from 'react'
import { Lock, Send } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

interface ComposeAreaProps {
  onSendNote: (content: string) => void
  isSendingNote: boolean
}

export function ComposeArea({ onSendNote, isSendingNote }: ComposeAreaProps) {
  const { canAddInternalNote } = usePermissions()
  const [content, setContent] = useState('')

  if (!canAddInternalNote) return null

  const handleSend = () => {
    if (!content.trim()) return
    onSendNote(content.trim())
    setContent('')
  }

  return (
    <div className="border-t border-amber-200 bg-amber-50/40 px-4 py-2.5 shrink-0">
      <div className="flex items-start gap-2">
        <Lock size={12} className="text-amber-500 mt-2 shrink-0" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add an internal note…"
          rows={2}
          className="flex-1 text-sm resize-none border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white leading-snug"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
          }}
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
