const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  listConversations,
  startConversation,
  getMessages,
  markRead,
} = require("../controllers/messageController");

const router = express.Router();

router.use(requireAuth);

router.get("/", listConversations);
router.post("/", startConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/read", markRead);

module.exports = router;
