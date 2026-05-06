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

const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"].filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
