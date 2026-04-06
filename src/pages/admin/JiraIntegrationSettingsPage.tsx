import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, PlugZap, RefreshCw, ShieldOff, X } from 'lucide-react'
import { useJiraConfig, useSaveJiraConfig, useTestJiraConnection } from '@/hooks/useIntegrations'
import { usePermissions } from '@/hooks/usePermissions'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { getErrorMessage } from '@/lib/errors'
import { ApiError } from '@/services/api.client'
import type { JiraConfigRequest } from '@/types/integration.types'

interface JiraFormState {
  enabled: boolean
  baseUrl: string
  authType: string
  username: string
  apiToken: string
  projectKey: string
  issueType: string
  defaultLabels: string
  appBaseUrl: string
}

interface ValidationState {
  baseUrl: boolean
  projectKey: boolean
}

const EMPTY_FORM: JiraFormState = {
  enabled: false,
  baseUrl: '',
  authType: 'BASIC',
  username: '',
  apiToken: '',
  projectKey: '',
  issueType: 'Task',
  defaultLabels: '',
  appBaseUrl: '',
}

const EMPTY_VALIDATION: ValidationState = {
  baseUrl: false,
  projectKey: false,
}

const ISSUE_TYPE_SUGGESTIONS = ['Task', 'Bug', 'Story', 'Epic']

function getViolation(error: unknown, field: string): string | null {
  if (!(error instanceof ApiError) || !error.violations?.length) return null
  return error.violations.find((violation) => violation.field === field)?.message ?? null
}

function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, '-')
}

function parseLabels(value: string): string[] {
  if (!value.trim()) return []

  return Array.from(new Set(
    value
      .split(',')
      .map((label) => normalizeLabel(label))
      .filter(Boolean),
  ))
}

function serializeLabels(labels: string[]): string {
  return labels.join(',')
}

function getJiraStatus(config: JiraFormState, isConfigured: boolean): { label: string; variant: 'outline' | 'default' | 'success' } {
  if (!isConfigured) {
    return { label: 'Not configured', variant: 'outline' }
  }

  if (config.enabled) {
    return { label: 'Configured / Enabled', variant: 'success' }
  }

  return { label: 'Configured / Disabled', variant: 'default' }
}

export function JiraIntegrationSettingsPage() {
  const { canManageIntegrationConfig } = usePermissions()
  const configQuery = useJiraConfig()
  const saveMutation = useSaveJiraConfig()
  const testMutation = useTestJiraConnection()
  const [form, setForm] = useState<JiraFormState>(EMPTY_FORM)
  const [labelDraft, setLabelDraft] = useState('')
  const [saveError, setSaveError] = useState<unknown>(null)
  const [validation, setValidation] = useState<ValidationState>(EMPTY_VALIDATION)
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (!configQuery.data) {
      setForm(EMPTY_FORM)
      setLabelDraft('')
      return
    }

    setForm({
      enabled: configQuery.data.enabled,
      baseUrl: configQuery.data.baseUrl ?? '',
      authType: configQuery.data.authType ?? 'BASIC',
      username: configQuery.data.username ?? '',
      apiToken: '',
      projectKey: configQuery.data.projectKey ?? '',
      issueType: configQuery.data.issueType ?? 'Task',
      defaultLabels: configQuery.data.defaultLabels ?? '',
      appBaseUrl: configQuery.data.appBaseUrl ?? '',
    })
    setLabelDraft('')
  }, [configQuery.data])

  const hasSavedToken = configQuery.data?.apiToken === '****'
  const isExistingConfig = Boolean(configQuery.data)
  const labelChips = useMemo(() => parseLabels(form.defaultLabels), [form.defaultLabels])
  const saveErrorMessage = saveError ? getErrorMessage(saveError, 'Failed to save Jira integration settings.') : null
  const initialSnapshot = useMemo(() => ({
    enabled: configQuery.data?.enabled ?? EMPTY_FORM.enabled,
    baseUrl: configQuery.data?.baseUrl ?? EMPTY_FORM.baseUrl,
    authType: configQuery.data?.authType ?? EMPTY_FORM.authType,
    username: configQuery.data?.username ?? EMPTY_FORM.username,
    apiToken: '',
    projectKey: configQuery.data?.projectKey ?? EMPTY_FORM.projectKey,
    issueType: configQuery.data?.issueType ?? EMPTY_FORM.issueType,
    defaultLabels: configQuery.data?.defaultLabels ?? EMPTY_FORM.defaultLabels,
    appBaseUrl: configQuery.data?.appBaseUrl ?? EMPTY_FORM.appBaseUrl,
  }), [configQuery.data])
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialSnapshot), [form, initialSnapshot])
  const status = useMemo(() => getJiraStatus(form, isExistingConfig), [form, isExistingConfig])
  const violationSummary = useMemo(() => {
    if (!(saveError instanceof ApiError) || !saveError.violations?.length) return []
    return saveError.violations.map((violation) => `${violation.field}: ${violation.message}`)
  }, [saveError])

  if (!canManageIntegrationConfig) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to manage Jira integration settings."
        />
      </div>
    )
  }

  const handleChange = <K extends keyof JiraFormState>(field: K, value: JiraFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSaveError(null)
    setValidation((current) => ({ ...current, [field]: false }))
  }

  const handleLabelsChange = (labels: string[]) => {
    handleChange('defaultLabels', serializeLabels(labels))
  }

  const addLabelChip = (rawValue: string) => {
    const nextLabels = Array.from(new Set([...labelChips, ...parseLabels(rawValue)]))
    handleLabelsChange(nextLabels)
    setLabelDraft('')
  }

  const removeLabelChip = (label: string) => {
    handleLabelsChange(labelChips.filter((item) => item !== label))
  }

  const handleSave = () => {
    const nextValidation = {
      baseUrl: !form.baseUrl.trim(),
      projectKey: !form.projectKey.trim(),
    }
    setValidation(nextValidation)

    if (nextValidation.baseUrl || nextValidation.projectKey) {
      setSaveError(new Error('Base URL and project key are required.'))
      return
    }

    const payload: JiraConfigRequest = {
      enabled: form.enabled,
      baseUrl: form.baseUrl.trim(),
      authType: form.authType.trim() || null,
      username: form.username.trim() || null,
      apiToken: form.apiToken.trim() || null,
      projectKey: form.projectKey.trim(),
      issueType: form.issueType.trim() || null,
      defaultLabels: form.defaultLabels.trim() || null,
      appBaseUrl: form.appBaseUrl.trim() || null,
    }

    saveMutation.mutate(payload, {
      onSuccess: () => {
        setSaveError(null)
      },
      onError: (error) => {
        setSaveError(error)
      },
    })
  }

  const handleTest = () => {
    setTestFeedback(null)

    if (!isExistingConfig) {
      const nextValidation = {
        baseUrl: !form.baseUrl.trim(),
        projectKey: !form.projectKey.trim(),
      }
      setValidation(nextValidation)
      setTestFeedback({ success: false, message: 'Save the Jira configuration before testing the connection. The test endpoint currently checks the saved configuration.' })
      return
    }

    testMutation.mutate(undefined, {
      onSuccess: (result) => setTestFeedback(result),
      onError: (error) => {
        setTestFeedback({ success: false, message: getErrorMessage(error, 'Jira connection test failed.') })
      },
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jira Integration</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure the Jira connection CaseFlow uses to create linked issues from tickets, with clear status, safer credentials handling, and guided setup.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} size="md">{status.label}</Badge>
        </div>
      </div>

      {configQuery.isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <table className="w-full"><tbody><SkeletonRow colCount={2} /><SkeletonRow colCount={2} /><SkeletonRow colCount={2} /></tbody></table>
        </div>
      ) : configQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(configQuery.error, 'Failed to load Jira integration settings.')}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-gray-900">Main configuration</h2>
                <p className="text-sm text-gray-500">Enter the Jira workspace and issue defaults used when CaseFlow creates linked issues for tickets.</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 lg:max-w-sm">
                <div className="flex items-start gap-2">
                  <RefreshCw size={16} className="mt-0.5 shrink-0" />
                  <div>
                    Ticket-side Jira creation is asynchronous. The ticket detail UI shows queued, processing, success, and failure states from the backend job status endpoint.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-medium">Base URL</span>
                <span className="block text-xs text-gray-500">Your Jira workspace URL, for example https://company.atlassian.net.</span>
                <input
                  value={form.baseUrl}
                  onChange={(event) => handleChange('baseUrl', event.target.value)}
                  placeholder="https://jira.example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {validation.baseUrl ? <span className="text-xs text-red-600">Base URL is required.</span> : null}
                {getViolation(saveError, 'baseUrl') ? <span className="text-xs text-red-600">{getViolation(saveError, 'baseUrl')}</span> : null}
              </label>

              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-medium">Authentication</span>
                <span className="block text-xs text-gray-500">Jira currently uses Basic authentication for this integration.</span>
                <input
                  value={form.authType || 'BASIC'}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-medium">Username</span>
                <span className="block text-xs text-gray-500">Usually the Jira account email used to generate the API token.</span>
                <input
                  value={form.username}
                  onChange={(event) => handleChange('username', event.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </label>

              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-medium">API Token</span>
                <span className="block text-xs text-gray-500">Leave blank to keep the current token. Enter a value only when rotating credentials.</span>
                <input
                  type="password"
                  value={form.apiToken}
                  onChange={(event) => handleChange('apiToken', event.target.value)}
                  placeholder={hasSavedToken ? 'Leave blank to keep the current token' : 'Enter Jira API token'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-xs text-gray-500">
                  {hasSavedToken ? 'A token is already stored securely. Leaving this blank preserves it.' : 'A blank value saves as no token until one is provided.'}
                </span>
              </label>

              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-medium">Project Key</span>
                <span className="block text-xs text-gray-500">The Jira project key where new issues should be created, for example SUPPORT.</span>
                <input
                  value={form.projectKey}
                  onChange={(event) => handleChange('projectKey', event.target.value.toUpperCase())}
                  placeholder="TEST"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {validation.projectKey ? <span className="text-xs text-red-600">Project key is required.</span> : null}
                {getViolation(saveError, 'projectKey') ? <span className="text-xs text-red-600">{getViolation(saveError, 'projectKey')}</span> : null}
              </label>

              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-medium">Issue Type</span>
                <span className="block text-xs text-gray-500">Enter the Jira issue type name exactly as it exists in the target project. Common values are Task, Bug, and Story.</span>
                <input
                  list="jira-issue-types"
                  value={form.issueType}
                  onChange={(event) => handleChange('issueType', event.target.value)}
                  placeholder="Task"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <datalist id="jira-issue-types">
                  {ISSUE_TYPE_SUGGESTIONS.map((issueType) => <option key={issueType} value={issueType} />)}
                </datalist>
              </label>

              <div className="space-y-2 text-sm text-gray-700 md:col-span-2">
                <div className="space-y-1">
                  <span className="font-medium">Default Labels</span>
                  <p className="text-xs text-gray-500">Add labels that should be applied to every Jira issue created from CaseFlow. Labels are still saved as the existing comma-separated backend string.</p>
                </div>

                <div className="rounded-lg border border-gray-300 px-3 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400">
                  {labelChips.length > 0 ? (
                    <div className="mb-2 flex flex-wrap gap-2" aria-label="Default label list">
                      {labelChips.map((label) => (
                        <span key={label} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
                          {label}
                          <button
                            type="button"
                            aria-label={`Remove ${label}`}
                            onClick={() => removeLabelChip(label)}
                            className="text-blue-500 transition-colors hover:text-blue-700"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-2 text-xs text-gray-400">No default labels added yet.</p>
                  )}

                  <input
                    value={labelDraft}
                    onChange={(event) => setLabelDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.key === 'Enter' || event.key === ',') && labelDraft.trim()) {
                        event.preventDefault()
                        addLabelChip(labelDraft)
                      }

                      if (event.key === 'Backspace' && !labelDraft && labelChips.length > 0) {
                        event.preventDefault()
                        removeLabelChip(labelChips[labelChips.length - 1])
                      }
                    }}
                    onBlur={() => {
                      if (labelDraft.trim()) addLabelChip(labelDraft)
                    }}
                    placeholder="Type a label and press Enter"
                    className="w-full border-0 p-0 text-sm focus:outline-none focus:ring-0"
                  />
                </div>
                <p className="text-xs text-gray-500">You can paste comma-separated values and they will be normalized into individual labels.</p>
              </div>

              <label className="space-y-1 text-sm text-gray-700 md:col-span-2">
                <span className="font-medium">CaseFlow App Base URL</span>
                <span className="block text-xs text-gray-500">Used when Jira issue links point back into CaseFlow ticket pages. Set this to the URL users open in their browser.</span>
                <input
                  value={form.appBaseUrl}
                  onChange={(event) => handleChange('appBaseUrl', event.target.value)}
                  placeholder="https://app.example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900">Configuration behavior</h2>
              <p className="text-sm text-gray-500">Control whether ticket workflows can create Jira issues and verify the saved connection.</p>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) => handleChange('enabled', event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
              />
              <div>
                <div className="font-medium text-gray-900">Enable Jira issue creation for tickets</div>
                <div className="mt-1 text-xs text-gray-500">When enabled, ticket detail views can request Jira issue creation using this saved configuration.</div>
              </div>
            </label>

            {saveErrorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div>{saveErrorMessage}</div>
                {violationSummary.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-xs">
                    {violationSummary.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {saveMutation.isSuccess ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Jira integration settings saved successfully.
              </div>
            ) : null}

            {testFeedback ? (
              <div className={`rounded-lg px-4 py-3 text-sm ${testFeedback.success ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-red-200 bg-red-50 text-red-700'}`}>
                {testFeedback.message}
              </div>
            ) : null}

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                {isDirty ? <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" /> : <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />}
                <div>
                  <div className="font-medium text-gray-900">Connection testing uses the saved configuration</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {isDirty
                      ? 'You have unsaved changes. Save configuration first if you want the test to reflect the values currently shown in the form.'
                      : 'The backend test endpoint checks the last saved Jira settings, not transient form edits.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <div className="text-xs text-gray-500">
                {configQuery.data?.updatedAt ? `Last updated ${new Date(configQuery.data.updatedAt).toLocaleString()}` : 'No Jira configuration has been saved yet.'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTest}
                  isLoading={testMutation.isPending}
                  disabled={saveMutation.isPending}
                  leftIcon={<CheckCircle2 size={14} />}
                >
                  {testMutation.isPending ? 'Testing Connection...' : 'Test Connection'}
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} isLoading={saveMutation.isPending} leftIcon={<PlugZap size={14} />}>
                  {saveMutation.isPending ? 'Saving Configuration...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}