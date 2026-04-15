import { useState } from 'react'
import { Send, Mail, FileText, ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import type { TicketTemplate } from '@/types/user.types'

interface ReplyComposerModalProps {
  isOpen: boolean
  onClose: () => void
  templates: TicketTemplate[]
  customerName: string
  onSend: (content: string) => void
  isSending: boolean
}

type Mode = 'pick' | 'compose'

export function ReplyComposerModal({
  isOpen,
  onClose,
  templates,
  customerName,
  onSend,
  isSending,
}: ReplyComposerModalProps) {
  const [mode, setMode] = useState<Mode>('pick')
  const [content, setContent] = useState('')

  if (!isOpen) return null

  const handleSelectTemplate = (template: TicketTemplate) => {
    setContent(template.content)
    setMode('compose')
  }

  const handleNewMail = () => {
    setContent('')
    setMode('compose')
  }

  const handleSend = () => {
    if (!content.trim()) return
    onSend(content.trim())
    setContent('')
    setMode('pick')
    onClose()
  }

  const handleClose = () => {
    setContent('')
    setMode('pick')
    onClose()
  }

  const activeTemplates = templates.filter((t) => t.type === 'public_reply' && t.isActive)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {mode === 'compose' && (
                <button
                  type="button"
                  onClick={() => setMode('pick')}
                  className="text-gray-400 hover:text-gray-600 mr-1"
                  aria-label="Back"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <Mail size={16} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">
                {mode === 'pick' ? `Reply to ${customerName}` : 'Compose Reply'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {mode === 'pick' ? (
              <div className="p-5 space-y-3">
                {/* New mail option */}
                <button
                  type="button"
                  onClick={handleNewMail}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                    <Mail size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-700">New Mail</p>
                    <p className="text-xs text-gray-400 mt-0.5">Boş bir e-posta oluştur</p>
                  </div>
                </button>

                {/* Divider */}
                {activeTemplates.length > 0 && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">veya şablon seç</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}

                {/* Templates */}
                {activeTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className="group flex w-full items-start gap-3 rounded-xl border border-gray-200 px-4 py-3.5 text-left transition-colors hover:border-indigo-300 hover:bg-white/70"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <FileText size={15} className="text-gray-500 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{tpl.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{tpl.content.split('\n')[0]}</p>
                    </div>
                  </button>
                ))}

                {activeTemplates.length === 0 && (
                  <p className="text-xs text-center text-gray-400 py-2">Henüz şablon oluşturulmamış.</p>
                )}
              </div>
            ) : (
              <div className="p-5">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Müşteriye yanıtınızı yazın…"
                  rows={10}
                  autoFocus
                  className="ui-textarea min-h-[220px] w-full resize-none px-3 py-2.5 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer — only in compose mode */}
          {mode === 'compose' && (
            <div className="operational-modal-footer flex items-center justify-between px-5 py-4">
              <span className="text-xs text-gray-400">Ctrl + Enter to send</span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleClose}>
                  İptal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Send size={13} />}
                  onClick={handleSend}
                  isLoading={isSending}
                  disabled={!content.trim()}
                >
                  Gönder
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
