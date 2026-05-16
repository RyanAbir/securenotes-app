import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import AuthLayout from '../components/AuthLayout'
import { API_URL } from '../config/api'
import { clearAuthSession, getStoredToken, isTokenExpired, storeAuthSession } from '../utils/auth'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

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

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(
          typeof data.message === 'string' && data.message
            ? data.message
            : 'Login failed'
        )
      }

      const resolvedToken = data.token || (data.data && data.data.token)

      if (!resolvedToken) {
        throw new Error('Login failed: token missing')
      }

      storeAuthSession({
        token: resolvedToken,
        name: data.name || (data.data && data.data.name) || '',
        email: data.email || (data.data && data.data.email) || email,
      })
      toast.success('Login successful')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Login"
      subtitle="Access your private notes and continue where you left off."
      helperText="Need an account?"
      helperLinkLabel="Register here"
      helperLinkTo="/register"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            placeholder="info@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="dashboard-button dashboard-button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Login
