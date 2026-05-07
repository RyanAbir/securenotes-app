const fallbackApiUrl = "https://securenotes-backend-jcor.onrender.com";

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (rawApiUrl && rawApiUrl.length > 0
  ? rawApiUrl
  : fallbackApiUrl
).replace(/\/+$/, "");

