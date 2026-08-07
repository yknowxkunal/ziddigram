const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// userId -> Set of connected socket ids (a user can have multiple tabs/devices)
const onlineUsers = new Map();

function addOnlineSocket(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeOnlineSocket(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return true; // user fully disconnected (no more tabs)
  }
  return false;
}

function initSocket(io) {
  // Auth middleware: verify JWT (from cookie or handshake auth) before accepting connection
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.accessToken;
      }

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    addOnlineSocket(userId, socket.id);

    // Mark user online + notify their conversation partners
    await User.findByIdAndUpdate(userId, { isOnline: true });
    const conversations = await Conversation.find({ participants: userId });
    conversations.forEach((c) => {
      c.participants.forEach((p) => {
        if (p.toString() !== userId) {
          io.to(`user:${p.toString()}`).emit("userOnline", { userId });
        }
      });
    });

    // Personal room for direct notifications regardless of which conversation is open
    socket.join(`user:${userId}`);

    // --- joinConversation: enter a chat room to receive its live events ---
    socket.on("joinConversation", async (conversationId) => {
      const convo = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });
      if (!convo) return;
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leaveConversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // --- sendMessage ---
    socket.on("sendMessage", async ({ conversationId, text }, ack) => {
      try {
        if (!text || !text.trim()) return;

        const convo = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });
        if (!convo) return;

        const message = await Message.create({
          conversationId,
          senderId: userId,
          text: text.trim(),
          status: "sent",
        });

        convo.lastMessage = {
          text: message.text,
          senderId: userId,
          createdAt: message.createdAt,
        };

        // bump unread count for the other participant(s)
        convo.participants.forEach((p) => {
          const pid = p.toString();
          if (pid !== userId) {
            const current = convo.unreadCounts.get(pid) || 0;
            convo.unreadCounts.set(pid, current + 1);
          }
        });
        await convo.save();

        const payload = {
          id: message._id,
          conversationId,
          senderId: userId,
          text: message.text,
          status: message.status,
          createdAt: message.createdAt,
        };

        // deliver to everyone in the room (including sender's other tabs)
        io.to(`conversation:${conversationId}`).emit("receiveMessage", payload);

        // if recipient isn't in the room but is online elsewhere, still notify their inbox
        convo.participants.forEach((p) => {
          const pid = p.toString();
          if (pid !== userId) {
            io.to(`user:${pid}`).emit("inboxUpdate", {
              conversationId,
              lastMessage: convo.lastMessage,
            });
            if (onlineUsers.has(pid)) {
              message.status = "delivered";
            }
          }
        });
        if (message.status === "delivered") await message.save();

        if (typeof ack === "function") ack({ ok: true, message: payload });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    // --- typing indicators ---
    socket.on("typing", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        userId,
      });
    });

    socket.on("stopTyping", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("stopTyping", {
        conversationId,
        userId,
      });
    });

    // --- read receipts ---
    socket.on("messageRead", async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, conversationId },
          { $set: { status: "read" } }
        );
        const convo = await Conversation.findById(conversationId);
        if (convo) {
          convo.unreadCounts.set(userId, 0);
          await convo.save();
        }
        io.to(`conversation:${conversationId}`).emit("messageRead", {
          conversationId,
          messageIds,
          readBy: userId,
        });
      } catch (err) {
        console.error("messageRead error:", err.message);
      }
    });

    // --- disconnect ---
    socket.on("disconnect", async () => {
      const fullyOffline = removeOnlineSocket(userId, socket.id);
      if (fullyOffline) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });

        const convos = await Conversation.find({ participants: userId });
        convos.forEach((c) => {
          c.participants.forEach((p) => {
            if (p.toString() !== userId) {
              io.to(`user:${p.toString()}`).emit("userOffline", {
                userId,
                lastSeen,
              });
            }
          });
        });
      }
    });
  });
}

module.exports = { initSocket };
