import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const token = localStorage.getItem('token')
  const [notes, setNotes] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
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

      setNotes(data)
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
        body: JSON.stringify({ title, content }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create note')
      }

      setTitle('')
      setContent('')
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
        body: JSON.stringify({ title: nextTitle, content: nextContent }),
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

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
              <button type="submit" className="dashboard-button dashboard-button-primary">
                Add Note
              </button>
            </form>
          </div>

          <section className="dashboard-panel dashboard-notes-panel">
            <div className="dashboard-section-header">
              <h2>Your notes</h2>
              <p>{notes.length} saved note{notes.length === 1 ? '' : 's'}</p>
            </div>

            {loading ? (
              <div className="dashboard-state">
                <p>Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="dashboard-state">
                <p>You do not have any notes yet. Create your first note to get started.</p>
              </div>
            ) : (
              <div className="notes-grid">
                {notes.map((note) => (
                  <article key={note._id} className="note-card">
                    <div className="note-card-body">
                      <h2>{note.title}</h2>
                      <p>{note.content}</p>
                    </div>
                    <div className="note-card-actions">
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
