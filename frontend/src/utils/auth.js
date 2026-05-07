const TOKEN_KEY = 'token'
const AUTH_USER_KEY = 'authUser'

const decodeBase64Url = (value) => {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalizedValue.length % 4
  const paddedValue =
    padding === 0 ? normalizedValue : normalizedValue.padEnd(normalizedValue.length + (4 - padding), '=')

  return atob(paddedValue)
}

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY)

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export const storeAuthSession = ({ token, name = '', email = '' }) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      name,
      email,
    })
  )
}

export const getStoredAuthUser = () => {
  const storedAuthUser = localStorage.getItem(AUTH_USER_KEY)

  if (!storedAuthUser) {
    return null
  }

  try {
    return JSON.parse(storedAuthUser)
  } catch {
    return null
  }
}

export const getTokenExpiryTime = (token) => {
  if (!token) {
    return null
  }

  try {
    const [, payload] = token.split('.')

    if (!payload) {
      return null
    }

    const parsedPayload = JSON.parse(decodeBase64Url(payload))

    if (typeof parsedPayload.exp !== 'number') {
      return null
    }

    return parsedPayload.exp * 1000
  } catch {
    return null
  }
}

export const isTokenExpired = (token) => {
  const expiryTime = getTokenExpiryTime(token)

  if (!expiryTime) {
    return true
  }

  return Date.now() >= expiryTime
}
