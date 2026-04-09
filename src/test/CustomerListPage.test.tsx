import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.hoisted(() => vi.fn())
const mockCreateCustomer = vi.hoisted(() => vi.fn())
const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())
const mockUseCustomers = vi.hoisted(() => vi.fn())

const customersState = vi.hoisted(() => ({
  customers: [] as Array<{ id: string; name: string; code: string; isActive: boolean; colorHex: string | null }>,
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

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: (search = '', isActive?: boolean) => {
    mockUseCustomers(search, isActive)
    const normalizedQuery = search.trim().toLowerCase()
    const customers = customersState.customers.filter((customer) => {
      const matchesSearch = !normalizedQuery
        || customer.name.toLowerCase().includes(normalizedQuery)
        || customer.code.toLowerCase().includes(normalizedQuery)
      const matchesStatus = typeof isActive !== 'boolean' || customer.isActive === isActive
      return matchesSearch && matchesStatus
    })

    return {
      customers,
      isLoading: customersState.isLoading,
      isError: customersState.isError,
      error: customersState.error,
    }
  },
  useCreateCustomer: () => ({
    mutateAsync: mockCreateCustomer,
    isPending: false,
  }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}))

const { CustomerListPage } = await import('@/pages/CustomerListPage')

describe('CustomerListPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockCreateCustomer.mockReset()
    mockSuccess.mockReset()
    mockError.mockReset()
    mockUseCustomers.mockReset()
    customersState.customers = []
    customersState.isLoading = false
    customersState.isError = false
    customersState.error = null
  })

  it('renders customer rows with explicit Manage action', () => {
    customersState.customers = [
      { id: '1', name: 'Akbank', code: 'AKBANK', isActive: true, colorHex: '#0d5ac9' },
      { id: '2', name: 'Yapi Kredi', code: 'YK', isActive: false, colorHex: null },
    ]

    render(
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Akbank')).toBeInTheDocument()
    expect(screen.getByText('Yapi Kredi')).toBeInTheDocument()
    expect(screen.getByText('#0d5ac9')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Manage' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows actionable empty state CTA for creating customer', () => {
    render(
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('No customers found')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Create Customer' })[0])
    expect(screen.getByPlaceholderText('e.g. Akbank')).toBeInTheDocument()
  })

  it('creates customer and navigates to detail page', async () => {
    mockCreateCustomer.mockResolvedValueOnce({ id: '99' })

    render(
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Create Customer' })[0])
    fireEvent.change(screen.getByPlaceholderText('e.g. Akbank'), { target: { value: 'Akbank' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. AKBANK'), { target: { value: 'akbank' } })
    fireEvent.change(screen.getByLabelText('Custom Hex'), { target: { value: '#0d5ac9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(mockCreateCustomer).toHaveBeenCalledWith({ name: 'Akbank', code: 'AKBANK', colorHex: '#0d5ac9' })
      expect(mockSuccess).toHaveBeenCalledWith('Customer created')
      expect(mockNavigate).toHaveBeenCalledWith('/customers/99')
    })
  })

  it('uses backend status filtering without local fallback conflicts', async () => {
    customersState.customers = [
      { id: '1', name: 'Akbank', code: 'AKBANK', isActive: true, colorHex: null },
      { id: '2', name: 'Akbank Legacy', code: 'AKB-OLD', isActive: false, colorHex: '#475569' },
      { id: '3', name: 'Garanti', code: 'GARANTI', isActive: true, colorHex: null },
    ]

    render(
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Search by name or code...'), { target: { value: 'akb' } })
    fireEvent.change(screen.getByDisplayValue('All status'), { target: { value: 'inactive' } })

    await waitFor(() => {
      expect(mockUseCustomers).toHaveBeenLastCalledWith('akb', false)
      expect(screen.getByText('Akbank Legacy')).toBeInTheDocument()
      expect(screen.queryByText('Akbank')).not.toBeInTheDocument()
      expect(screen.queryByText('Garanti')).not.toBeInTheDocument()
    })
  })

  it('blocks invalid custom hex values during create', () => {
    render(
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Create Customer' })[0])
    fireEvent.change(screen.getByPlaceholderText('e.g. Akbank'), { target: { value: 'Akbank' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. AKBANK'), { target: { value: 'AKBANK' } })
    fireEvent.change(screen.getByLabelText('Custom Hex'), { target: { value: '#xyzxyz' } })

    expect(screen.getByText('Enter a valid hex color like #0d5ac9.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })
})
