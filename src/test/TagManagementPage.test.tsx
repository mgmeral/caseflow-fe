import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())
const createMutate = vi.hoisted(() => vi.fn())
const updateMutate = vi.hoisted(() => vi.fn())
const activateMutate = vi.hoisted(() => vi.fn())
const deactivateMutate = vi.hoisted(() => vi.fn())

const tagsState = vi.hoisted(() => ({
  data: [
    { id: '1', code: 'VIP', name: 'VIP', color: '#ef4444', isActive: true },
    { id: '2', code: 'ARCHIVE', name: 'Archive', color: null, isActive: false },
  ],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canManageAdminConfig: true }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}))

vi.mock('@/hooks/useTags', () => ({
  useAllTags: () => tagsState,
  useCreateTag: () => ({ mutate: createMutate, isPending: false }),
  useUpdateTag: () => ({ mutate: updateMutate, isPending: false }),
  useActivateTag: () => ({ mutate: activateMutate, isPending: false }),
  useDeactivateTag: () => ({ mutate: deactivateMutate, isPending: false }),
}))

const { TagManagementPage } = await import('@/pages/admin/TagManagementPage')

describe('TagManagementPage', () => {
  beforeEach(() => {
    mockSuccess.mockReset()
    mockError.mockReset()
    createMutate.mockReset()
    updateMutate.mockReset()
    activateMutate.mockReset()
    deactivateMutate.mockReset()
    tagsState.data = [
      { id: '1', code: 'VIP', name: 'VIP', color: '#ef4444', isActive: true },
      { id: '2', code: 'ARCHIVE', name: 'Archive', color: null, isActive: false },
    ]
    tagsState.isLoading = false
    tagsState.isError = false
    tagsState.refetch.mockReset()
  })

  it('loads and renders all tags including inactive entries', () => {
    render(<TagManagementPage />)

    expect(screen.getByText('ARCHIVE')).toBeInTheDocument()
    expect(screen.getByText('#ef4444')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('renders loading and error states', () => {
    tagsState.isLoading = true
    const { rerender } = render(<TagManagementPage />)

    expect(screen.queryByText('ARCHIVE')).not.toBeInTheDocument()

    tagsState.isLoading = false
    tagsState.isError = true
    rerender(<TagManagementPage />)

    expect(screen.getByText('Tags could not be loaded')).toBeInTheDocument()
  })

  it('creates a tag from the modal form', () => {
    render(<TagManagementPage />)

    fireEvent.click(screen.getByRole('button', { name: 'New Tag' }))
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'ESC' } })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Escalated' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Select color #f59e0b' }))

    expect(screen.getByText('Selected preset: #f59e0b')).toBeInTheDocument()
    expect(screen.getByText('Escalated')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(createMutate).toHaveBeenCalledWith(
      { code: 'ESC', name: 'Escalated', color: '#f59e0b', isActive: true },
      expect.any(Object),
    )
  })

  it('edits a tag without allowing code edits', () => {
    render(<TagManagementPage />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    const codeInput = screen.getByLabelText('Code') as HTMLInputElement
    expect(codeInput.disabled).toBe(true)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'VIP Customer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateMutate).toHaveBeenCalledWith(
      {
        tagId: '1',
        payload: { code: 'VIP', name: 'VIP Customer', color: '#ef4444', isActive: true },
      },
      expect.any(Object),
    )
  })

  it('supports custom hex color input as an advanced option', () => {
    render(<TagManagementPage />)

    fireEvent.click(screen.getByRole('button', { name: 'New Tag' }))
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'BILLING' } })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Billing' } })
    fireEvent.click(screen.getByRole('button', { name: 'Use custom color' }))
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#123abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(createMutate).toHaveBeenCalledWith(
      { code: 'BILLING', name: 'Billing', color: '#123abc', isActive: true },
      expect.any(Object),
    )
  })

  it('activates and deactivates tags', () => {
    render(<TagManagementPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Activate' }))

    expect(deactivateMutate).toHaveBeenCalledWith('1', expect.any(Object))
    expect(activateMutate).toHaveBeenCalledWith('2', expect.any(Object))
  })
})