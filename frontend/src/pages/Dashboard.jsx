import { useEffect, useId, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import '../quill-overrides.css'
import '../note-cards-extra.css'
import '../image-upload.css'
import DOMPurify from 'dompurify'
import AppState from '../components/AppState'
import ImageUploader from '../components/ImageUploader'
import NoteImage from '../components/NoteImage'
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
  const editUid = useId()

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
  const [imageUrl, setImageUrl] = useState('')

  // Edit modal fields
  const [editingNote, setEditingNote] = useState(null)
  const [editNoteType, setEditNoteType] = useState('text')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTodoItems, setEditTodoItems] = useState([makeTodoItem()])
  const [editTags, setEditTags] = useState('')
  const [editNoteColor, setEditNoteColor] = useState('default')
  const [editImageUrl, setEditImageUrl] = useState('')

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

  useEffect(() => {
    if (!editingNote) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setEditingNote(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingNote])

  const resetForm = () => {
    setNoteType('text')
    setTitle('')
    setContent('')
    setTodoItems([makeTodoItem()])
    setTags('')
    setNoteColor('default')
    setImageUrl('')
  }

  const buildPayload = (fields, extraFields = {}) => ({
    title: fields.title,
    type: fields.noteType,
    content: fields.noteType === 'text' ? fields.content : '',
    todos: fields.noteType === 'todo'
      ? fields.todoItems.filter((item) => item.text.trim() !== '')
      : [],
    tags: parseTags(fields.tags),
    color: fields.noteColor,
    imageUrl: fields.imageUrl,
    ...extraFields,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = buildPayload({
        title,
        noteType,
        content,
        todoItems,
        tags,
        noteColor,
        imageUrl,
      })

      const res = await fetch(`${API_URL}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create note')

      setNotes((cur) => [data.data, ...cur])
      toast.success('Note created')
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
    setEditingNote(note)
    setEditNoteType(note.type || 'text')
    setEditTitle(note.title)
    setEditContent(note.content || '')
    setEditTodoItems(
      Array.isArray(note.todos) && note.todos.length > 0
        ? note.todos
        : [makeTodoItem()]
    )
    setEditTags(formatTags(note.tags || []))
    setEditNoteColor(note.color || 'default')
    setEditImageUrl(note.imageUrl || '')
  }

  const closeEditModal = () => {
    setEditingNote(null)
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    if (!editingNote) return

    try {
      const payload = buildPayload(
        {
          title: editTitle,
          noteType: editNoteType,
          content: editContent,
          todoItems: editTodoItems,
          tags: editTags,
          noteColor: editNoteColor,
          imageUrl: editImageUrl,
        },
        {
          pinned: Boolean(editingNote.pinned),
          favorite: Boolean(editingNote.favorite),
        }
      )

      const res = await fetch(`${API_URL}/api/notes/${editingNote._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update note')

      setNotes((cur) => cur.map((n) => (n._id === editingNote._id ? data.data : n)))
      toast.success('Note updated')
      closeEditModal()
    } catch (err) {
      toast.error(err.message)
    }
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
          imageUrl: note.imageUrl || '',
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

  const handleToggleTodoItem = async (note, itemId) => {
    const updatedTodos = (note.todos || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
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
          imageUrl: note.imageUrl || '',
          pinned: Boolean(note.pinned),
          favorite: Boolean(note.favorite),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update')
      setNotes((cur) => cur.map((n) => (n._id === note._id ? data.data : n)))
    } catch (err) {
      toast.error(err.message)
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

  const addEditTodoItem = () => setEditTodoItems((cur) => [...cur, makeTodoItem()])

  const updateEditTodoItem = (index, text) =>
    setEditTodoItems((cur) =>
      cur.map((item, i) => (i === index ? { ...item, text } : item))
    )

  const removeEditTodoItem = (index) =>
    setEditTodoItems((cur) => cur.filter((_, i) => i !== index))

  const toggleEditTodoItemForm = (index) =>
    setEditTodoItems((cur) =>
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

  const visibleNotes = [...notes]
    .filter((note) => {
      const query = searchTerm.trim().toLowerCase()
      
      // Tab Filtering
      if (activeTab === 'favorites') {
        if (!note.favorite) return false
      } else if (activeTab === 'type:text') {
        if (note.type !== 'text') return false
      } else if (activeTab === 'type:todo') {
        if (note.type !== 'todo') return false
      } else if (activeTab === 'type:image') {
        if (!note.imageUrl) return false
      } else if (activeTab !== 'all') {
        // Category/Tag filter
        if (!Array.isArray(note.tags) || !note.tags.includes(activeTab)) return false
      }

      // Search Filtering
      if (!query) return true
      const inTitle = (note.title || '').toLowerCase().includes(query)
      const inContent = (note.content || '').toLowerCase().includes(query)
      const inTags = (note.tags || []).some(t => t.toLowerCase().includes(query))
      const inTodos = (note.todos || []).some((t) => t.text.toLowerCase().includes(query))
      
      return inTitle || inContent || inTags || inTodos
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
              Capture notes, checklists, and images — all in one place.
            </p>
          </div>
        </section>

        <section className="dashboard-grid">
          {/* ── Create Form ── */}
          <div className="dashboard-panel dashboard-form-panel">
            <div className="dashboard-section-header">
              <h2>Create a note</h2>
              <p>Write something important and keep it organized.</p>
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
                    <button type="button" className="todo-add-btn" onClick={addTodoItem}>
                      + Add item
                    </button>
                  </div>
                </div>
              )}

              {/* Image upload */}
              <div className="dashboard-field">
                <span>Attach image <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></span>
                <ImageUploader value={imageUrl} onChange={setImageUrl} />
              </div>

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

              <div className="dashboard-form-actions">
                <button type="submit" className="dashboard-button dashboard-button-primary">
                  Add Note
                </button>
              </div>
            </form>
          </div>

          {/* ── Notes Panel ── */}
          <section className="dashboard-panel dashboard-notes-panel">
            <div className="dashboard-section-header">
              <h2>Your notes</h2>
              <p>
                {visibleNotes.length} visible note{visibleNotes.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Search + Sort */}
            <div className="dashboard-toolbar">
              <div className="dashboard-search-container">
                <label className="dashboard-field dashboard-search">
                  <span>Search notes</span>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Search title, tags, or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        type="button" 
                        className="search-clear-btn"
                        onClick={() => setSearchTerm('')}
                        title="Clear search"
                      >✕</button>
                    )}
                  </div>
                </label>
              </div>
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
            <div className="filter-tabs-container">
              <div className="filter-tabs" role="tablist">
                <button
                  type="button" role="tab"
                  className={`filter-tab${activeTab === 'all' ? ' filter-tab--active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >All</button>
                
                <button
                  type="button" role="tab"
                  className={`filter-tab${activeTab === 'favorites' ? ' filter-tab--active' : ''}`}
                  onClick={() => setActiveTab('favorites')}
                >★ Favorites</button>

                <div className="filter-divider"></div>

                <button
                  type="button" role="tab"
                  className={`filter-tab${activeTab === 'type:text' ? ' filter-tab--active' : ''}`}
                  onClick={() => setActiveTab('type:text')}
                >✏️ Text</button>
                
                <button
                  type="button" role="tab"
                  className={`filter-tab${activeTab === 'type:todo' ? ' filter-tab--active' : ''}`}
                  onClick={() => setActiveTab('type:todo')}
                >✅ Checklists</button>
                
                <button
                  type="button" role="tab"
                  className={`filter-tab${activeTab === 'type:image' ? ' filter-tab--active' : ''}`}
                  onClick={() => setActiveTab('type:image')}
                >🖼️ Images</button>

                {allCategories.length > 0 && <div className="filter-divider"></div>}

                {allCategories.map((cat) => (
                  <button
                    key={cat} type="button" role="tab"
                    className={`filter-tab${activeTab === cat ? ' filter-tab--active' : ''}`}
                    onClick={() => setActiveTab(cat)}
                  >{cat}</button>
                ))}
              </div>
              
              {(activeTab !== 'all' || searchTerm) && (
                <button 
                  type="button" 
                  className="filter-reset-btn"
                  onClick={() => { setActiveTab('all'); setSearchTerm(''); }}
                >Reset All</button>
              )}
            </div>

            {/* Notes list */}
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
                title={searchTerm ? "No results found" : "Nothing to show"}
                description={
                  searchTerm 
                    ? `We couldn't find anything matching "${searchTerm}". Try different keywords.`
                    : activeTab === 'favorites'
                      ? "You haven't favorited any notes yet. Click the star on a card to add it here."
                      : "No notes match this filter. Try selecting a different category or type."
                }
                actionLabel={searchTerm || activeTab !== 'all' ? "Clear filters" : undefined}
                onAction={() => { setSearchTerm(''); setActiveTab('all'); }}
              />
            ) : (
              <div className="notes-grid">
                {visibleNotes.map((note) => {
                  const isTodo = note.type === 'todo'
                  const hasImage = Boolean(note.imageUrl)
                  const palette = getNoteColor(note.color || 'default')
                  const isColored = note.color && note.color !== 'default'
                  const cardStyle = isColored
                    ? {
                        background: palette.cardBg,
                        borderColor: palette.cardBorder,
                        color: palette.textColor,
                      }
                    : {}

                  const completedCount = isTodo
                    ? (note.todos || []).filter((t) => t.completed).length
                    : 0
                  const totalCount = isTodo ? (note.todos || []).length : 0

                  return (
                    <article
                      key={note._id}
                      className={[
                        'note-card',
                        isColored ? 'note-card--colored' : '',
                        isTodo ? 'note-card--todo' : '',
                        hasImage ? 'note-card--has-image' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={cardStyle}
                    >
                      {/* Card image (above body) */}
                      {hasImage && <NoteImage src={note.imageUrl} alt={note.title} />}

                      <div className="note-card-body">
                        <div className="note-card-header">
                          <div className="note-card-title-row">
                            {isTodo && <span className="note-type-badge">✅</span>}
                            {hasImage && !isTodo && (
                              <span className="note-type-badge">🖼️</span>
                            )}
                            <h2 style={isColored ? { color: palette.textColor } : {}}>
                              {note.title}
                            </h2>
                          </div>
                          <div className="note-badges">
                            {note.favorite && (
                              <span className="note-badge note-badge-favorite" title="Favorite">
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

                        {isTodo ? (
                          <div className="todo-preview">
                            {totalCount > 0 && (
                              <div className="todo-progress">
                                <div
                                  className="todo-progress-bar"
                                  style={{
                                    width: `${Math.round((completedCount / totalCount) * 100)}%`,
                                  }}
                                />
                              </div>
                            )}
                            <p
                              className="todo-count"
                              style={isColored ? { color: palette.textColor, opacity: 0.7 } : {}}
                            >
                              {completedCount} / {totalCount} completed
                            </p>
                            <ul className="todo-list">
                              {(note.todos || []).slice(0, 6).map((item) => (
                                <li
                                  key={item.id}
                                  className={`todo-item${item.completed ? ' todo-item--done' : ''}`}
                                >
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
                                <li
                                  className="todo-more"
                                  style={
                                    isColored ? { color: palette.textColor, opacity: 0.6 } : {}
                                  }
                                >
                                  +{totalCount - 6} more items
                                </li>
                              )}
                            </ul>
                          </div>
                        ) : (
                          <div
                            className="note-card-content"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(note.content || ''),
                            }}
                          />
                        )}

                        {Array.isArray(note.tags) && note.tags.length > 0 && (
                          <div className="note-tags">
                            {note.tags.map((tag) => (
                              <span
                                key={`${note._id}-${tag}`}
                                className="note-tag"
                                style={
                                  isColored
                                    ? { background: 'rgba(0,0,0,0.1)', color: palette.textColor }
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
                          className="card-action-btn"
                          onClick={() => handleToggle(note, 'favorite')}
                          title={note.favorite ? 'Unfavorite' : 'Favorite'}
                          style={isColored ? { color: palette.textColor } : {}}
                        >
                          {note.favorite ? '★' : '☆'}
                        </button>
                        <button
                          type="button"
                          className="card-action-btn"
                          onClick={() => handleToggle(note, 'pinned')}
                          title={note.pinned ? 'Unpin' : 'Pin'}
                          style={isColored ? { color: palette.textColor } : {}}
                        >
                          {note.pinned ? '📌' : '📍'}
                        </button>
                        <button
                          type="button"
                          className="card-action-btn"
                          onClick={() => handleEdit(note)}
                          title="Edit"
                          style={isColored ? { color: palette.textColor } : {}}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="card-action-btn card-action-btn--danger"
                          onClick={() => handleDelete(note._id)}
                          title="Delete"
                          style={isColored ? { color: palette.textColor } : {}}
                        >
                          🗑️
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

      {editingNote && (
        <div
          className="edit-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal()
            }
          }}
        >
          <section
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${editUid}-title`}
          >
            <div className="edit-modal-header">
              <div>
                <p className="dashboard-eyebrow">Edit note</p>
                <h2 id={`${editUid}-title`}>Update note</h2>
              </div>
              <button
                type="button"
                className="edit-modal-close"
                onClick={closeEditModal}
                title="Close edit dialog"
              >
                x
              </button>
            </div>

            <form className="dashboard-form edit-modal-form" onSubmit={handleEditSubmit}>
              <div className="note-type-tabs">
                <button
                  type="button"
                  className={`note-type-tab${editNoteType === 'text' ? ' note-type-tab--active' : ''}`}
                  onClick={() => setEditNoteType('text')}
                >
                  Text
                </button>
                <button
                  type="button"
                  className={`note-type-tab${editNoteType === 'todo' ? ' note-type-tab--active' : ''}`}
                  onClick={() => setEditNoteType('todo')}
                >
                  Checklist
                </button>
              </div>

              <label className="dashboard-field">
                <span>Title</span>
                <input
                  type="text"
                  placeholder={editNoteType === 'todo' ? 'Shopping list' : 'Weekly plan'}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </label>

              {editNoteType === 'text' ? (
                <label className="dashboard-field">
                  <span>Content</span>
                  <ReactQuill
                    theme="snow"
                    modules={quillModules}
                    value={editContent}
                    onChange={setEditContent}
                    placeholder="Add your note details here"
                  />
                </label>
              ) : (
                <div className="dashboard-field">
                  <span>Checklist items</span>
                  <div className="todo-editor">
                    {editTodoItems.map((item, index) => (
                      <div key={item.id} className="todo-editor-row">
                        <button
                          type="button"
                          className={`todo-check-btn${item.completed ? ' todo-check-btn--done' : ''}`}
                          onClick={() => toggleEditTodoItemForm(index)}
                          title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {item.completed ? 'v' : ''}
                        </button>
                        <input
                          id={`${editUid}-todo-${index}`}
                          type="text"
                          className={`todo-editor-input${item.completed ? ' todo-editor-input--done' : ''}`}
                          placeholder={`Item ${index + 1}`}
                          value={item.text}
                          onChange={(e) => updateEditTodoItem(index, e.target.value)}
                        />
                        {editTodoItems.length > 1 && (
                          <button
                            type="button"
                            className="todo-remove-btn"
                            onClick={() => removeEditTodoItem(index)}
                            title="Remove item"
                          >
                            x
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="todo-add-btn" onClick={addEditTodoItem}>
                      + Add item
                    </button>
                  </div>
                </div>
              )}

              <div className="dashboard-field">
                <span>Attach image <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></span>
                <ImageUploader value={editImageUrl} onChange={setEditImageUrl} />
              </div>

              <label className="dashboard-field">
                <span>Category / Tags</span>
                <input
                  type="text"
                  placeholder="work, personal, urgent"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </label>

              <div className="dashboard-field">
                <span>Note color</span>
                <div className="note-color-picker">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      className={`note-color-swatch${editNoteColor === c.id ? ' note-color-swatch--active' : ''}`}
                      style={{ background: c.id === 'default' ? 'var(--border)' : c.swatch }}
                      onClick={() => setEditNoteColor(c.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="dashboard-form-actions edit-modal-actions">
                <button type="submit" className="dashboard-button dashboard-button-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="dashboard-button dashboard-button-secondary"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default Dashboard
