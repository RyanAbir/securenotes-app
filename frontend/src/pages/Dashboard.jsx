import { useEffect, useState } from 'react'

function Dashboard() {
  const token = localStorage.getItem('token')
  const [notes, setNotes] = useState([])
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const fetchNotes = async () => {
    if (!token) {
      return
    }

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
    window.location.reload()
  }

  if (!token) {
    return <p>Please login</p>
  }

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '24px' }}>
      <h1>Dashboard</h1>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>
      {message ? <p>{message}</p> : null}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginTop: '20px',
        }}
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          rows="4"
        />
        <button type="submit">Add Note</button>
      </form>
      <ul style={{ padding: 0, listStyle: 'none' }}>
        {notes.map((note) => (
          <li
            key={note._id}
            style={{ border: '1px solid #ccc', marginTop: '12px', padding: '12px' }}
          >
            <h2 style={{ margin: '0 0 8px' }}>{note.title}</h2>
            <p style={{ margin: 0 }}>{note.content}</p>
            <button
              type="button"
              onClick={() => handleEdit(note)}
              style={{ marginTop: '12px', marginRight: '8px' }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDelete(note._id)}
              style={{ marginTop: '12px' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Dashboard
