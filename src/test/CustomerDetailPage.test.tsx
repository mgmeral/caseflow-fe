import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mockNavigate = vi.hoisted(() => vi.fn())

const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())

const mockUpsertSettings = vi.hoisted(() => vi.fn())
const mockCreateRule = vi.hoisted(() => vi.fn())
const mockUpdateRule = vi.hoisted(() => vi.fn())
const mockDeactivateRule = vi.hoisted(() => vi.fn())
const mockDeleteRule = vi.hoisted(() => vi.fn())
const mockDeleteCustomer = vi.hoisted(() => vi.fn())
const mockUpdateCustomer = vi.hoisted(() => vi.fn())
const mockActivateCustomer = vi.hoisted(() => vi.fn())
const mockDeactivateCustomer = vi.hoisted(() => vi.fn())
const useCustomerReportSpy = vi.hoisted(() => vi.fn())
const exportCustomerReportPdf = vi.hoisted(() => vi.fn())

const reportState = vi.hoisted(() => ({
  data: {
    totalCount: 12,
    openCount: 5,
    closedCount: 3,
    resolvedCount: 4,
    newCount: 2,
    inProgressCount: 2,
    waitingCustomerCount: 1,
    reopenedCount: 0,
    byTag: [
      { tagId: 'vip', tagCode: 'VIP', tagName: 'VIP', tagColor: '#ef4444', count: 3 },
    ],
  },
  isLoading: false,
  isError: false,
  error: null as Error | null,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const detailState = vi.hoisted(() => ({
  customer: {
    id: 'c1',
    name: 'Akbank',
    code: 'AKBANK',
    isActive: true,
    colorHex: '#0d5ac9',
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
      allowSubdomains: true,
      notes: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
  ],
}))

vi.mock('@/hooks/useCustomers', () => ({
  useCustomerDetail: () => ({ customer: detailState.customer, isLoading: false }),
  useCustomerTickets: () => ({ tickets: detailState.tickets, isLoading: false }),
  useUpdateCustomer: () => ({ mutateAsync: mockUpdateCustomer, isPending: false }),
  useActivateCustomer: () => ({ mutateAsync: mockActivateCustomer, isPending: false }),
  useDeactivateCustomer: () => ({ mutateAsync: mockDeactivateCustomer, isPending: false }),
  useDeleteCustomer: () => ({ mutateAsync: mockDeleteCustomer, isPending: false }),
}))

vi.mock('@/hooks/useReports', () => ({
  useCustomerReport: (customerId: string, filters: unknown) => {
    useCustomerReportSpy(customerId, filters)
    return {
      data: reportState.data,
      isLoading: reportState.isLoading,
      isError: reportState.isError,
      error: reportState.error,
    }
  },
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
    canExport: true,
  }),
}))

vi.mock('@/lib/reportPdf', () => ({
  exportCustomerReportPdf,
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
    mockDeleteCustomer.mockReset()
    mockUpdateCustomer.mockReset()
    mockActivateCustomer.mockReset()
    mockDeactivateCustomer.mockReset()
    mockNavigate.mockReset()
    useCustomerReportSpy.mockReset()

    mockUpsertSettings.mockResolvedValue(undefined)
    mockCreateRule.mockResolvedValue(undefined)
    mockUpdateRule.mockResolvedValue(undefined)
    mockDeactivateRule.mockResolvedValue(undefined)
    mockDeleteRule.mockResolvedValue(undefined)
    mockDeleteCustomer.mockResolvedValue(undefined)
    mockUpdateCustomer.mockResolvedValue(undefined)
    mockActivateCustomer.mockResolvedValue(undefined)
    mockDeactivateCustomer.mockResolvedValue(undefined)

    detailState.customer = {
      id: 'c1',
      name: 'Akbank',
      code: 'AKBANK',
      isActive: true,
      colorHex: '#0d5ac9',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    }

    detailState.emailSettings = {
      customerId: 'c1',
      customerName: 'Akbank',
      isEnabled: true,
      allowSubdomains: false,
      unknownSenderPolicy: 'MANUAL_REVIEW',
      defaultGroupId: 'g1',
      defaultGroupName: 'Tier 1',
      defaultPriority: 'MEDIUM',
      updatedAt: '2025-01-02T00:00:00Z',
    }
    detailState.routingRules = [
      {
        id: 'r1',
        customerId: 'c1',
        recipientMailboxId: 'm1',
        recipientMailboxName: 'Main',
        senderMatchType: 'DOMAIN_SUFFIX',
        senderMatchValue: '@akbank.com',
        priority: 10,
        isActive: true,
        allowSubdomains: true,
        notes: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
    ]
    reportState.data = {
      totalCount: 12,
      openCount: 5,
      closedCount: 3,
      resolvedCount: 4,
      newCount: 2,
      inProgressCount: 2,
      waitingCustomerCount: 1,
      reopenedCount: 0,
      byTag: [
        { tagId: 'vip', tagCode: 'VIP', tagName: 'VIP', tagColor: '#ef4444', count: 3 },
      ],
    }
    reportState.isLoading = false
    reportState.isError = false
    reportState.error = null
  })

  it('renders customer detail and sender patterns section', () => {
    renderPage()

    expect(screen.getByText('Akbank')).toBeInTheDocument()
    expect(screen.getAllByText('#0d5ac9').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Email Settings' }))
    expect(screen.getByText('Sender Patterns & Routing Rules')).toBeInTheDocument()
    expect(screen.getByText('@akbank.com')).toBeInTheDocument()
    expect(screen.getByText('Subdomains')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('includes the real customer detail tabs in the routed page flow', () => {
    renderPage()

    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Email Settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Report' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tickets' })).toBeInTheDocument()
  })

  it('supports customer edit and save flow with color updates', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByDisplayValue('Akbank'), { target: { value: 'Akbank Digital' } })
    fireEvent.change(screen.getByDisplayValue('AKBANK'), { target: { value: 'akb-dijital' } })
    fireEvent.change(screen.getByLabelText('Custom Hex'), { target: { value: '#475569' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockUpdateCustomer).toHaveBeenCalledWith({
        id: 'c1',
        payload: { name: 'Akbank Digital', code: 'AKB-DIJITAL', colorHex: '#475569' },
      })
      expect(mockSuccess).toHaveBeenCalledWith('Customer updated')
    })
  })

  it('uses activate and deactivate endpoints from the detail header', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }))

    await waitFor(() => {
      expect(mockDeactivateCustomer).toHaveBeenCalledWith('c1')
      expect(mockSuccess).toHaveBeenCalledWith('Customer deactivated')
    })

    detailState.customer = {
      ...detailState.customer,
      isActive: false,
    }

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Activate' }))

    await waitFor(() => {
      expect(mockActivateCustomer).toHaveBeenCalledWith('c1')
      expect(mockSuccess).toHaveBeenCalledWith('Customer activated')
    })
  })

  it('shows the empty routing rule state only when the backend returned no rules', () => {
    detailState.routingRules = []

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Email Settings' }))

    expect(screen.getByText('No routing rules')).toBeInTheDocument()
    expect(screen.queryByText('@akbank.com')).not.toBeInTheDocument()
  })

  it('supports customer email settings edit flow', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Email Settings' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1])
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

  it('renders the backend customer report data on the report tab', () => {
    const { container } = renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Report' }))

    expect(screen.getByText('Customer Report')).toBeInTheDocument()
    expect(screen.getByText('Tag Breakdown')).toBeInTheDocument()
    expect(screen.getByText('VIP')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(container.querySelector('[style*="background-color: rgb(239, 68, 68)"]')).toBeTruthy()
  })

  it('refetches customer report data when the compact date filter changes', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Report' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Report date preset' }), { target: { value: 'allTime' } })

    await waitFor(() => {
      expect(screen.getByText('Showing all time. Default stays controlled, but all-time remains available when needed.')).toBeInTheDocument()
      expect(useCustomerReportSpy).toHaveBeenLastCalledWith('c1', {
        dateFrom: null,
        dateTo: null,
      })
    })
  })

  it('exports the current customer report as a pdf', async () => {
    exportCustomerReportPdf.mockResolvedValue(undefined)

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Report' }))
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))

    await waitFor(() => {
      expect(exportCustomerReportPdf).toHaveBeenCalledWith(expect.objectContaining({
        customerName: 'Akbank',
        report: expect.objectContaining({ totalCount: 12 }),
        range: expect.objectContaining({ preset: 'last30' }),
      }))
    })
  })

  it('shows a loading state while the customer report is fetching', () => {
    reportState.isLoading = true

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Report' }))

    expect(screen.getAllByText('...')).toHaveLength(4)
  })

  it('shows an empty state when the customer report is valid but contains no counts', () => {
    reportState.data = {
      totalCount: 0,
      openCount: 0,
      closedCount: 0,
      resolvedCount: 0,
      newCount: 0,
      inProgressCount: 0,
      waitingCustomerCount: 0,
      reopenedCount: 0,
      byTag: [],
    }

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Report' }))

    expect(screen.getByText('No customer report data was returned for the selected date range.')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })

  it('shows the backend report error message instead of a stale unavailable-session fallback', () => {
    reportState.data = undefined as unknown as typeof reportState.data
    reportState.isError = true
    reportState.error = new Error('Customer report route not found')

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Report' }))

    expect(screen.getByText('Customer report route not found')).toBeInTheDocument()
    expect(screen.queryByText('Customer report is unavailable for this session.')).not.toBeInTheDocument()
  })

  it('deletes the customer and navigates back to the customer list', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Customer' }))
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Customer' })
    fireEvent.click(deleteButtons[deleteButtons.length - 1] as HTMLButtonElement)

    await waitFor(() => {
      expect(mockDeleteCustomer).toHaveBeenCalledWith('c1')
      expect(mockSuccess).toHaveBeenCalledWith('Customer deleted')
      expect(mockNavigate).toHaveBeenCalledWith('/customers')
    })
  })

  it('surfaces backend delete errors when customer deletion is blocked', async () => {
    mockDeleteCustomer.mockRejectedValueOnce(new Error('Customer cannot be deleted because tickets still exist.'))

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Customer' }))
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Customer' })
    fireEvent.click(deleteButtons[deleteButtons.length - 1] as HTMLButtonElement)

    await waitFor(() => {
      expect(mockDeleteCustomer).toHaveBeenCalledWith('c1')
      expect(mockError).toHaveBeenCalledWith('Customer cannot be deleted because tickets still exist.')
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
