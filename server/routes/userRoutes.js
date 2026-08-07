const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  searchUsers,
  getProfile,
  updateProfile,
} = require("../controllers/userController");

const router = express.Router();

router.use(requireAuth);

router.get("/search", searchUsers);
router.get("/:id", getProfile);
router.patch("/me", updateProfile);

module.exports = router;
