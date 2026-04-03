import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/shared/Button'
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
    <div className="border-t-2 border-amber-300">
      {/* Header */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-amber-700">
          <Lock size={14} />
          Internal Note
        </div>
      </div>

      {/* Banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
        <Lock size={12} className="text-amber-600" />
        <span className="text-xs text-amber-700 font-medium">
          Only visible to your team — not sent to the customer
        </span>
      </div>

      {/* Textarea */}
      <div className="p-4 bg-amber-50/40">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add an internal note for your team…"
          rows={4}
          className="w-full text-sm resize-none border border-amber-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
          }}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">Ctrl + Enter to send</span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            isLoading={isSendingNote}
            disabled={!content.trim()}
            leftIcon={<Lock size={13} />}
            className="bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 border-amber-500"
          >
            Save Note
          </Button>
        </div>
      </div>
    </div>
  )
}
