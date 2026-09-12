import { AlertCircle, ClipboardPaste, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useAiReplyDraft } from '@/hooks/useAiReplyDraft'
import { usePermissions } from '@/hooks/usePermissions'
import { getErrorMessage } from '@/lib/errors'

interface AiReplyDraftCardProps {
  ticketId: string
  /**
   * Called when the agent clicks "Apply to editor".
   * The parent is responsible for inserting the draft into the reply composer.
   * This action MUST NOT trigger a send — the agent reviews and sends manually.
   */
  onApplyDraft: (draft: string) => void
}

export function AiReplyDraftCard({ ticketId, onApplyDraft }: AiReplyDraftCardProps) {
  const { canSendTicketEmailReply } = usePermissions()
  const { result, isLoading, isError, error, generate } = useAiReplyDraft(ticketId)

  // Reply draft is only useful for agents who can respond to customers.
  if (!canSendTicketEmailReply) return null

  return (
    <div className="rounded-xl bg-white border border-gray-200/60 shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles size={12} className="text-indigo-400" aria-hidden="true" />
          Suggested Reply
        </h3>
        <span className="text-[10px] font-medium text-slate-400 italic">Draft only — review before sending</span>
      </div>

      <div className="px-4 pb-4">


        {/* Idle */}
        {!isLoading && !isError && !result && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-400">
              Generate a suggested reply draft based on this ticket&apos;s context.
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles size={13} />}
              onClick={() => generate()}
            >
              Generate Reply Draft
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 py-1 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin text-indigo-400 shrink-0" aria-hidden="true" />
            Generating reply draft…
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-rose-500" aria-hidden="true" />
              <p className="text-xs text-rose-700">{getErrorMessage(error, 'Reply draft could not be generated.')}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => generate()}>
              Retry
            </Button>
          </div>
        )}

        {/* Unavailable state */}
        {!isLoading && !isError && result && result.available === false && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">
              {result.unavailableReason || 'AI reply draft is currently unavailable.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => generate()}>
              Retry
            </Button>
          </div>
        )}

        {/* Success — has draft content */}
        {!isLoading && !isError && result && result.available && result.draft && (
          <div className="space-y-2.5">
            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                {result.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-amber-700">{warning}</p>
                ))}
              </div>
            )}

            {/* Draft preview */}
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{result.draft}</p>
            </div>

            {/* Boundary reminder */}
            <p className="text-[11px] text-slate-400">
              Applying this draft opens the reply composer — you can edit it before sending.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ClipboardPaste size={13} />}
                onClick={() => onApplyDraft(result.draft!)}
              >
                Apply to editor
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw size={12} />}
                onClick={() => generate()}
              >
                Regenerate
              </Button>
            </div>

            {result.model && (
              <span className="text-[10px] text-slate-300">{result.model}</span>
            )}
          </div>
        )}

        {/* Empty — request succeeded but AI returned nothing */}
        {!isLoading && !isError && result && result.available && !result.draft && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">No reply draft could be generated for this ticket.</p>
            <Button variant="secondary" size="sm" onClick={() => generate()}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
