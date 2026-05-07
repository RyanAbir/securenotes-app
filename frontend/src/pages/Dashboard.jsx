import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import AppState from '../components/AppState'
import { API_URL } from '../config/api'
import { clearAuthSession, getStoredAuthUser, getStoredToken } from '../utils/auth'

const parseTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

const formatTags = (tags = []) => tags.join(', ')

function Dashboard() {
  const token = getStoredToken()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [notesError, setNotesError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const navigate = useNavigate()

  const authUser = getStoredAuthUser()
  const userLabel = authUser?.name || authUser?.email || 'Signed in user'

  const fetchNotes = async () => {
    if (!token) {
      return
    }

    setLoading(true)
    setNotesError('')

    try {
      const response = await fetch(
        `${API_URL}/api/notes`,
        {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notes')
      }

      setNotes(Array.isArray(data) ? data : [])
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

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const response = await fetch(
        `${API_URL}/api/notes`,
        {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, tags: parseTags(tags) }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create note')
      }

      setTitle('')
      setContent('')
      setTags('')
      setNotes((currentNotes) => [data, ...currentNotes])
      toast.success('Note created')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this note?')

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notes/${id}`,
        {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete note')
      }

      setNotes((currentNotes) => currentNotes.filter((note) => note._id !== id))
      toast.success('Note deleted')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleEdit = async (note) => {
    const nextTitle = window.prompt('Enter new title', note.title)

    if (nextTitle === null) {
      return
    }

    const nextContent = window.prompt('Enter new content', note.content)

    if (nextContent === null) {
      return
    }

    const nextTags = window.prompt(
      'Enter tags as comma-separated values',
      formatTags(note.tags || [])
    )

    if (nextTags === null) {
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notes/${note._id}`,
        {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: nextTitle,
          content: nextContent,
          tags: parseTags(nextTags),
          pinned: Boolean(note.pinned),
        }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update note')
      }

      setNotes((currentNotes) =>
        currentNotes.map((currentNote) =>
          currentNote._id === note._id ? data : currentNote
        )
      )
      toast.success('Note updated')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleTogglePinned = async (note) => {
    try {
      const response = await fetch(
        `${API_URL}/api/notes/${note._id}`,
        {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          tags: Array.isArray(note.tags) ? note.tags : [],
          pinned: !note.pinned,
        }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update pinned status')
      }

      setNotes((currentNotes) =>
        currentNotes.map((currentNote) =>
          currentNote._id === note._id ? data : currentNote
        )
      )
      toast.success(note.pinned ? 'Note unpinned' : 'Note pinned')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const availableTags = Array.from(
    new Set(
      notes.flatMap((note) =>
        Array.isArray(note.tags) ? note.tags.filter(Boolean) : []
      )
    )
  ).sort((left, right) => left.localeCompare(right))

  const visibleNotes = [...notes]
    .filter((note) => {
    const query = searchTerm.trim().toLowerCase()

      const matchesTag =
        selectedTag === 'all' ||
        (Array.isArray(note.tags) && note.tags.includes(selectedTag))

      if (!matchesTag) {
        return false
      }

      if (!query) {
        return true
      }

      const titleText = (note.title || '').toLowerCase()
      const contentText = (note.content || '').toLowerCase()

      return titleText.includes(query) || contentText.includes(query)
    })
    .sort((left, right) => {
      const leftCreatedAt = new Date(left.createdAt || 0).getTime()
      const rightCreatedAt = new Date(right.createdAt || 0).getTime()

      if (sortOrder === 'oldest') {
        return leftCreatedAt - rightCreatedAt
      }

      return rightCreatedAt - leftCreatedAt
    })

  const hasActiveFilters = Boolean(searchTerm.trim()) || selectedTag !== 'all'

  return (
    <div className="dashboard-page">
      <header className="dashboard-nav">
        <div>
          <p className="dashboard-brand">SecureNotes</p>
          <p className="dashboard-tagline">Signed in as {userLabel}</p>
        </div>
        <button
          type="button"
          className="dashboard-button dashboard-button-secondary"
          onClick={handleLogout}
        >
          Logout
        </button>
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
          <div className="dashboard-panel dashboard-form-panel">
            <div className="dashboard-section-header">
              <h2>Create a note</h2>
              <p>Write something important and keep it organized.</p>
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
                <textarea
                  placeholder="Add your note details here"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  required
                  rows="6"
                />
              </label>
              <label className="dashboard-field">
                <span>Tags</span>
                <input
                  type="text"
                  placeholder="work, personal, urgent"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>
              <button type="submit" className="dashboard-button dashboard-button-primary">
                Add Note
              </button>
            </form>
          </div>

          <section className="dashboard-panel dashboard-notes-panel">
            <div className="dashboard-section-header">
              <h2>Your notes</h2>
              <p>{visibleNotes.length} visible note{visibleNotes.length === 1 ? '' : 's'}</p>
            </div>

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
                  <span>Filter by tag</span>
                  <select
                    value={selectedTag}
                    onChange={(event) => setSelectedTag(event.target.value)}
                  >
                    <option value="all">All tags</option>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>

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
                title={hasActiveFilters ? 'No notes match your filters' : 'No matching notes'}
                description={
                  hasActiveFilters
                    ? 'Try a different search term or tag filter to see more notes.'
                    : 'Try a different search term or clear the search to see all notes.'
                }
              />
            ) : (
              <div className="notes-grid">
                {visibleNotes.map((note) => (
                  <article key={note._id} className="note-card">
                    <div className="note-card-body">
                      <div className="note-card-header">
                        <h2>{note.title}</h2>
                        {note.pinned ? <span className="note-badge">Pinned</span> : null}
                      </div>
                      <p>{note.content}</p>
                      {Array.isArray(note.tags) && note.tags.length > 0 ? (
                        <div className="note-tags">
                          {note.tags.map((tag) => (
                            <span key={`${note._id}-${tag}`} className="note-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="note-card-actions">
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
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
