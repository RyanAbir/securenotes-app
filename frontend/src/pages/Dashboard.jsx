import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import '../quill-overrides.css'
import '../note-cards-extra.css'
import DOMPurify from 'dompurify'
import AppState from '../components/AppState'
import { API_URL } from '../config/api'
import { clearAuthSession, getStoredAuthUser, getStoredToken } from '../utils/auth'
import { NOTE_COLORS, getNoteColor } from '../note-colors'

const parseTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

const formatTags = (tags = []) => tags.join(', ')

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['code-block'],
    ['clean'],
  ],
}

function Dashboard() {
  const token = getStoredToken()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [notesError, setNotesError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [noteColor, setNoteColor] = useState('default')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const navigate = useNavigate()

  const authUser = getStoredAuthUser()
  const userLabel = authUser?.name || authUser?.email || 'Signed in user'

  const fetchNotes = async () => {
    if (!token) return

    setLoading(true)
    setNotesError('')

    try {
      const response = await fetch(`${API_URL}/api/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to fetch notes')
      setNotes(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      setNotesError(error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [token])

  const buildPayload = ({ extraFields = {} } = {}) => ({
    title,
    content,
    tags: parseTags(tags),
    color: noteColor,
    ...extraFields,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const url = editingNoteId
        ? `${API_URL}/api/notes/${editingNoteId}`
        : `${API_URL}/api/notes`
      const method = editingNoteId ? 'PUT' : 'POST'

      let payload = buildPayload()
      if (editingNoteId) {
        const existing = notes.find((n) => n._id === editingNoteId)
        if (existing) {
          payload = buildPayload({
            extraFields: {
              pinned: existing.pinned,
              favorite: existing.favorite,
            },
          })
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok)
        throw new Error(data.message || `Failed to ${editingNoteId ? 'update' : 'create'} note`)

      setTitle('')
      setContent('')
      setTags('')
      setNoteColor('default')

      if (editingNoteId) {
        setNotes((cur) => cur.map((n) => (n._id === editingNoteId ? data.data : n)))
        setEditingNoteId(null)
        toast.success('Note updated')
      } else {
        setNotes((cur) => [data.data, ...cur])
        toast.success('Note created')
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setTitle('')
    setContent('')
    setTags('')
    setNoteColor('default')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to delete note')
      setNotes((cur) => cur.filter((n) => n._id !== id))
      toast.success('Note deleted')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleEdit = (note) => {
    setEditingNoteId(note._id)
    setTitle(note.title)
    setContent(note.content)
    setTags(formatTags(note.tags || []))
    setNoteColor(note.color || 'default')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTogglePinned = async (note) => {
    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          tags: Array.isArray(note.tags) ? note.tags : [],
          color: note.color || 'default',
          pinned: !note.pinned,
          favorite: Boolean(note.favorite),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update pinned status')
      setNotes((cur) => cur.map((n) => (n._id === note._id ? data.data : n)))
      toast.success(note.pinned ? 'Note unpinned' : 'Note pinned')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleToggleFavorite = async (note) => {
    try {
      const response = await fetch(`${API_URL}/api/notes/${note._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          tags: Array.isArray(note.tags) ? note.tags : [],
          color: note.color || 'default',
          pinned: Boolean(note.pinned),
          favorite: !note.favorite,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update favorite status')
      setNotes((cur) => cur.map((n) => (n._id === note._id ? data.data : n)))
      toast.success(note.favorite ? 'Removed from favorites' : 'Added to favorites')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  // ─── Derived data ───────────────────────────────────────────────
  const allCategories = Array.from(
    new Set(
      notes.flatMap((note) =>
        Array.isArray(note.tags) ? note.tags.filter(Boolean) : []
      )
    )
  ).sort((a, b) => a.localeCompare(b))

  const visibleNotes = [...notes]
    .filter((note) => {
      const query = searchTerm.trim().toLowerCase()

      if (activeTab === 'favorites' && !note.favorite) return false
      if (activeTab !== 'all' && activeTab !== 'favorites') {
        const hasTag =
          Array.isArray(note.tags) && note.tags.includes(activeTab)
        if (!hasTag) return false
      }

      if (!query) return true
      const titleText = (note.title || '').toLowerCase()
      const contentText = (note.content || '').toLowerCase()
      return titleText.includes(query) || contentText.includes(query)
    })
    .sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime()
      const bDate = new Date(b.createdAt || 0).getTime()
      return sortOrder === 'oldest' ? aDate - bDate : bDate - aDate
    })

  const hasFavorites = notes.some((n) => n.favorite)

  return (
    <div className="dashboard-page">
      <header className="dashboard-nav">
        <div>
          <p className="dashboard-brand">SecureNotes</p>
          <p className="dashboard-tagline">Signed in as {userLabel}</p>
        </div>
        <div className="dashboard-nav-actions">
          <Link className="dashboard-button dashboard-button-secondary" to="/profile">
            Profile
          </Link>
          <button
            type="button"
            className="dashboard-button dashboard-button-secondary"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div>
            <p className="dashboard-eyebrow">Dashboard</p>
            <h1>Your secure workspace</h1>
            <p className="dashboard-subtitle">
              Capture notes quickly and manage them from one place.
            </p>
          </div>
        </section>

        <section className="dashboard-grid">
          {/* ── Create / Edit Form ── */}
          <div className="dashboard-panel dashboard-form-panel">
            <div className="dashboard-section-header">
              <h2>{editingNoteId ? 'Update note' : 'Create a note'}</h2>
              <p>
                {editingNoteId
                  ? 'Make changes to your selected note.'
                  : 'Write something important and keep it organized.'}
              </p>
            </div>
            <form className="dashboard-form" onSubmit={handleSubmit}>
              <label className="dashboard-field">
                <span>Title</span>
                <input
                  type="text"
                  placeholder="Weekly plan"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </label>

              <label className="dashboard-field">
                <span>Content</span>
                <ReactQuill
                  theme="snow"
                  modules={quillModules}
                  value={content}
                  onChange={setContent}
                  placeholder="Add your note details here"
                />
              </label>

              <label className="dashboard-field">
                <span>Category / Tags</span>
                <input
                  type="text"
                  placeholder="work, personal, urgent"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>

              {/* Color picker */}
              <div className="dashboard-field">
                <span>Note color</span>
                <div className="note-color-picker">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      className={`note-color-swatch${noteColor === c.id ? ' note-color-swatch--active' : ''}`}
                      style={{
                        background: c.id === 'default' ? 'var(--border)' : c.swatch,
                      }}
                      onClick={() => setNoteColor(c.id)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="dashboard-button dashboard-button-primary">
                  {editingNoteId ? 'Update Note' : 'Add Note'}
                </button>
                {editingNoteId && (
                  <button
                    type="button"
                    className="dashboard-button dashboard-button-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ── Notes Panel ── */}
          <section className="dashboard-panel dashboard-notes-panel">
            <div className="dashboard-section-header">
              <h2>Your notes</h2>
              <p>{visibleNotes.length} visible note{visibleNotes.length === 1 ? '' : 's'}</p>
            </div>

            {/* Search + Sort toolbar */}
            <div className="dashboard-toolbar">
              <label className="dashboard-field dashboard-search">
                <span>Search notes</span>
                <input
                  type="search"
                  placeholder="Search by title or content"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <div className="dashboard-filters">
                <label className="dashboard-field dashboard-select-field">
                  <span>Sort</span>
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="filter-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                className={`filter-tab${activeTab === 'all' ? ' filter-tab--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              {hasFavorites && (
                <button
                  type="button"
                  role="tab"
                  className={`filter-tab${activeTab === 'favorites' ? ' filter-tab--active' : ''}`}
                  onClick={() => setActiveTab('favorites')}
                >
                  ★ Favorites
                </button>
              )}
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  className={`filter-tab${activeTab === cat ? ' filter-tab--active' : ''}`}
                  onClick={() => setActiveTab(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Notes content */}
            {loading ? (
              <AppState
                variant="loading"
                title="Loading notes"
                description="Fetching your latest notes from the server."
              />
            ) : notesError ? (
              <AppState
                variant="error"
                title="Could not load notes"
                description={notesError}
                actionLabel="Try again"
                onAction={fetchNotes}
              />
            ) : notes.length === 0 ? (
              <AppState
                variant="empty"
                title="No notes yet"
                description="Create your first note to start building your private workspace."
              />
            ) : visibleNotes.length === 0 ? (
              <AppState
                variant="empty"
                title="No notes match"
                description="Try a different search term or switch the filter tab."
              />
            ) : (
              <div className="notes-grid">
                {visibleNotes.map((note) => {
                  const palette = getNoteColor(note.color || 'default')
                  const isColored = note.color && note.color !== 'default'
                  return (
                    <article
                      key={note._id}
                      className={`note-card${isColored ? ' note-card--colored' : ''}`}
                      style={
                        isColored
                          ? {
                              background: palette.cardBg,
                              borderColor: palette.cardBorder,
                              color: palette.textColor,
                            }
                          : {}
                      }
                    >
                      <div className="note-card-body">
                        <div className="note-card-header">
                          <h2
                            style={isColored ? { color: palette.textColor } : {}}
                          >
                            {note.title}
                          </h2>
                          <div className="note-badges">
                            {note.favorite && (
                              <span
                                className="note-badge note-badge-favorite"
                                title="Favorite"
                              >
                                ★
                              </span>
                            )}
                            {note.pinned && (
                              <span className="note-badge" title="Pinned">
                                📌
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className="note-card-content"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(note.content),
                          }}
                        />

                        {Array.isArray(note.tags) && note.tags.length > 0 && (
                          <div className="note-tags">
                            {note.tags.map((tag) => (
                              <span
                                key={`${note._id}-${tag}`}
                                className="note-tag"
                                style={
                                  isColored
                                    ? {
                                        background: 'rgba(0,0,0,0.1)',
                                        color: palette.textColor,
                                      }
                                    : {}
                                }
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="note-card-actions">
                        <button
                          type="button"
                          className="dashboard-button dashboard-button-secondary"
                          onClick={() => handleToggleFavorite(note)}
                        >
                          {note.favorite ? 'Unfavorite' : 'Favorite'}
                        </button>
                        <button
                          type="button"
                          className="dashboard-button dashboard-button-secondary"
                          onClick={() => handleTogglePinned(note)}
                        >
                          {note.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          type="button"
                          className="dashboard-button dashboard-button-secondary"
                          onClick={() => handleEdit(note)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dashboard-button dashboard-button-danger"
                          onClick={() => handleDelete(note._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
