const express = require("express");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const {
  signup,
  login,
  refresh,
  logout,
  me,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Prevent brute-force attacks on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

router.post(
  "/signup",
  authLimiter,
  [
    body("name").trim().isLength({ min: 1, max: 60 }).withMessage("Name is required"),
    body("username")
      .trim()
      .isLength({ min: 3, max: 24 })
      .matches(/^[a-zA-Z0-9_.]+$/)
      .withMessage("Username must be 3-24 chars, letters/numbers/underscore/dot only"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  signup
);

router.post(
  "/login",
  authLimiter,
  [
    body("emailOrUsername").trim().notEmpty().withMessage("Email or username required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validate,
  login
);

router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

module.exports = router;
