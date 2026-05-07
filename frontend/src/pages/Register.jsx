import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { API_URL } from '../config/api'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

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
        navigate('/dashboard', { replace: true })
        return
      }

      navigate('/login', { replace: true })
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '24px' }}>
      <h1>Register</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      {message ? <p>{message}</p> : null}
    </div>
  )
}

export default Register
