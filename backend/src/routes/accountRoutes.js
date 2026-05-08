const express = require("express");
const { body } = require("express-validator");

const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  getAccount,
  updateAccount,
  changePassword,
  deleteAccount,
} = require("../controllers/accountController");

const router = express.Router();

const strongPasswordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

router.get("/me", protect, getAccount);

router.put(
  "/profile",
  protect,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  ],
  validateRequest,
  updateAccount
);

router.put(
  "/password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .matches(strongPasswordRule)
      .withMessage(
        "New password must be at least 8 characters and include uppercase, lowercase, and a number"
      ),
  ],
  validateRequest,
  changePassword
);

router.delete("/me", protect, deleteAccount);

module.exports = router;
