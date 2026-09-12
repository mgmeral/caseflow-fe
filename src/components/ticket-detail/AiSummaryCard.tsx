import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useAiSummary } from '@/hooks/useAiSummary'
import { getErrorMessage } from '@/lib/errors'

interface AiSummaryCardProps {
  ticketId: string
}

export function AiSummaryCard({ ticketId }: AiSummaryCardProps) {
  const { result, isLoading, isError, error, generate } = useAiSummary(ticketId)

  return (
    <div className="rounded-xl bg-white border border-gray-200/60 shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles size={12} className="text-indigo-400" aria-hidden="true" />
          AI Summary
        </h3>
        <span className="text-[10px] font-medium text-slate-400 italic">Suggestion only</span>
      </div>

      <div className="px-4 pb-4">
        {/* Idle — no result yet */}
        {!isLoading && !isError && !result && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-400">
              Generate a concise summary of this ticket&apos;s context and history.
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles size={13} />}
              onClick={() => generate()}
            >
              Generate Summary
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 py-1 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin text-indigo-400 shrink-0" aria-hidden="true" />
            Generating summary…
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-rose-500" aria-hidden="true" />
              <p className="text-xs text-rose-700">{getErrorMessage(error, 'AI summary could not be generated.')}</p>
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
              {result.unavailableReason || 'AI summary is currently unavailable.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => generate()}>
              Retry
            </Button>
          </div>
        )}

        {/* Success — has content */}
        {!isLoading && !isError && result && result.available && result.summary && (
          <div className="space-y-2.5">
            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                {result.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-amber-700">{warning}</p>
                ))}
              </div>
            )}

            {/* Summary text */}
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{result.summary}</p>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {result.model && (
                <span className="text-[10px] text-slate-300">{result.model}</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Sparkles size={12} />}
                onClick={() => generate()}
                className="ml-auto"
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {/* Empty — request succeeded but AI returned nothing */}
        {!isLoading && !isError && result && result.available && !result.summary && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">No summary could be generated for this ticket.</p>
            <Button variant="secondary" size="sm" onClick={() => generate()}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
