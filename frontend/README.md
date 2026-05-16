# SecureNotes Frontend

React/Vite client for SecureNotes.

## Setup

```bash
npm install
echo VITE_API_URL=http://localhost:5000 > .env
npm run dev
```

## Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` creates a production build.
- `npm run preview` previews the production build locally.
- `npm run lint` runs ESLint.

## Environment

```env
VITE_API_URL=http://localhost:5000
RENDER_BACKEND_URL=https://your-render-service.onrender.com
```

`VITE_API_URL` should point to the SecureNotes backend API.
