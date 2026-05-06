require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const protect = require("./middleware/authMiddleware");

const app = express();

connectDB();

const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"].filter(
  Boolean
);

app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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
  res.send("SecureNotes API running");
});

app.use("/api/auth", authRoutes); // 🔥 THIS LINE
app.use("/api/notes", noteRoutes);

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route working",
    userId: req.user,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
