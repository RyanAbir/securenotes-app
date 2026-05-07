import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  clearAuthSession,
  getStoredToken,
  getTokenExpiryTime,
  isTokenExpired,
} from '../utils/auth'

function AuthSessionManager() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      return undefined
    }

    const isAuthRoute =
      location.pathname === '/login' || location.pathname === '/register'

    if (isTokenExpired(token)) {
      clearAuthSession()

      if (!isAuthRoute) {
        toast.error('Your session has expired. Please log in again.')
        navigate('/login', { replace: true })
      }

      return undefined
    }

    const expiryTime = getTokenExpiryTime(token)

    if (!expiryTime) {
      clearAuthSession()

      if (!isAuthRoute) {
        toast.error('Your session is invalid. Please log in again.')
        navigate('/login', { replace: true })
      }

      return undefined
    }

    const timeoutMs = expiryTime - Date.now()

    const timeoutId = window.setTimeout(() => {
      clearAuthSession()
      toast.error('Your session has expired. Please log in again.')
      navigate('/login', { replace: true })
    }, timeoutMs)

    return () => window.clearTimeout(timeoutId)
  }, [location.pathname, navigate])

  return null
}

export default AuthSessionManager
