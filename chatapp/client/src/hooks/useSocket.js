import { useEffect } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../sockets/socket";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";

export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const addMessage = useChatStore((s) => s.addMessage);
  const bumpConversation = useChatStore((s) => s.bumpConversation);
  const setTyping = useChatStore((s) => s.setTyping);
  const setUserOnline = useChatStore((s) => s.setUserOnline);
  const updateMessageStatuses = useChatStore((s) => s.updateMessageStatuses);
  const loadConversations = useChatStore((s) => s.loadConversations);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();

    socket.on("receiveMessage", (message) => {
      addMessage(message.conversationId, message);
      bumpConversation(message.conversationId, {
        text: message.text,
        senderId: message.senderId,
        createdAt: message.createdAt,
      });
    });

    socket.on("inboxUpdate", () => {
      loadConversations();
    });

    socket.on("typing", ({ conversationId, userId }) => {
      setTyping(conversationId, userId, true);
    });

    socket.on("stopTyping", ({ conversationId, userId }) => {
      setTyping(conversationId, userId, false);
    });

    socket.on("messageRead", ({ conversationId, messageIds }) => {
      updateMessageStatuses(conversationId, messageIds, "read");
    });

    socket.on("userOnline", ({ userId }) => setUserOnline(userId, true));
    socket.on("userOffline", ({ userId }) => setUserOnline(userId, false));

    return () => {
      socket.off("receiveMessage");
      socket.off("inboxUpdate");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messageRead");
      socket.off("userOnline");
      socket.off("userOffline");
      disconnectSocket();
    };
  }, [user]);

  return getSocket();
}
