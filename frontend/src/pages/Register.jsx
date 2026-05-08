import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import AuthLayout from '../components/AuthLayout'
import { API_URL } from '../config/api'
import { clearAuthSession, getStoredToken, isTokenExpired, storeAuthSession } from '../utils/auth'

const strongPasswordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

const validateRegisterForm = ({ name, email, password, confirmPassword }) => {
  const errors = {}

  if (!name.trim()) {
    errors.name = 'Name is required'
  }

  if (!email.trim()) {
    errors.email = 'Email is required'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (!strongPasswordRule.test(password)) {
    errors.password =
      'Use at least 8 characters with uppercase, lowercase, and a number'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const navigate = useNavigate()

  const localErrors = validateRegisterForm({ name, email, password, confirmPassword })
  const isFormValid = Object.keys(localErrors).length === 0

  const getVisibleError = (field) => {
    if (serverErrors[field]) {
      return serverErrors[field]
    }

    if (touched[field] || hasSubmitted) {
      return localErrors[field]
    }

    return ''
  }

  const getInputClassName = (field) =>
    getVisibleError(field) ? 'auth-input-error' : undefined

  const markTouched = (field) =>
    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }))

  const clearServerError = (field) => {
    setServerErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  useEffect(() => {
    const token = getStoredToken()

    if (token) {
      if (isTokenExpired(token)) {
        clearAuthSession()
        return
      }

      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setHasSubmitted(true)
    setServerErrors({})

    if (!isFormValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        if (Array.isArray(data.errors)) {
          const nextServerErrors = data.errors.reduce((accumulator, error) => {
            if (error?.field && error?.message) {
              accumulator[error.field] = error.message
            }

            return accumulator
          }, {})

          if (Object.keys(nextServerErrors).length > 0) {
            setServerErrors(nextServerErrors)
          }
        }

        throw new Error(
          typeof data.message === 'string' && data.message
            ? data.message
            : 'Registration failed'
        )
      }

      if (data.data && data.data.token) {
        storeAuthSession({
          token: data.data.token,
          name: data.data.name || name,
          email: data.data.email || email,
        })
        toast.success('Registration successful')
        navigate('/dashboard', { replace: true })
        return
      }

      toast.success('Registration successful. Please log in.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Register"
      subtitle="Create an account to store your notes securely and keep them available across sessions."
      helperText="Already have an account?"
      helperLinkLabel="Login instead"
      helperLinkTo="/login"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Name</span>
          <input
            type="text"
            placeholder="Ryan Abir"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              clearServerError('name')
            }}
            onBlur={() => markTouched('name')}
            className={getInputClassName('name')}
            required
          />
          {getVisibleError('name') ? (
            <p className="auth-field-error">{getVisibleError('name')}</p>
          ) : null}
        </label>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            placeholder="info@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              clearServerError('email')
            }}
            onBlur={() => markTouched('email')}
            className={getInputClassName('email')}
            required
          />
          {getVisibleError('email') ? (
            <p className="auth-field-error">{getVisibleError('email')}</p>
          ) : null}
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            placeholder="Create a secure password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              clearServerError('password')
            }}
            onBlur={() => markTouched('password')}
            className={getInputClassName('password')}
            required
          />
          {getVisibleError('password') ? (
            <p className="auth-field-error">{getVisibleError('password')}</p>
          ) : (
            <p className="auth-field-help">
              Use at least 8 characters with uppercase, lowercase, and a number.
            </p>
          )}
        </label>
        <label className="auth-field">
          <span>Confirm password</span>
          <input
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            onBlur={() => markTouched('confirmPassword')}
            className={getInputClassName('confirmPassword')}
            required
          />
          {getVisibleError('confirmPassword') ? (
            <p className="auth-field-error">{getVisibleError('confirmPassword')}</p>
          ) : null}
        </label>
        <button
          type="submit"
          className="dashboard-button dashboard-button-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Register
