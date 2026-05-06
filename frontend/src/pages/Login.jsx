import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const response = await fetch(
        'https://securenotes-backend-jcor.onrender.com/api/auth/login',
        {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      localStorage.setItem('token', data.token)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '24px' }}>
      <h1>Login</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
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
        <button type="submit">Login</button>
      </form>
      {message ? <p>{message}</p> : null}
    </div>
  )
}

export default Login
