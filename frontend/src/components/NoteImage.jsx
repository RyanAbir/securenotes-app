import { useState } from 'react'

/**
 * Renders a note card image with:
 * - shimmer skeleton while loading
 * - graceful error fallback
 * - hover zoom via CSS
 */
function NoteImage({ src, alt }) {
  const [status, setStatus] = useState('loading')

  if (!src) return null

  return (
    <div className="note-card-image-wrap">
      {status === 'loading' && <div className="note-card-image-skeleton" />}
      {status === 'error' && (
        <div className="note-card-image-error">⚠ Image unavailable</div>
      )}
      <img
        src={src}
        alt={alt || 'Note image'}
        className="note-card-image"
        loading="lazy"
        style={status !== 'loaded' ? { display: 'none' } : {}}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  )
}

export default NoteImage
