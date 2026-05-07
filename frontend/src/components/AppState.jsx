function AppState({
  variant = 'empty',
  title,
  description,
  actionLabel,
  onAction,
}) {
  const iconByVariant = {
    loading: '…',
    empty: '○',
    error: '!',
    info: 'i',
  }

  return (
    <div className={`app-state app-state--${variant}`}>
      <div className="app-state-icon" aria-hidden="true">
        {iconByVariant[variant] ?? iconByVariant.info}
      </div>
      {title ? <h3 className="app-state-title">{title}</h3> : null}
      {description ? <p className="app-state-description">{description}</p> : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          className="dashboard-button dashboard-button-secondary app-state-action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export default AppState
