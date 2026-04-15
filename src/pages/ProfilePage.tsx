import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Globe2, KeyRound, Mail, UserRound } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/shared/Button'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useChangePassword, useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { ApiError } from '@/services/api.client'
import type { UserLocale } from '@/types/user.types'

interface ProfileFormState {
  displayName: string
  firstName: string
  lastName: string
}

interface PreferencesFormState {
  locale: UserLocale
}

interface PasswordFormState {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const EMPTY_PASSWORD_FORM: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function normalizeText(value: string) {
  return value.trim()
}

function hasWhitespace(value: string) {
  return /\s/.test(value)
}

function getPasswordErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code.toUpperCase()) {
      case 'CURRENT_PASSWORD_INVALID':
        return 'Current password is incorrect.'
      case 'NEW_PASSWORD_POLICY_VIOLATION':
        return 'New password does not meet the password policy requirements.'
      case 'NEW_PASSWORD_SAME_AS_OLD':
        return 'New password must be different from the current password.'
      default:
        return getErrorMessage(error, 'Password could not be updated.')
    }
  }

  return getErrorMessage(error, 'Password could not be updated.')
}

export function ProfilePage() {
  const { success, error: showError } = useToast()
  const profileQuery = useProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const profile = profileQuery.data

  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null)
  const [preferencesForm, setPreferencesForm] = useState<PreferencesFormState | null>(null)
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(EMPTY_PASSWORD_FORM)
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null)
  const [preferencesFeedback, setPreferencesFeedback] = useState<string | null>(null)
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return

    setProfileForm({
      displayName: profile.displayName,
      firstName: profile.firstName,
      lastName: profile.lastName,
    })
    setPreferencesForm({ locale: profile.locale })
  }, [profile])

  const isProfileDirty = Boolean(
    profile
    && profileForm
    && (
      normalizeText(profileForm.displayName) !== normalizeText(profile.displayName)
      || normalizeText(profileForm.firstName) !== normalizeText(profile.firstName)
      || normalizeText(profileForm.lastName) !== normalizeText(profile.lastName)
    ),
  )

  const isPreferencesDirty = Boolean(
    profile
    && preferencesForm
    && preferencesForm.locale !== profile.locale,
  )

  const passwordValidationMessage = useMemo(() => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) return null
    if (hasWhitespace(passwordForm.currentPassword) || hasWhitespace(passwordForm.newPassword) || hasWhitespace(passwordForm.confirmPassword)) {
      return 'Passwords cannot contain spaces.'
    }
    if (passwordForm.newPassword.length < 8) {
      return 'New password must be at least 8 characters.'
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return 'Confirm password must match the new password.'
    }
    return null
  }, [passwordForm])

  if (profileQuery.isLoading || !profileForm || !preferencesForm) {
    return (
      <div className="page-shell">
        <div className="surface-card p-6">
          <table className="w-full">
            <tbody>
              <SkeletonRow colCount={3} />
              <SkeletonRow colCount={3} />
              <SkeletonRow colCount={3} />
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="page-shell">
        <EmptyState
          icon={<UserRound className="h-8 w-8 text-gray-400" />}
          title="Profile unavailable"
          description={getErrorMessage(profileQuery.error, 'Your profile could not be loaded.')}
        />
      </div>
    )
  }

  const handleSaveProfile = async () => {
    setProfileFeedback(null)

    try {
      await updateProfile.mutateAsync({
        displayName: normalizeText(profileForm.displayName),
        firstName: normalizeText(profileForm.firstName),
        lastName: normalizeText(profileForm.lastName),
      })
      setProfileFeedback('Profile details saved.')
      success('Profile details saved.')
    } catch (saveError) {
      const message = getErrorMessage(saveError, 'Profile details could not be saved.')
      setProfileFeedback(message)
      showError(message)
    }
  }

  const handleSavePreferences = async () => {
    setPreferencesFeedback(null)

    try {
      await updateProfile.mutateAsync({ locale: preferencesForm.locale })
      setPreferencesFeedback('Preferences saved.')
      success('Preferences saved.')
    } catch (saveError) {
      const message = getErrorMessage(saveError, 'Preferences could not be saved.')
      setPreferencesFeedback(message)
      showError(message)
    }
  }

  const handleChangePassword = async () => {
    setPasswordFeedback(null)
    setPasswordError(null)

    if (passwordValidationMessage) {
      setPasswordError(passwordValidationMessage)
      return
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setPasswordFeedback('Password updated successfully.')
      success('Password updated successfully.')
    } catch (saveError) {
      const message = getPasswordErrorMessage(saveError)
      setPasswordError(message)
      showError(message)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Review identity details, manage password, and keep personal product preferences aligned with your account.</p>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="h-16 w-16 rounded-full border border-white/80 object-cover shadow-soft" />
            ) : (
              <Avatar name={profile.displayName || profile.fullName} color="#1258e3" size="lg" className="h-16 w-16 text-lg shadow-soft" />
            )}
            <div className="min-w-0">
              <div className="text-lg font-semibold text-slate-950">{profile.displayName || profile.fullName}</div>
              <div className="mt-1 text-sm text-slate-500">{profile.email}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">{profile.isActive ? 'Active' : 'Inactive'}</span>
                {profile.roles.slice(0, 2).map((role) => (
                  <span key={role.id} className="rounded-full border border-[#d5e2ff] bg-[#eef5ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1258e3]">{role.name}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 md:text-right">
            <div><span className="font-medium text-slate-900">Username:</span> {profile.username}</div>
            <div><span className="font-medium text-slate-900">Locale:</span> {preferencesForm.locale === 'tr' ? 'Turkce' : 'English'}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <div className="space-y-6">
          <section className="surface-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Profile Info</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Username">
                <input value={profile.username} readOnly className="ui-input" />
              </Field>
              <Field label="Email">
                <input value={profile.email} readOnly className="ui-input" />
              </Field>
              <Field label="Display Name">
                <input
                  value={profileForm.displayName}
                  onChange={(event) => setProfileForm((current) => current ? { ...current, displayName: event.target.value } : current)}
                  className="ui-input"
                />
              </Field>
              <Field label="First Name">
                <input
                  value={profileForm.firstName}
                  onChange={(event) => setProfileForm((current) => current ? { ...current, firstName: event.target.value } : current)}
                  className="ui-input"
                />
              </Field>
              <Field label="Last Name">
                <input
                  value={profileForm.lastName}
                  onChange={(event) => setProfileForm((current) => current ? { ...current, lastName: event.target.value } : current)}
                  className="ui-input"
                />
              </Field>
              <Field label="Status">
                <input value={profile.isActive ? 'Active' : 'Inactive'} readOnly className="ui-input" />
              </Field>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-white/60 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-500">
                {isProfileDirty ? 'You have unsaved profile changes.' : 'Profile details are up to date.'}
                {profileFeedback ? <span className="ml-2 text-slate-700">{profileFeedback}</span> : null}
              </div>
              <Button variant="primary" size="sm" onClick={handleSaveProfile} disabled={!isProfileDirty} isLoading={updateProfile.isPending}>
                Save Profile
              </Button>
            </div>
          </section>

          <section className="surface-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Change Password</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Current Password">
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  className="ui-input"
                />
              </Field>
              <Field label="New Password">
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  className="ui-input"
                />
              </Field>
              <Field label="Confirm Password">
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="ui-input"
                />
              </Field>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-white/60 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-500">
                {passwordError ? <span className="text-red-700">{passwordError}</span> : passwordFeedback ? <span className="text-slate-700">{passwordFeedback}</span> : 'Use a new password that meets policy and differs from your current password.'}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleChangePassword}
                isLoading={changePassword.isPending}
                disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              >
                Update Password
              </Button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Preferences</h2>
            </div>

            <Field label="Locale">
              <select
                value={preferencesForm.locale}
                onChange={(event) => setPreferencesForm({ locale: event.target.value as UserLocale })}
                className="ui-select"
              >
                <option value="tr">Turkce</option>
                <option value="en">English</option>
              </select>
            </Field>

            <p className="mt-3 text-sm text-slate-500">This preference is stored on your user profile now and can be used by broader product localization later.</p>

            <div className="mt-5 flex flex-col gap-3 border-t border-white/60 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-500">{preferencesFeedback ?? (isPreferencesDirty ? 'Locale preference has changed.' : 'Locale preference is up to date.')}</div>
              <Button variant="primary" size="sm" onClick={handleSavePreferences} disabled={!isPreferencesDirty} isLoading={updateProfile.isPending}>
                Save Preferences
              </Button>
            </div>
          </section>

          <section className="surface-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Access Summary</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <SummaryRow label="Primary role" value={profile.roles[0]?.name ?? '—'} />
              <SummaryRow label="Group membership" value={String(profile.groups.length)} />
              <SummaryRow label="Readonly email" value={profile.email} />
              <SummaryRow label="Product locale" value={preferencesForm.locale === 'tr' ? 'Turkce' : 'English'} />
            </div>
            <p className="mt-3 text-sm text-slate-500">Access information stays read-only here and remains managed from the admin side.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="ui-label normal-case tracking-[0.04em]">{label}</span>
      {children}
    </label>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-info-row">
      <span className="ui-info-row-label">{label}</span>
      <span className="ui-info-row-value">{value}</span>
    </div>
  )
}