import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const parseTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

const formatTags = (tags = []) => tags.join(', ')

function Dashboard() {
  const token = localStorage.getItem('token')
  const [notes, setNotes] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const navigate = useNavigate()

  const fetchNotes = async () => {
    if (!token) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'https://securenotes-backend-jcor.onrender.com/api/notes',
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
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const response = await fetch(
        'https://securenotes-backend-jcor.onrender.com/api/notes',
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
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this note?')

    if (!confirmed) {
      return
    }

    setMessage('')

    try {
      const response = await fetch(
        `https://securenotes-backend-jcor.onrender.com/api/notes/${id}`,
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
    } catch (error) {
      setMessage(error.message)
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

    setMessage('')

    try {
      const response = await fetch(
        `https://securenotes-backend-jcor.onrender.com/api/notes/${note._id}`,
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
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleTogglePinned = async (note) => {
    setMessage('')

    try {
      const response = await fetch(
        `https://securenotes-backend-jcor.onrender.com/api/notes/${note._id}`,
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
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  const filteredNotes = notes.filter((note) => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return true
    }

    const titleText = (note.title || '').toLowerCase()
    const contentText = (note.content || '').toLowerCase()

    return titleText.includes(query) || contentText.includes(query)
  })

  return (
    <div className="dashboard-page">
      <header className="dashboard-nav">
        <div>
          <p className="dashboard-brand">SecureNotes</p>
          <p className="dashboard-tagline">Private notes, available only after sign in.</p>
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

        {message ? <p className="dashboard-message">{message}</p> : null}

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
              <p>{filteredNotes.length} visible note{filteredNotes.length === 1 ? '' : 's'}</p>
            </div>

            <label className="dashboard-field dashboard-search">
              <span>Search notes</span>
              <input
                type="search"
                placeholder="Search by title or content"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            {loading ? (
              <div className="dashboard-state">
                <p>Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="dashboard-state">
                <p>You do not have any notes yet. Create your first note to get started.</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="dashboard-state">
                <p>No notes match your current search.</p>
              </div>
            ) : (
              <div className="notes-grid">
                {filteredNotes.map((note) => (
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
