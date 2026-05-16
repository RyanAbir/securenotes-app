# SecureNotes

SecureNotes is a full-stack note-taking app built with React, Node.js, Express, and MongoDB. It supports rich text notes, checklist notes, image attachments, color organization, search, filters, and authenticated private note storage.

The project is structured as a MERN application with a Vite frontend and an Express API backend.

## Features

- User registration and login with JWT authentication
- Rich text notes with headings, lists, and code blocks
- Checklist notes with interactive todo items and progress tracking
- Image notes with drag-and-drop image upload support
- Colorful note cards and tag-based organization
- Modal note editing that keeps the dashboard position intact
- Search across titles, content, tags, and checklist items
- Filters for favorites, note type, image notes, and categories
- Pin and favorite actions for note management
- Responsive layout optimized for mobile and desktop screens

## Tech Stack

- Frontend: React, Vite, React Router, React Quill, DOMPurify, CSS
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Authentication: JWT, bcryptjs
- Deployment-ready config: Render backend URL support and Vite environment variables

## Repository Structure

```text
securenotes-app/
  backend/      Express API, MongoDB models, auth and note routes
  frontend/     React/Vite client application
  .env.example  Example environment variables
```

## Screenshots

No production screenshots are included yet. Add real screenshots of the dashboard, mobile layout, and edit modal when available.

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB Atlas connection string or a local MongoDB instance

## Environment Setup

Create environment files before running the app locally.

Root example:

```env
# Backend
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/securenotes
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/securenotes
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:5000

# Deployment
RENDER_BACKEND_URL=https://your-render-service.onrender.com
```

Backend:

```bash
cd backend
cp ../.env.example .env
```

Frontend:

```bash
cd frontend
echo VITE_API_URL=http://localhost:5000 > .env
```

Note: the current backend reads `MONGO_URI`. `MONGODB_URI` is included in the examples for clarity and compatibility with common MongoDB naming conventions.

## Local Development

Install backend dependencies:

```bash
cd backend
npm install
```

Start the backend API:

```bash
npm start
```

In a second terminal, install frontend dependencies:

```bash
cd frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:5173
```

The frontend expects the API at `VITE_API_URL`, which defaults to the configured production backend if no local value is provided.

## Build

Build the frontend:

```bash
cd frontend
npm run build
```

## API Overview

The backend exposes authenticated routes for account access and note management:

- Auth: register and login
- Notes: create, read, update, delete, pin, favorite, checklist updates
- Account: profile-related account operations

## Author

Ryan Abir

- GitHub: [@RyanAbir](https://github.com/RyanAbir)
