import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const permissionsState = vi.hoisted(() => ({
  canViewEmailConfig: true,
  canManageEmailConfig: true,
}))

const templatesState = vi.hoisted(() => ({
  data: [
    {
      id: '1',
      name: 'Acknowledgement Reply',
      code: 'ACK_REPLY',
      usageType: 'TICKET_REPLY',
      subjectTemplate: 'We received your request',
      htmlTemplate: '<p>Hello {{customer.name}}</p>',
      plainTextTemplate: 'Hello {{customer.name}}',
      isActive: true,
      isBuiltIn: false,
      canEdit: true,
      canDelete: true,
      createdAt: null,
      updatedAt: '2026-04-10T09:00:00Z',
    },
  ],
  isLoading: false,
  isError: false,
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => permissionsState,
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

vi.mock('@/hooks/useTemplates', () => ({
  useTemplates: () => templatesState,
  useCreateTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTemplatePreview: () => ({ data: null, isLoading: false, isError: false }),
}))

const { TemplateManagementPage } = await import('@/pages/admin/TemplateManagementPage')

describe('TemplateManagementPage', () => {
  beforeEach(() => {
    permissionsState.canViewEmailConfig = true
    permissionsState.canManageEmailConfig = true
  })

  it('uses email permissions instead of user management to allow access', () => {
    permissionsState.canViewEmailConfig = true
    permissionsState.canManageEmailConfig = false

    render(<TemplateManagementPage />)

    expect(screen.getByText('Template Management')).toBeInTheDocument()
    expect(screen.getByText(/Read-only mode/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yeni Şablon' })).toBeDisabled()
  })

  it('denies access when email template permissions are missing', () => {
    permissionsState.canViewEmailConfig = false
    permissionsState.canManageEmailConfig = false

    render(<TemplateManagementPage />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Acknowledgement Reply')).not.toBeInTheDocument()
  })

  it('searches templates by name and shows usage type', () => {
    render(<TemplateManagementPage />)

    expect(screen.getByText('TICKET_REPLY')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Şablon adı, kodu veya konuya göre ara…'), {
      target: { value: 'acknowledgement' },
    })

    expect(screen.getByText('Acknowledgement Reply')).toBeInTheDocument()
  })

  it('renders help intro, opens faq drawer, and shows template field hints', () => {
    render(<TemplateManagementPage />)

    expect(screen.getByText(/Mail templates provide reusable outbound content/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Help' }))
    expect(screen.getByText('Is HTML required?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yeni Şablon' }))

    expect(screen.getByText(/Stable identifier for backend mapping/i)).toBeInTheDocument()
    expect(screen.getByText(/Fallback for clients or flows that downgrade HTML/i)).toBeInTheDocument()
  })
})