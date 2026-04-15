import { useEffect, useState } from 'react'
import { Pencil, Plus, ShieldOff, ToggleLeft, ToggleRight, Tags } from 'lucide-react'
import { useActivateTag, useAllTags, useCreateTag, useDeactivateTag, useUpdateTag } from '@/hooks/useTags'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import type { CreateTagRequest } from '@/types/api.types'
import type { TicketTag } from '@/types/ticket.types'
import { Button } from '@/components/shared/Button'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal } from '@/components/shared/Modal'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { FieldHint, HelpDrawer, InlineCallout, PageIntro, SectionHelp } from '@/components/shared/help'
import { tagsHelp } from '@/help/tags.help'

interface TagFormState {
  code: string
  name: string
  color: string
  isActive: boolean
}

const EMPTY_FORM: TagFormState = {
  code: '',
  name: '',
  color: '',
  isActive: true,
}

const TAG_COLOR_PRESETS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#0d5ac9',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
] as const

function normalizeHexColor(value: string): string {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ''

  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const shortHexMatch = withHash.match(/^#([0-9a-f]{3})$/i)
  if (shortHexMatch) {
    const [, shortHex] = shortHexMatch
    return `#${shortHex.split('').map((character) => `${character}${character}`).join('')}`
  }

  return /^#[0-9a-f]{6}$/i.test(withHash) ? withHash : ''
}

function getReadableTextColor(backgroundColor: string): '#111827' | '#ffffff' {
  const normalized = normalizeHexColor(backgroundColor)
  if (!normalized) return '#111827'

  const red = Number.parseInt(normalized.slice(1, 3), 16)
  const green = Number.parseInt(normalized.slice(3, 5), 16)
  const blue = Number.parseInt(normalized.slice(5, 7), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000

  return brightness >= 160 ? '#111827' : '#ffffff'
}

function getPreviewLabel(form: TagFormState): string {
  const name = form.name.trim()
  if (name) return name

  const code = form.code.trim()
  if (code) return code

  return 'Tag Preview'
}

function toFormState(tag?: TicketTag | null): TagFormState {
  if (!tag) return EMPTY_FORM
  return {
    code: tag.code,
    name: tag.name,
    color: tag.color ?? '',
    isActive: tag.isActive,
  }
}

function buildPayload(form: TagFormState): CreateTagRequest {
  const normalizedColor = normalizeHexColor(form.color)

  return {
    code: form.code.trim(),
    name: form.name.trim(),
    color: normalizedColor || null,
    isActive: form.isActive,
  }
}

export function TagManagementPage() {
  const { canManageAdminConfig } = usePermissions()
  const { success, error: showError } = useToast()
  const { data: tags = [], isLoading, isError, refetch } = useAllTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const activateTag = useActivateTag()
  const deactivateTag = useDeactivateTag()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingTag, setEditingTag] = useState<TicketTag | null>(null)
  const [form, setForm] = useState<TagFormState>(EMPTY_FORM)
  const [showAdvancedColorInput, setShowAdvancedColorInput] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  useEffect(() => {
    if (modalMode === 'edit' && editingTag) {
      setForm(toFormState(editingTag))
      setShowAdvancedColorInput(Boolean(editingTag.color && !TAG_COLOR_PRESETS.includes(normalizeHexColor(editingTag.color) as typeof TAG_COLOR_PRESETS[number])))
      return
    }

    if (modalMode === 'create') {
      setForm(EMPTY_FORM)
      setShowAdvancedColorInput(false)
    }
  }, [editingTag, modalMode])

  if (!canManageAdminConfig) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to manage tags."
        />
      </div>
    )
  }

  const isCreateMode = modalMode === 'create'
  const isEditMode = modalMode === 'edit'
  const isSaving = createTag.isPending || updateTag.isPending
  const formTitle = isCreateMode ? 'Create Tag' : 'Edit Tag'
  const selectedColor = normalizeHexColor(form.color)
  const previewLabel = getPreviewLabel(form)
  const previewTextColor = getReadableTextColor(selectedColor)
  const isPresetColorSelected = selectedColor ? TAG_COLOR_PRESETS.includes(selectedColor as typeof TAG_COLOR_PRESETS[number]) : false

  const handleSave = () => {
    const payload = buildPayload(form)
    if (!payload.code || !payload.name) {
      showError('Code and name are required.')
      return
    }

    if (isCreateMode) {
      createTag.mutate(payload, {
        onSuccess: () => {
          success('Tag created.')
          setModalMode(null)
          setEditingTag(null)
        },
        onError: (error) => {
          showError(error instanceof Error ? error.message : 'Failed to create tag.')
        },
      })
      return
    }

    if (!editingTag) return

    updateTag.mutate({
      tagId: editingTag.id,
      payload,
    }, {
      onSuccess: () => {
        success('Tag updated.')
        setModalMode(null)
        setEditingTag(null)
      },
      onError: (error) => {
        showError(error instanceof Error ? error.message : 'Failed to update tag.')
      },
    })
  }

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header relative z-10 gap-4">
        <div>
          <h1 className="admin-page-title">Tag Management</h1>
          <p className="admin-page-subtitle">Manage backend-controlled ticket tags, including inactive entries.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsHelpOpen(true)}>
            Help
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => { setEditingTag(null); setModalMode('create') }}>
            New Tag
          </Button>
        </div>
      </div>

      <PageIntro summary={tagsHelp.summary} />

      <div className="space-y-4">
        <SectionHelp title={tagsHelp.sections.catalog.title} description={tagsHelp.sections.catalog.description} />
      <div className="admin-table-shell relative z-10">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
          <Tags className="h-4 w-4 text-blue-100/70" />
          <h2 className="text-sm font-semibold text-blue-50">All Tags</h2>
        </div>

        {isLoading ? (
          <table className="w-full"><tbody><SkeletonRow colCount={4} /><SkeletonRow colCount={4} /></tbody></table>
        ) : isError ? (
          <EmptyState
            title="Tags could not be loaded"
            description="The backend tag list is unavailable right now."
            action={{ label: 'Retry', onClick: () => void refetch() }}
          />
        ) : tags.length === 0 ? (
          <EmptyState
            title="No tags found"
            description="Create the first backend-managed tag to start tagging tickets."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-blue-100/72">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-blue-100/72">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-blue-100/72">Color</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-blue-100/72">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-blue-100/72">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-striped divide-y divide-white/10">
              {tags.map((tag) => {
                const isToggling = activateTag.isPending || deactivateTag.isPending

                return (
                  <tr key={tag.id} className="transition-colors hover:bg-white/[0.08]">
                    <td className="px-4 py-3 font-mono text-xs text-blue-100/72">{tag.code}</td>
                    <td className="px-4 py-3 font-medium text-white">{tag.name}</td>
                    <td className="px-4 py-3">
                      {tag.color ? (
                        <span className="inline-flex items-center gap-2 text-blue-50/90">
                          <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: tag.color }} />
                          {tag.color}
                        </span>
                      ) : (
                        <span className="text-blue-100/50">No color</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tag.isActive ? 'bg-emerald-400/18 text-emerald-100 ring-1 ring-emerald-300/25' : 'bg-white/10 text-blue-100/62 ring-1 ring-white/10'}`}>
                        {tag.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" size="sm" leftIcon={<Pencil size={12} />} onClick={() => { setEditingTag(tag); setModalMode('edit') }}>
                          Edit
                        </Button>
                        {tag.isActive ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<ToggleLeft size={12} />}
                            disabled={isToggling}
                            onClick={() => {
                              deactivateTag.mutate(tag.id, {
                                onSuccess: () => success('Tag deactivated.'),
                                onError: (error) => showError(error instanceof Error ? error.message : 'Failed to deactivate tag.'),
                              })
                            }}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<ToggleRight size={12} />}
                            disabled={isToggling}
                            onClick={() => {
                              activateTag.mutate(tag.id, {
                                onSuccess: () => success('Tag activated.'),
                                onError: (error) => showError(error instanceof Error ? error.message : 'Failed to activate tag.'),
                              })
                            }}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>

      <Modal isOpen={modalMode !== null} onClose={() => { setModalMode(null); setEditingTag(null) }} title={formTitle} size="md" variant="admin">
        <div className="space-y-4">
          <SectionHelp title={tagsHelp.sections.editor.title} description={tagsHelp.sections.editor.description} />
          <div>
            <label htmlFor="tag-code" className="block text-xs font-medium text-gray-600 mb-1">Code</label>
            <input
              id="tag-code"
              aria-label="Code"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              disabled={isEditMode}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <FieldHint text={tagsHelp.fieldHints.code} />
          </div>
          <div>
            <label htmlFor="tag-name" className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              id="tag-name"
              aria-label="Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <FieldHint text={tagsHelp.fieldHints.name} />
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Color</label>
              <FieldHint className="mt-0" text={tagsHelp.fieldHints.color} />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tag color palette">
                {TAG_COLOR_PRESETS.map((presetColor) => {
                  const isSelected = selectedColor === presetColor
                  return (
                    <button
                      key={presetColor}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Select color ${presetColor}`}
                      onClick={() => setForm((current) => ({ ...current, color: presetColor }))}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 ${isSelected ? 'border-gray-900' : 'border-white'}`}
                      style={{ backgroundColor: presetColor, boxShadow: isSelected ? '0 0 0 2px #ffffff, 0 0 0 4px #111827' : '0 0 0 1px #d1d5db' }}
                    >
                      <span className="sr-only">{presetColor}</span>
                    </button>
                  )
                })}
              </div>
              {selectedColor && isPresetColorSelected ? (
                <p className="text-xs text-gray-500">Selected preset: {selectedColor}</p>
              ) : null}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
              <div className="mb-2 text-xs font-medium text-gray-600">Live Preview</div>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: selectedColor || '#f3f4f6',
                  borderColor: selectedColor || '#d1d5db',
                  color: selectedColor ? previewTextColor : '#4b5563',
                }}
              >
                <span>{previewLabel}</span>
                {form.code.trim() && form.name.trim() && form.code.trim() !== form.name.trim() ? <span className="opacity-80">{form.code.trim()}</span> : null}
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                onClick={() => setShowAdvancedColorInput((current) => !current)}
                aria-expanded={showAdvancedColorInput}
                aria-controls="advanced-tag-color"
              >
                {showAdvancedColorInput ? 'Hide custom color' : 'Use custom color'}
              </button>

              {showAdvancedColorInput ? (
                <div id="advanced-tag-color" className="grid grid-cols-[auto,1fr] items-end gap-3">
                  <div>
                    <label htmlFor="tag-color-picker" className="block text-xs font-medium text-gray-600 mb-1">Picker</label>
                    <input
                      id="tag-color-picker"
                      aria-label="Color picker"
                      type="color"
                      value={selectedColor || '#0d5ac9'}
                      onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                      className="h-10 w-12 cursor-pointer rounded border border-gray-300 bg-white p-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="tag-color" className="block text-xs font-medium text-gray-600 mb-1">Custom Hex</label>
                    <input
                      id="tag-color"
                      aria-label="Color"
                      value={form.color}
                      onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                      placeholder="#0d5ac9"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              ) : null}

              {!showAdvancedColorInput && !selectedColor ? (
                <p className="text-xs text-gray-400">No color selected. The tag can still be saved without a color.</p>
              ) : null}
              {showAdvancedColorInput && form.color.trim() && !selectedColor ? (
                <p className="text-xs text-amber-700">Enter a valid hex color like #0d5ac9. Invalid values will not be submitted.</p>
              ) : null}
            </div>
          </div>
          <InlineCallout title={tagsHelp.warnings[0].title}>
            {tagsHelp.warnings[0].description.defaultMessage}
          </InlineCallout>
          {isCreateMode ? (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="rounded border-gray-300 text-indigo-600"
              />
              Active on create
            </label>
          ) : null}
          <FieldHint className="mt-0" text={tagsHelp.fieldHints.isActive} />
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setModalMode(null); setEditingTag(null) }}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
              {isCreateMode ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} config={tagsHelp} />
    </div>
  )
}