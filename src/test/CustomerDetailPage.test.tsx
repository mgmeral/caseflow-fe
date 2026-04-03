import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())

const mockUpsertSettings = vi.hoisted(() => vi.fn())
const mockCreateRule = vi.hoisted(() => vi.fn())
const mockUpdateRule = vi.hoisted(() => vi.fn())
const mockDeactivateRule = vi.hoisted(() => vi.fn())
const mockDeleteRule = vi.hoisted(() => vi.fn())

const detailState = vi.hoisted(() => ({
  customer: {
    id: 'c1',
    name: 'Akbank',
    code: 'AKBANK',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
  tickets: [
    {
      id: 't1',
      ticketNo: '1001',
      subject: 'Help',
      status: 'open',
      priority: 'medium',
      updatedAt: '2025-01-02T00:00:00Z',
    },
  ],
  emailSettings: {
    customerId: 'c1',
    customerName: 'Akbank',
    isEnabled: true,
    allowSubdomains: false,
    unknownSenderPolicy: 'ROUTE_TO_DEFAULT',
    defaultGroupId: 'g1',
    defaultGroupName: 'Tier 1',
    defaultPriority: 'MEDIUM',
    updatedAt: '2025-01-02T00:00:00Z',
  },
  routingRules: [
    {
      id: 'r1',
      customerId: 'c1',
      recipientMailboxId: 'm1',
      recipientMailboxName: 'Main',
      senderMatchType: 'DOMAIN_SUFFIX',
      senderMatchValue: '@akbank.com',
      priority: 10,
      isActive: true,
      notes: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
  ],
}))

vi.mock('@/hooks/useCustomers', () => ({
  useCustomerDetail: () => ({ customer: detailState.customer, isLoading: false }),
  useCustomerTickets: () => ({ tickets: detailState.tickets, isLoading: false }),
}))

vi.mock('@/hooks/useCustomerEmailSettings', () => ({
  useCustomerEmailSettings: () => ({ data: detailState.emailSettings, isLoading: false }),
  useCustomerRoutingRules: () => ({ data: detailState.routingRules, isLoading: false }),
  useUpsertCustomerEmailSettings: () => ({ mutateAsync: mockUpsertSettings }),
  useCreateCustomerRoutingRule: () => ({ mutateAsync: mockCreateRule }),
  useUpdateCustomerRoutingRule: () => ({ mutateAsync: mockUpdateRule }),
  useDeactivateCustomerRoutingRule: () => ({ mutateAsync: mockDeactivateRule }),
  useDeleteCustomerRoutingRule: () => ({ mutateAsync: mockDeleteRule }),
}))

vi.mock('@/hooks/useMailboxes', () => ({
  useMailboxes: () => ({
    data: { items: [{ id: 'm1', name: 'Main', emailAddress: 'support@caseflow.com' }] },
  }),
}))

vi.mock('@/hooks/useUsers', () => ({
  useGroupsQuery: () => ({ data: [{ id: 'g1', name: 'Tier 1' }, { id: 'g2', name: 'Tier 2' }] }),
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canManageEmailConfig: true,
    canViewEmailConfig: true,
  }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}))

const { CustomerDetailPage } = await import('@/pages/CustomerDetailPage')

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/customers/c1']}>
      <Routes>
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CustomerDetailPage', () => {
  beforeEach(() => {
    mockSuccess.mockReset()
    mockError.mockReset()
    mockUpsertSettings.mockReset()
    mockCreateRule.mockReset()
    mockUpdateRule.mockReset()
    mockDeactivateRule.mockReset()
    mockDeleteRule.mockReset()

    mockUpsertSettings.mockResolvedValue(undefined)
    mockCreateRule.mockResolvedValue(undefined)
    mockUpdateRule.mockResolvedValue(undefined)
    mockDeactivateRule.mockResolvedValue(undefined)
    mockDeleteRule.mockResolvedValue(undefined)
  })

  it('renders customer detail and sender patterns section', () => {
    renderPage()

    expect(screen.getByText('Akbank')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Email Settings' }))
    expect(screen.getByText('Sender Patterns & Routing Rules')).toBeInTheDocument()
    expect(screen.getByText('@akbank.com')).toBeInTheDocument()
  })

  it('supports customer email settings edit flow', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Email Settings' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.click(screen.getByRole('checkbox', { name: 'Allow Subdomains' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockUpsertSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          isEnabled: true,
          allowSubdomains: true,
          unknownSenderPolicy: 'MANUAL_REVIEW',
          defaultGroupId: 'g1',
        }),
      )
      expect(mockSuccess).toHaveBeenCalledWith('Email settings saved')
    })
  })

  it('supports sender pattern CRUD actions', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Email Settings' }))

    fireEvent.click(screen.getByRole('button', { name: 'Add Rule' }))
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: 'ops@akbank.com' } })

    const createButton = screen.getByRole('button', { name: 'Create' })
    expect(createButton).toBeEnabled()
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockCreateRule).toHaveBeenCalledWith(
        expect.objectContaining({ senderMatchValue: 'ops@akbank.com' }),
      )
    })

    fireEvent.click(screen.getByTitle('Edit'))
    fireEvent.change(screen.getByDisplayValue('@akbank.com'), { target: { value: '@info-akbank.com.tr' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockUpdateRule).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: 'r1',
          payload: expect.objectContaining({ senderMatchValue: '@info-akbank.com.tr' }),
        }),
      )
    })

    fireEvent.click(screen.getByTitle('Deactivate'))
    await waitFor(() => {
      expect(mockDeactivateRule).toHaveBeenCalledWith('r1')
    })

    fireEvent.click(screen.getByTitle('Delete'))
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    fireEvent.click(deleteButtons[deleteButtons.length - 1] as HTMLButtonElement)

    await waitFor(() => {
      expect(mockDeleteRule).toHaveBeenCalledWith('r1')
    })
  })
})
