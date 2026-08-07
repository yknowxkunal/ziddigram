import { create } from "zustand";
import api from "../utils/api";

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {}, // { [conversationId]: Message[] }
  typingUsers: {}, // { [conversationId]: Set(userId) }
  onlineUserIds: new Set(),

  async loadConversations() {
    const { data } = await api.get("/conversations");
    set({ conversations: data.conversations });
  },

  setActiveConversation(id) {
    set({ activeConversationId: id });
  },

  async loadMessages(conversationId, before) {
    const params = before ? { before } : {};
    const { data } = await api.get(`/conversations/${conversationId}/messages`, {
      params,
    });
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: before
          ? [...data.messages, ...(state.messagesByConversation[conversationId] || [])]
          : data.messages,
      },
    }));
    return data.messages;
  },

  addMessage(conversationId, message) {
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      if (existing.some((m) => m.id === message.id || m._id === message.id)) {
        return {};
      }
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...existing, message],
        },
      };
    });
  },

  updateMessageStatuses(conversationId, messageIds, status) {
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: existing.map((m) =>
            messageIds.includes(m.id || m._id) ? { ...m, status } : m
          ),
        },
      };
    });
  },

  bumpConversation(conversationId, lastMessage) {
    set((state) => {
      const idx = state.conversations.findIndex((c) => c.id === conversationId);
      if (idx === -1) return {};
      const updated = [...state.conversations];
      const [convo] = updated.splice(idx, 1);
      updated.unshift({ ...convo, lastMessage, updatedAt: new Date().toISOString() });
      return { conversations: updated };
    });
  },

  setTyping(conversationId, userId, isTyping) {
    set((state) => {
      const set_ = new Set(state.typingUsers[conversationId] || []);
      if (isTyping) set_.add(userId);
      else set_.delete(userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: set_ },
      };
    });
  },

  setUserOnline(userId, isOnline) {
    set((state) => {
      const next = new Set(state.onlineUserIds);
      if (isOnline) next.add(userId);
      else next.delete(userId);
      return { onlineUserIds: next };
    });
  },

  async startConversation(userId) {
    const { data } = await api.post("/conversations", { userId });
    await get().loadConversations();
    return data.conversationId;
  },
}));
