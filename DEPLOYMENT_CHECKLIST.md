# SecureNotes Deployment Checklist

This document outlines the necessary steps to deploy SecureNotes to a production environment.

## 1. Environment Variables

### Backend (`.env`)
- `PORT`: (e.g., 5000)
- `MONGO_URI`: MongoDB connection string. Ensure IP allowlists are configured correctly in MongoDB Atlas.
- `JWT_SECRET`: A strong, randomly generated string. **Do not use the development secret.**
- `FRONTEND_URL`: The URL of the deployed frontend (e.g., `https://your-frontend.vercel.app`).

### Frontend (`.env`)
- `VITE_API_URL`: The URL of the deployed backend API (e.g., `https://your-backend.herokuapp.com`).

## 2. CORS Configuration
Ensure that the backend `server.js` restricts CORS specifically to your production `FRONTEND_URL`. Verify that `allowedOrigins` includes your domain without trailing slashes.

## 3. Database Preparation
- **Indexes:** Ensure your MongoDB collections have appropriate indexes (e.g., on `email` for users, `user` for notes).
- **Seed Data:** Run `node src/scripts/seed.js` if you are deploying to a staging environment and need dummy data. Do not run this on a production database unless you explicitly want the test user.

## 4. Build and Start
- **Frontend Build:** Run `npm run build` in the `frontend` directory. Deploy the `dist/` folder to your static hosting provider (Vercel, Netlify, etc.).
- **Backend Start:** Ensure the host runs `npm start` (which executes `node src/server.js`).

## 5. Security & Rate Limiting
- The backend uses `helmet` for security headers.
- The `express-rate-limit` is configured for auth routes to prevent brute force attacks. Ensure your host supports identifying client IP correctly (e.g., `app.set('trust proxy', 1)` might be needed on Heroku/Render).
