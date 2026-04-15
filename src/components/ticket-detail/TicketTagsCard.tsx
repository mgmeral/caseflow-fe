import { useMemo, useState } from 'react'
import { AlertTriangle, Plus, RefreshCw, Tags, X } from 'lucide-react'
import { ApiError } from '@/services/api.client'
import { useActiveTags, useAddTicketTag, useCreateTag, useRemoveTicketTag, useTicketTags } from '@/hooks/useTags'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/shared/Button'
import { ColorField, normalizeOptionalHexColor } from '@/components/shared/ColorField'

interface TicketTagsCardProps {
  ticketId: string
}

function formatTagMutationError(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const status = 'status' in error ? Number((error as { status?: unknown }).status) : null
    const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''

    if (status === 409 || /duplicate|already/i.test(message)) {
      return 'This tag is already assigned to the ticket.'
    }

    if (message.trim()) {
      return message.trim()
    }
  }

  if (error instanceof ApiError) {
    const message = error.message?.trim()
    if (error.status === 409 || /duplicate|already/i.test(message)) {
      return 'This tag is already assigned to the ticket.'
    }
    return message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}

function getAssignedTagLabel(assignment: { tagId: string; tagName: string | null; tagCode: string | null }): string | null {
  const tagName = assignment.tagName?.trim()
  if (tagName) return tagName

  const tagCode = assignment.tagCode?.trim()
  if (tagCode) return tagCode

  const tagId = assignment.tagId.trim()
  if (tagId) return `Tag #${tagId}`

  return null
}

export function TicketTagsCard({ ticketId }: TicketTagsCardProps) {
  const { success, error: showError } = useToast()
  const {
    data: assignments = [],
    isLoading: isAssignedLoading,
    isError: isAssignedError,
    refetch: refetchAssigned,
  } = useTicketTags(ticketId)
  const {
    data: activeTags = [],
    isLoading: isActiveLoading,
    isError: isActiveError,
    refetch: refetchActive,
  } = useActiveTags()
  const addTagMutation = useAddTicketTag(ticketId)
  const removeTagMutation = useRemoveTicketTag(ticketId)
  const createTagMutation = useCreateTag()

  const [selectedTagId, setSelectedTagId] = useState('')
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [createCode, setCreateCode] = useState('')
  const [createName, setCreateName] = useState('')
  const [createColor, setCreateColor] = useState('')
  const [createActive, setCreateActive] = useState(true)

  const assignedTags = useMemo(
    () => assignments.map((assignment) => assignment.tag).filter((tag): tag is NonNullable<typeof tag> => tag !== null),
    [assignments],
  )

  const visibleAssignments = useMemo(() => {
    return assignments
      .map((assignment) => {
        const label = getAssignedTagLabel(assignment)
        if (!label) return null

        const tagCode = assignment.tagCode?.trim() || null
        const showCode = Boolean(tagCode && assignment.tagName?.trim() && tagCode !== label)

        return {
          ...assignment,
          label,
          showCode,
          accentColor: assignment.tagColor ?? assignment.tag?.color ?? null,
        }
      })
      .filter((assignment): assignment is NonNullable<typeof assignment> => assignment !== null)
  }, [assignments])

  const availableTags = useMemo(() => {
    const assignedIds = new Set(assignments.map((assignment) => assignment.tagId).filter(Boolean))
    return activeTags.filter((tag) => tag.isActive && !assignedIds.has(tag.id))
  }, [activeTags, assignments])
  const normalizedCreateColor = normalizeOptionalHexColor(createColor)
  const canCreateTag = createCode.trim().length >= 2 && createName.trim().length >= 2 && (!createColor.trim() || Boolean(normalizedCreateColor))

  const handleRetry = () => {
    void refetchAssigned()
    void refetchActive()
  }

  const handleAddTag = () => {
    if (!selectedTagId) return

    setInlineError(null)
    addTagMutation.mutate(selectedTagId, {
      onSuccess: () => {
        success('Tag added to ticket.')
        setSelectedTagId('')
      },
      onError: (error) => {
        const message = formatTagMutationError(error, 'Failed to add tag to ticket.')
        setInlineError(message)
        showError(message)
      },
    })
  }

  const handleRemoveTag = (tagId: string) => {
    setInlineError(null)
    removeTagMutation.mutate(tagId, {
      onSuccess: () => {
        success('Tag removed from ticket.')
      },
      onError: (error) => {
        const message = formatTagMutationError(error, 'Failed to remove tag from ticket.')
        setInlineError(message)
        showError(message)
      },
    })
  }

  const resetCreateState = () => {
    setCreateCode('')
    setCreateName('')
    setCreateColor('')
    setCreateActive(true)
    setShowCreatePanel(false)
  }

  const handleCreateTag = async () => {
    if (!canCreateTag) return

    setInlineError(null)

    try {
      const created = await createTagMutation.mutateAsync({
        code: createCode.trim().toUpperCase(),
        name: createName.trim(),
        color: normalizedCreateColor,
        isActive: createActive,
      })

      await refetchActive()
      success('Tag created.')
      if (created.isActive) {
        setSelectedTagId(created.id)
      }
      resetCreateState()
    } catch (error) {
      const message = formatTagMutationError(error, 'Failed to create tag.')
      setInlineError(message)
      showError(message)
    }
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="px-4 py-2.5 flex items-center gap-2">
        <Tags size={13} className="text-gray-400" />
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tags</h3>
        {visibleAssignments.length > 0 ? (
          <span className="ml-auto rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500 border border-gray-200/60">
            {visibleAssignments.length}
          </span>
        ) : null}
      </div>

      <div className="px-4 pb-3 space-y-2.5">
        {isAssignedError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-800 space-y-2">
            <div>Ticket tags could not be loaded.</div>
            <Button variant="secondary" size="sm" onClick={handleRetry} leftIcon={<RefreshCw size={12} />}>
              Retry
            </Button>
          </div>
        ) : isAssignedLoading ? (
          <p className="text-xs text-gray-400">Loading ticket tags...</p>
        ) : visibleAssignments.length === 0 ? (
          <p className="text-xs text-gray-400">No tags assigned to this ticket.</p>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Assigned Tags</div>
            <div className="flex flex-wrap gap-2" aria-label="Assigned tag list">
            {visibleAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs"
                style={{
                  borderColor: assignment.accentColor ?? '#d1d5db',
                  backgroundColor: assignment.accentColor ? `${assignment.accentColor}1A` : '#ffffff',
                }}
              >
                <span className="font-medium text-gray-700">{assignment.label}</span>
                {assignment.showCode ? <span className="text-gray-400">{assignment.tagCode}</span> : null}
                <button
                  type="button"
                  aria-label={`Remove ${assignment.label}`}
                  onClick={() => handleRemoveTag(assignment.tagId)}
                  disabled={removeTagMutation.isPending}
                  className="text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            </div>
          </div>
        )}

        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="space-y-1">
            <label htmlFor="ticket-tag-select" className="block text-xs font-medium text-gray-600">Add Tag</label>
            <p className="text-[11px] text-gray-400">Add one active tag at a time.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              id="ticket-tag-select"
              aria-label="Add tag"
              value={selectedTagId}
              onChange={(event) => setSelectedTagId(event.target.value)}
              disabled={isActiveLoading || addTagMutation.isPending || isAssignedError}
              className="ui-select flex-1"
            >
              <option value="">Select a tag</option>
              {availableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name} ({tag.code})</option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={12} />}
              onClick={handleAddTag}
              disabled={!selectedTagId || addTagMutation.isPending || isActiveLoading}
              isLoading={addTagMutation.isPending}
            >
              Add Tag
            </Button>
          </div>

          {isActiveError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <div>
                Active tag options could not be loaded.
                <button type="button" onClick={handleRetry} className="ml-2 font-semibold text-amber-900 hover:text-amber-950">Retry</button>
              </div>
            </div>
          ) : isActiveLoading ? (
            <p className="text-xs text-gray-400">Loading active tags...</p>
          ) : availableTags.length === 0 ? (
            <p className="text-[11px] text-gray-400">No tags available.</p>
          ) : null}

          {inlineError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{inlineError}</div>
          ) : null}

          <div className="surface-section px-3 py-3 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-slate-900">Need a new tag?</div>
                <div className="mt-0.5 text-[11px] text-slate-600">Create it here without leaving the ticket.</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCreatePanel((value) => !value)}>
                {showCreatePanel ? 'Hide' : 'Quick Create'}
              </Button>
            </div>

            {showCreatePanel ? (
              <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-gray-700">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Tag Code</span>
                    <input
                      value={createCode}
                      onChange={(event) => setCreateCode(event.target.value.toUpperCase())}
                      placeholder="VIP"
                      className="ui-input font-mono uppercase"
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Tag Name</span>
                    <input
                      value={createName}
                      onChange={(event) => setCreateName(event.target.value)}
                      placeholder="Priority Customer"
                      className="ui-input"
                    />
                  </label>
                </div>

                <ColorField value={createColor} onChange={setCreateColor} label="Tag Color" helperText="Use the same color here that operators should recognize in ticket and report views." />

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={createActive}
                    onChange={(event) => setCreateActive(event.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Make this tag active immediately
                </label>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={resetCreateState}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleCreateTag} disabled={!canCreateTag} isLoading={createTagMutation.isPending}>
                    Create Tag
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}