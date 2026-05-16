import { useRef, useState } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_BYTES = 512 * 1024 // 512 KB

/**
 * Image upload component with:
 * - click-to-browse file picker
 * - drag-and-drop support
 * - client-side type + size validation
 * - Base64 preview
 * - remove button
 */
function ImageUploader({ value, onChange }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const processFile = (file) => {
    setUploadError('')

    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Please use JPEG, PNG, GIF, or WebP.')
      return
    }

    if (file.size > MAX_BYTES) {
      const kb = Math.round(file.size / 1024)
      setUploadError(`File too large (${kb} KB). Maximum is 512 KB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onChange(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) processFile(file)
    // Reset input so the same file can be re-selected after removal
    event.target.value = ''
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleRemove = () => {
    setUploadError('')
    onChange('')
  }

  if (value) {
    return (
      <div className="image-preview-wrap">
        <img src={value} alt="Note preview" className="image-preview-img" />
        <button
          type="button"
          className="image-preview-remove"
          onClick={handleRemove}
          title="Remove image"
        >
          ✕
        </button>
        <p className="image-preview-info">Image attached · click ✕ to remove</p>
      </div>
    )
  }

  return (
    <div>
      <div
        className={`image-upload-zone${dragOver ? ' image-upload-zone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          tabIndex={-1}
          aria-label="Upload image"
        />
        <span className="image-upload-icon">🖼️</span>
        <span className="image-upload-label">
          {dragOver ? 'Drop to attach' : 'Click or drag & drop image'}
        </span>
        <span className="image-upload-hint">JPEG, PNG, GIF, WebP · max 512 KB</span>
      </div>
      {uploadError && <p className="image-upload-error">{uploadError}</p>}
    </div>
  )
}

export default ImageUploader
