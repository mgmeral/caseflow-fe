import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ApiError } from '@/services/api.client'

const updateProfileMutateAsync = vi.hoisted(() => vi.fn())
const changePasswordMutateAsync = vi.hoisted(() => vi.fn())
const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())

const profileState = vi.hoisted(() => ({
  data: {
    id: 'u1',
    username: 'mgmer',
    email: 'mgmer@test.com',
    displayName: 'Mehmet Gokhan',
    firstName: 'Mehmet',
    lastName: 'Gokhan',
    fullName: 'Mehmet Gokhan',
    roles: [{ id: 'r1', code: 'AGENT', name: 'Agent' }],
    groups: [{ id: 'g1', name: 'Support' }],
    isActive: true,
    locale: 'tr' as const,
    avatarUrl: null,
    permissionCodes: ['REPORT_VIEW'],
    roleCode: 'AGENT',
    roleName: 'Agent',
    roleId: 'r1',
    groupIds: ['g1'],
    groupNames: ['Support'],
  },
  isLoading: false,
  isError: false,
  error: null as Error | null,
}))

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => profileState,
  useUpdateProfile: () => ({ mutateAsync: updateProfileMutateAsync, isPending: false }),
  useChangePassword: () => ({ mutateAsync: changePasswordMutateAsync, isPending: false }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}))

const { ProfilePage } = await import('@/pages/ProfilePage')

describe('ProfilePage', () => {
  beforeEach(() => {
    updateProfileMutateAsync.mockReset()
    changePasswordMutateAsync.mockReset()
    mockSuccess.mockReset()
    mockError.mockReset()
    updateProfileMutateAsync.mockResolvedValue(undefined)
    changePasswordMutateAsync.mockResolvedValue(undefined)
  })

  it('renders user profile information', () => {
    render(<ProfilePage />)

    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByDisplayValue('mgmer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('mgmer@test.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Mehmet Gokhan')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Active')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Agent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Support')).toBeInTheDocument()
  })

  it('updates display name and locale through separate save actions', async () => {
    render(<ProfilePage />)

    fireEvent.change(screen.getByDisplayValue('Mehmet Gokhan'), { target: { value: 'Mehmet G. Mer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }))

    await waitFor(() => {
      expect(updateProfileMutateAsync).toHaveBeenCalledWith({
        displayName: 'Mehmet G. Mer',
        firstName: 'Mehmet',
        lastName: 'Gokhan',
      })
    })

    fireEvent.change(screen.getByLabelText('Locale'), { target: { value: 'en' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Preferences' }))

    await waitFor(() => {
      expect(updateProfileMutateAsync).toHaveBeenLastCalledWith({ locale: 'en' })
    })
  })

  it('validates password confirmation mismatch', async () => {
    render(<ProfilePage />)

    const passwordInputs = screen.getAllByLabelText(/password/i)
    fireEvent.change(passwordInputs[0], { target: { value: 'Current123' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'NewPass123' } })
    fireEvent.change(passwordInputs[2], { target: { value: 'Mismatch123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(screen.getByText('Confirm password must match the new password.')).toBeInTheDocument()
    })
    expect(changePasswordMutateAsync).not.toHaveBeenCalled()
  })

  it('shows user-friendly backend password errors', async () => {
    changePasswordMutateAsync.mockRejectedValueOnce(new ApiError(400, 'CURRENT_PASSWORD_INVALID', 'Current password wrong'))

    render(<ProfilePage />)

    const passwordInputs = screen.getAllByLabelText(/password/i)
    fireEvent.change(passwordInputs[0], { target: { value: 'Current123' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'NewPass123' } })
    fireEvent.change(passwordInputs[2], { target: { value: 'NewPass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect.')).toBeInTheDocument()
    })
  })
})