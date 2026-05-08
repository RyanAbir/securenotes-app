import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

import AppState from '../components/AppState'
import { API_URL } from '../config/api'
import {
  clearAuthSession,
  getStoredToken,
  updateStoredAuthUser,
} from '../utils/auth'

const strongPasswordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

function Profile() {
  const token = getStoredToken()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const loadProfile = async () => {
    if (!token) {
      return
    }

    setLoading(true)
    setProfileError('')

    try {
      const response = await fetch(`${API_URL}/api/account/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load profile')
      }

      setProfile(data.data)
      setName(data.data.name || '')
      setEmail(data.data.email || '')
    } catch (error) {
      setProfileError(error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [token])

  const handleProfileUpdate = async (event) => {
    event.preventDefault()

    if (isSavingProfile) {
      return
    }

    setIsSavingProfile(true)

    try {
      const response = await fetch(`${API_URL}/api/account/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile')
      }

      setProfile((currentProfile) => ({
        ...currentProfile,
        ...data.data,
      }))
      setName(data.data.name || '')
      setEmail(data.data.email || '')
      updateStoredAuthUser({
        name: data.data.name || '',
        email: data.data.email || '',
      })
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()

    if (isChangingPassword) {
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (!strongPasswordRule.test(newPassword)) {
      toast.error('Use at least 8 characters with uppercase, lowercase, and a number')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch(`${API_URL}/api/account/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password')
      }

      clearAuthSession()
      toast.success('Password updated. Please log in again.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) {
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This will remove all notes permanently.'
    )

    if (!confirmed) {
      return
    }

    setIsDeletingAccount(true)

    try {
      const response = await fetch(`${API_URL}/api/account/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account')
      }

      clearAuthSession()
      toast.success('Account deleted')
      navigate('/register', { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-nav">
        <div>
          <p className="dashboard-brand">SecureNotes</p>
          <p className="dashboard-tagline">Manage your profile, password, and account settings.</p>
        </div>
        <div className="dashboard-nav-actions">
          <Link className="dashboard-button dashboard-button-secondary" to="/dashboard">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div>
            <p className="dashboard-eyebrow">Account</p>
            <h1>Your profile settings</h1>
            <p className="dashboard-subtitle">
              Keep your account details updated and secure.
            </p>
          </div>
        </section>

        {loading ? (
          <AppState
            variant="loading"
            title="Loading profile"
            description="Fetching your account details from the server."
          />
        ) : profileError ? (
          <AppState
            variant="error"
            title="Could not load profile"
            description={profileError}
            actionLabel="Try again"
            onAction={loadProfile}
          />
        ) : (
          <section className="profile-grid">
            <section className="dashboard-panel">
              <div className="dashboard-section-header">
                <h2>Profile details</h2>
                <p>Update how your name and email appear in the app.</p>
              </div>
              <form className="dashboard-form" onSubmit={handleProfileUpdate}>
                <label className="dashboard-field">
                  <span>Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>
                <label className="dashboard-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>
                <p className="profile-meta">
                  Member since {new Date(profile?.createdAt).toLocaleDateString()}
                </p>
                <button
                  type="submit"
                  className="dashboard-button dashboard-button-primary"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Saving...' : 'Save profile'}
                </button>
              </form>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-section-header">
                <h2>Change password</h2>
                <p>After changing your password, you will be logged out and asked to sign in again.</p>
              </div>
              <form className="dashboard-form" onSubmit={handlePasswordChange}>
                <label className="dashboard-field">
                  <span>Current password</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </label>
                <label className="dashboard-field">
                  <span>New password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </label>
                <label className="dashboard-field">
                  <span>Confirm new password</span>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    required
                  />
                </label>
                <p className="auth-field-help">
                  Use at least 8 characters with uppercase, lowercase, and a number.
                </p>
                <button
                  type="submit"
                  className="dashboard-button dashboard-button-primary"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </section>

            <section className="dashboard-panel profile-danger-panel">
              <div className="dashboard-section-header">
                <h2>Delete account</h2>
                <p>This permanently removes your account and all notes.</p>
              </div>
              <button
                type="button"
                className="dashboard-button dashboard-button-danger"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete account'}
              </button>
            </section>
          </section>
        )}
      </main>
    </div>
  )
}

export default Profile
