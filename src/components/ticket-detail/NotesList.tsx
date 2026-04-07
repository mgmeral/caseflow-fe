import { format } from 'date-fns'
import { Lock } from 'lucide-react'
import type { TicketMessage } from '@/types/ticket.types'

interface NotesListProps {
  notes: TicketMessage[]
}

export function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <Lock className="w-5 h-5 text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">No internal notes yet.</p>
        <p className="text-xs text-gray-400 mt-0.5">Use the composer below to add one.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {notes.map((note) => (
        <div
          key={note.id}
          className="rounded-lg border border-amber-200/70 bg-amber-50/50 px-3.5 py-2.5"
        >
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span className="font-medium text-amber-700">{note.authorName}</span>
            <span>{format(new Date(note.createdAt), 'MMM d, HH:mm')}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
