# SecureNotes

SecureNotes is a full-stack MERN notes app with user authentication, JWT-protected routes, and user-specific CRUD notes.

## Features

- Register and login
- JWT authentication
- Protected dashboard
- Create notes
- Edit notes
- Delete notes
- User-specific notes
- Tag filtering, note sorting, favorites
- Session expiry handling with auto logout

## Tech Stack

- React + Vite
- Node.js + Express
- MongoDB Atlas
- JWT + bcryptjs
- Render
- Vercel

## Live Demo

- Frontend: [Add your Vercel frontend link here](https://vercel.com/)
- Backend: [https://securenotes-backend-jcor.onrender.com](https://securenotes-backend-jcor.onrender.com)

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/notes`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

## Local Setup

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_characters
FRONTEND_URL=http://localhost:5173
PORT=5000
```

Security notes:
- Use a long random `JWT_SECRET` in production.
- Do not reuse development secrets in Render or other deployed environments.
- `FRONTEND_URL` should match the deployed frontend origin exactly.

Start the backend:

```bash
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file in `frontend/` with:

```env
VITE_API_URL=http://localhost:5000
```

Production environment notes:
- Render backend should define:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `FRONTEND_URL`
- Vercel frontend should define:
  - `VITE_API_URL`

## Author

Ryan Abir
