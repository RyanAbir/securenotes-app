const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");

const router = express.Router();

const { registerUser, loginUser } = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");

const strongPasswordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
});

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
    body("password")
      .matches(strongPasswordRule)
      .withMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number"
      ),
  ],
  validateRequest,
  registerUser
);

router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  loginUser
);

module.exports = router;
