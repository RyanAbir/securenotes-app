import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import AuthLayout from '../components/AuthLayout'
import { API_URL } from '../config/api'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
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
        throw new Error(
          typeof data.message === 'string' && data.message
            ? data.message
            : 'Registration failed'
        )
      }

      if (data.token) {
        localStorage.setItem('token', data.token)
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
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
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
            placeholder="Create a secure password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="dashboard-button dashboard-button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Register
