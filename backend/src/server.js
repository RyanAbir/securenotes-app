const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const accountRoutes = require("./routes/accountRoutes");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const protect = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();

connectDB();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://securenotes-app.vercel.app",
  "http://localhost:5173",
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/+$/, ""));

app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      const normalizedOrigin = origin?.replace(/\/+$/, "");

      if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed");
      error.status = 403;
      return callback(error);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "SecureNotes API running" });
});

app.use("/api/auth", authRoutes); // 🔥 THIS LINE
app.use("/api/account", accountRoutes);
app.use("/api/notes", noteRoutes);

app.get("/api/protected", protect, (req, res) => {
  res.json({
    success: true,
    message: "Protected route working",
    data: { userId: req.user },
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
