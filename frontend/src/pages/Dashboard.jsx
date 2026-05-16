import { useEffect, useId, useState } from 'react'
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseTags = (value) =>
  value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

const formatTags = (tags = []) => tags.join(', ')

const makeTodoItem = (text = '') => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  text,
  completed: false,
})

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['code-block'],
    ['clean'],
  ],
}

// ─── Component ───────────────────────────────────────────────────────────────

function Dashboard() {
  const token = getStoredToken()
  const uid = useId()

  // Data
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [notesError, setNotesError] = useState('')

  // Filters / sorting
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')

  // Form fields
  const [noteType, setNoteType] = useState('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [todoItems, setTodoItems] = useState([makeTodoItem()])
  const [tags, setTags] = useState('')
  const [noteColor, setNoteColor] = useState('default')
  const [editingNoteId, setEditingNoteId] = useState(null)

  const navigate = useNavigate()
  const authUser = getStoredAuthUser()
  const userLabel = authUser?.name || authUser?.email || 'Signed in user'

  // ─── API ───────────────────────────────────────────────────────────────────

  const fetchNotes = async () => {
    if (!token) return
    setLoading(true)
    setNotesError('')
    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch notes')
      setNotes(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      setNotesError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotes() }, [token])

  const resetForm = () => {
    setEditingNoteId(null)
    setNoteType('text')
    setTitle('')
    setContent('')
    setTodoItems([makeTodoItem()])
    setTags('')
    setNoteColor('default')
  }

  const buildPayload = (extraFields = {}) => ({
    title,
    type: noteType,
    content: noteType === 'text' ? content : '',
    todos: noteType === 'todo'
      ? todoItems.filter((item) => item.text.trim() !== '')
      : [],
    tags: parseTags(tags),
    color: noteColor,
    ...extraFields,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const isEditing = Boolean(editingNoteId)
      const url = isEditing
        ? `${API_URL}/api/notes/${editingNoteId}`
        : `${API_URL}/api/notes`

      let payload = buildPayload()
      if (isEditing) {
        const existing = notes.find((n) => n._id === editingNoteId)
        if (existing) {
          payload = buildPayload({ pinned: existing.pinned, favorite: existing.favorite })
        }
      }

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} note`)

      if (isEditing) {
        setNotes((cur) => cur.map((n) => (n._id === editingNoteId ? data.data : n)))
        toast.success('Note updated')
      } else {
        setNotes((cur) => [data.data, ...cur])
        toast.success('Note created')
      }
      resetForm()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return
    try {
      const res = await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to delete note')
      setNotes((cur) => cur.filter((n) => n._id !== id))
      toast.success('Note deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleEdit = (note) => {
    setEditingNoteId(note._id)
    setNoteType(note.type || 'text')
    setTitle(note.title)
    setContent(note.content || '')
    setTodoItems(
      Array.isArray(note.todos) && note.todos.length > 0
        ? note.todos
        : [makeTodoItem()]
    )
    setTags(formatTags(note.tags || []))
    setNoteColor(note.color || 'default')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggle = async (note, field) => {
    try {
      const res = await fetch(`${API_URL}/api/notes/${note._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: note.title,
          type: note.type || 'text',
          content: note.content || '',
          todos: Array.isArray(note.todos) ? note.todos : [],
          tags: Array.isArray(note.tags) ? note.tags : [],
          color: note.color || 'default',
          pinned: field === 'pinned' ? !note.pinned : Boolean(note.pinned),
          favorite: field === 'favorite' ? !note.favorite : Boolean(note.favorite),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Update failed')
      setNotes((cur) => cur.map((n) => (n._id === note._id ? data.data : n)))
      if (field === 'pinned') toast.success(note.pinned ? 'Unpinned' : 'Pinned')
      if (field === 'favorite') toast.success(note.favorite ? 'Removed from favorites' : 'Added to favorites')
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Inline todo completion toggle (optimistic, then persisted)
  const handleToggleTodoItem = async (note, itemId) => {
    const updatedTodos = (note.todos || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    // Optimistic update
    setNotes((cur) =>
      cur.map((n) => (n._id === note._id ? { ...n, todos: updatedTodos } : n))
    )
    try {
      const res = await fetch(`${API_URL}/api/notes/${note._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: note.title,
          type: note.type || 'todo',
          content: note.content || '',
          todos: updatedTodos,
          tags: Array.isArray(note.tags) ? note.tags : [],
          color: note.color || 'default',
          pinned: Boolean(note.pinned),
          favorite: Boolean(note.favorite),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update')
      setNotes((cur) => cur.map((n) => (n._id === note._id ? data.data : n)))
    } catch (err) {
      toast.error(err.message)
      // Revert optimistic
      setNotes((cur) =>
        cur.map((n) => (n._id === note._id ? { ...n, todos: note.todos } : n))
      )
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  // ─── Todo form helpers ─────────────────────────────────────────────────────

  const addTodoItem = () => setTodoItems((cur) => [...cur, makeTodoItem()])

  const updateTodoItem = (index, text) =>
    setTodoItems((cur) =>
      cur.map((item, i) => (i === index ? { ...item, text } : item))
    )

  const removeTodoItem = (index) =>
    setTodoItems((cur) => cur.filter((_, i) => i !== index))

  const toggleTodoItemForm = (index) =>
    setTodoItems((cur) =>
      cur.map((item, i) =>
        i === index ? { ...item, completed: !item.completed } : item
      )
    )

  // ─── Derived data ──────────────────────────────────────────────────────────

  const allCategories = Array.from(
    new Set(
      notes.flatMap((n) => (Array.isArray(n.tags) ? n.tags.filter(Boolean) : []))
    )
  ).sort((a, b) => a.localeCompare(b))

  const hasFavorites = notes.some((n) => n.favorite)

  const visibleNotes = [...notes]
    .filter((note) => {
      const query = searchTerm.trim().toLowerCase()
      if (activeTab === 'favorites' && !note.favorite) return false
      if (activeTab !== 'all' && activeTab !== 'favorites') {
        if (!Array.isArray(note.tags) || !note.tags.includes(activeTab)) return false
      }
      if (!query) return true
      return (
        (note.title || '').toLowerCase().includes(query) ||
        (note.content || '').toLowerCase().includes(query) ||
        (note.todos || []).some((t) => t.text.toLowerCase().includes(query))
      )
    })
    .sort((a, b) => {
      const aT = new Date(a.createdAt || 0).getTime()
      const bT = new Date(b.createdAt || 0).getTime()
      return sortOrder === 'oldest' ? aT - bT : bT - aT
    })

  // ─── Render ────────────────────────────────────────────────────────────────

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
          <button type="button" className="dashboard-button dashboard-button-secondary" onClick={handleLogout}>
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
              Capture notes and checklists, manage them from one place.
            </p>
          </div>
        </section>

        <section className="dashboard-grid">
          {/* ── Create / Edit Form ── */}
          <div className="dashboard-panel dashboard-form-panel">
            <div className="dashboard-section-header">
              <h2>{editingNoteId ? 'Update note' : 'Create a note'}</h2>
              <p>{editingNoteId ? 'Make changes to your selected note.' : 'Write something important and keep it organized.'}</p>
            </div>

            <form className="dashboard-form" onSubmit={handleSubmit}>
              {/* Note type selector */}
              <div className="note-type-tabs">
                <button
                  type="button"
                  className={`note-type-tab${noteType === 'text' ? ' note-type-tab--active' : ''}`}
                  onClick={() => setNoteType('text')}
                >
                  ✏️ Text
                </button>
                <button
                  type="button"
                  className={`note-type-tab${noteType === 'todo' ? ' note-type-tab--active' : ''}`}
                  onClick={() => setNoteType('todo')}
                >
                  ✅ Checklist
                </button>
              </div>

              <label className="dashboard-field">
                <span>Title</span>
                <input
                  type="text"
                  placeholder={noteType === 'todo' ? 'Shopping list' : 'Weekly plan'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              {noteType === 'text' ? (
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
              ) : (
                <div className="dashboard-field">
                  <span>Checklist items</span>
                  <div className="todo-editor">
                    {todoItems.map((item, index) => (
                      <div key={item.id} className="todo-editor-row">
                        <button
                          type="button"
                          className={`todo-check-btn${item.completed ? ' todo-check-btn--done' : ''}`}
                          onClick={() => toggleTodoItemForm(index)}
                          title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {item.completed ? '✓' : ''}
                        </button>
                        <input
                          id={`${uid}-todo-${index}`}
                          type="text"
                          className={`todo-editor-input${item.completed ? ' todo-editor-input--done' : ''}`}
                          placeholder={`Item ${index + 1}`}
                          value={item.text}
                          onChange={(e) => updateTodoItem(index, e.target.value)}
                        />
                        {todoItems.length > 1 && (
                          <button
                            type="button"
                            className="todo-remove-btn"
                            onClick={() => removeTodoItem(index)}
                            title="Remove item"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="todo-add-btn"
                      onClick={addTodoItem}
                    >
                      + Add item
                    </button>
                  </div>
                </div>
              )}

              <label className="dashboard-field">
                <span>Category / Tags</span>
                <input
                  type="text"
                  placeholder="work, personal, urgent"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
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
                      style={{ background: c.id === 'default' ? 'var(--border)' : c.swatch }}
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
                  <button type="button" className="dashboard-button dashboard-button-secondary" onClick={resetForm}>
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

            {/* Search + Sort */}
            <div className="dashboard-toolbar">
              <label className="dashboard-field dashboard-search">
                <span>Search notes</span>
                <input
                  type="search"
                  placeholder="Search by title or content"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
              <div className="dashboard-filters">
                <label className="dashboard-field dashboard-select-field">
                  <span>Sort</span>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="filter-tabs" role="tablist">
              <button
                type="button" role="tab"
                className={`filter-tab${activeTab === 'all' ? ' filter-tab--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >All</button>
              {hasFavorites && (
                <button
                  type="button" role="tab"
                  className={`filter-tab${activeTab === 'favorites' ? ' filter-tab--active' : ''}`}
                  onClick={() => setActiveTab('favorites')}
                >★ Favorites</button>
              )}
              {allCategories.map((cat) => (
                <button
                  key={cat} type="button" role="tab"
                  className={`filter-tab${activeTab === cat ? ' filter-tab--active' : ''}`}
                  onClick={() => setActiveTab(cat)}
                >{cat}</button>
              ))}
            </div>

            {/* Notes list */}
            {loading ? (
              <AppState variant="loading" title="Loading notes" description="Fetching your latest notes from the server." />
            ) : notesError ? (
              <AppState variant="error" title="Could not load notes" description={notesError} actionLabel="Try again" onAction={fetchNotes} />
            ) : notes.length === 0 ? (
              <AppState variant="empty" title="No notes yet" description="Create your first note to start building your private workspace." />
            ) : visibleNotes.length === 0 ? (
              <AppState variant="empty" title="No notes match" description="Try a different search term or switch the filter tab." />
            ) : (
              <div className="notes-grid">
                {visibleNotes.map((note) => {
                  const isTodo = note.type === 'todo'
                  const palette = getNoteColor(note.color || 'default')
                  const isColored = note.color && note.color !== 'default'
                  const cardStyle = isColored
                    ? { background: palette.cardBg, borderColor: palette.cardBorder, color: palette.textColor }
                    : {}

                  const completedCount = isTodo
                    ? (note.todos || []).filter((t) => t.completed).length
                    : 0
                  const totalCount = isTodo ? (note.todos || []).length : 0

                  return (
                    <article
                      key={note._id}
                      className={`note-card${isColored ? ' note-card--colored' : ''}${isTodo ? ' note-card--todo' : ''}`}
                      style={cardStyle}
                    >
                      <div className="note-card-body">
                        <div className="note-card-header">
                          <div className="note-card-title-row">
                            {isTodo && <span className="note-type-badge">✅</span>}
                            <h2 style={isColored ? { color: palette.textColor } : {}}>
                              {note.title}
                            </h2>
                          </div>
                          <div className="note-badges">
                            {note.favorite && <span className="note-badge note-badge-favorite" title="Favorite">★</span>}
                            {note.pinned && <span className="note-badge" title="Pinned">📌</span>}
                          </div>
                        </div>

                        {isTodo ? (
                          <div className="todo-preview">
                            {totalCount > 0 && (
                              <div className="todo-progress">
                                <div
                                  className="todo-progress-bar"
                                  style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
                                />
                              </div>
                            )}
                            <p className="todo-count" style={isColored ? { color: palette.textColor, opacity: 0.7 } : {}}>
                              {completedCount} / {totalCount} completed
                            </p>
                            <ul className="todo-list">
                              {(note.todos || []).slice(0, 6).map((item) => (
                                <li key={item.id} className={`todo-item${item.completed ? ' todo-item--done' : ''}`}>
                                  <button
                                    type="button"
                                    className={`todo-checkbox${item.completed ? ' todo-checkbox--checked' : ''}`}
                                    onClick={() => handleToggleTodoItem(note, item.id)}
                                    title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                                    style={isColored ? { borderColor: palette.textColor } : {}}
                                  >
                                    {item.completed ? '✓' : ''}
                                  </button>
                                  <span
                                    className="todo-item-text"
                                    style={isColored ? { color: palette.textColor } : {}}
                                  >
                                    {item.text}
                                  </span>
                                </li>
                              ))}
                              {totalCount > 6 && (
                                <li className="todo-more" style={isColored ? { color: palette.textColor, opacity: 0.6 } : {}}>
                                  +{totalCount - 6} more items
                                </li>
                              )}
                            </ul>
                          </div>
                        ) : (
                          <div
                            className="note-card-content"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content || '') }}
                          />
                        )}

                        {Array.isArray(note.tags) && note.tags.length > 0 && (
                          <div className="note-tags">
                            {note.tags.map((tag) => (
                              <span
                                key={`${note._id}-${tag}`}
                                className="note-tag"
                                style={isColored ? { background: 'rgba(0,0,0,0.1)', color: palette.textColor } : {}}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="note-card-actions">
                        <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => handleToggle(note, 'favorite')}>
                          {note.favorite ? 'Unfavorite' : 'Favorite'}
                        </button>
                        <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => handleToggle(note, 'pinned')}>
                          {note.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => handleEdit(note)}>
                          Edit
                        </button>
                        <button type="button" className="dashboard-button dashboard-button-danger" onClick={() => handleDelete(note._id)}>
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
