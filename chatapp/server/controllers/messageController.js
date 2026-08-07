const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

// GET /api/conversations - list current user's conversations, sorted by latest activity
async function listConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "name username avatarUrl isOnline lastSeen");

    const shaped = conversations.map((c) => {
      const otherUser = c.participants.find(
        (p) => p._id.toString() !== req.userId
      );
      return {
        id: c._id,
        otherUser,
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCounts?.get(req.userId) || 0,
        updatedAt: c.updatedAt,
      };
    });

    res.json({ conversations: shaped });
  } catch (err) {
    next(err);
  }
}

// POST /api/conversations - start (or fetch existing) 1:1 conversation with another user
async function startConversation(req, res, next) {
  try {
    const { userId: otherUserId } = req.body;
    if (!otherUserId || otherUserId === req.userId) {
      return res.status(400).json({ message: "Invalid target user" });
    }

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) return res.status(404).json({ message: "User not found" });

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, otherUserId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userId, otherUserId],
      });
    }

    res.status(201).json({ conversationId: conversation._id });
  } catch (err) {
    next(err);
  }
}

// GET /api/conversations/:id/messages?before=<ISO date>&limit=30 - paginated history
async function getMessages(req, res, next) {
  try {
    const { id } = req.params;
    const { before, limit = 30 } = req.query;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.userId,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const query = { conversationId: id };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100));

    res.json({ messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
}

// POST /api/conversations/:id/read - mark all messages as read (REST fallback; socket handles live case)
async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    await Message.updateMany(
      { conversationId: id, senderId: { $ne: req.userId }, status: { $ne: "read" } },
      { $set: { status: "read" } }
    );
    const conversation = await Conversation.findById(id);
    if (conversation) {
      conversation.unreadCounts.set(req.userId, 0);
      await conversation.save();
    }
    res.json({ message: "Marked as read" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listConversations,
  startConversation,
  getMessages,
  markRead,
};
