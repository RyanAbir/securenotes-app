import { Navigate } from 'react-router-dom'

import { clearAuthSession, getStoredToken, isTokenExpired } from '../utils/auth'

function ProtectedRoute({ children }) {
  const token = getStoredToken()

  if (!token || isTokenExpired(token)) {
    clearAuthSession()
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
