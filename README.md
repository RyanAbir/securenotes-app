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
JWT_SECRET=your_jwt_secret
```

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

## Author

Ryan Abir
