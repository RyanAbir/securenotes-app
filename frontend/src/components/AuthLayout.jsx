import { Link } from 'react-router-dom'

function AuthLayout({
  title,
  subtitle,
  helperText,
  helperLinkLabel,
  helperLinkTo,
  children,
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="auth-eyebrow">SecureNotes</p>
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
        </div>

        {children}

        {helperText ? (
          <p className="auth-helper">
            {helperText}{' '}
            {helperLinkLabel && helperLinkTo ? (
              <Link className="auth-helper-link" to={helperLinkTo}>
                {helperLinkLabel}
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default AuthLayout
