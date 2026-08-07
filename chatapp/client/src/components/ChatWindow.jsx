import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { getSocket } from "../sockets/socket";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ conversationId }) {
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const messagesByConversation = useChatStore((s) => s.messagesByConversation);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const bumpConversation = useChatStore((s) => s.bumpConversation);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);

  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);
  const hasScrolledInitially = useRef(false);

  const messages = messagesByConversation[conversationId] || [];
  const conversation = conversations.find((c) => c.id === conversationId);
  const otherUser = conversation?.otherUser;
  const isOtherTyping = typingUsers[conversationId]?.has(otherUser?._id?.toString());
  const isOtherOnline = onlineUserIds.has(otherUser?._id?.toString());

  // load history + join socket room on conversation switch
  useEffect(() => {
    if (!conversationId) return;
    hasScrolledInitially.current = false;
    loadMessages(conversationId).then(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
        hasScrolledInitially.current = true;
      });
    });

    const socket = getSocket();
    socket.emit("joinConversation", conversationId);
    return () => socket.emit("leaveConversation", conversationId);
  }, [conversationId]);

  // auto-scroll on new message (only if user is near the bottom)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasScrolledInitially.current) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // mark unread messages as read once viewed
  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    const unread = messages.filter(
      (m) => m.senderId?.toString() !== user?.id && m.status !== "read"
    );
    if (unread.length > 0) {
      getSocket().emit("messageRead", {
        conversationId,
        messageIds: unread.map((m) => m.id || m._id),
      });
    }
  }, [conversationId, messages.length]);

  const handleScroll = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 40 || loadingMore) return;
    if (messages.length === 0) return;
    setLoadingMore(true);
    const prevHeight = el.scrollHeight;
    const oldest = messages[0];
    await loadMessages(conversationId, oldest.createdAt);
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight - prevHeight;
    });
    setLoadingMore(false);
  }, [messages, conversationId, loadingMore]);

  function handleTextChange(e) {
    setText(e.target.value);
    const socket = getSocket();
    socket.emit("typing", { conversationId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { conversationId });
    }, 1200);
  }

  function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      conversationId,
      senderId: user.id,
      text: trimmed,
      status: "sent",
      createdAt: new Date().toISOString(),
    };
    addMessage(conversationId, optimisticMessage);
    bumpConversation(conversationId, {
      text: trimmed,
      senderId: user.id,
      createdAt: optimisticMessage.createdAt,
    });
    setText("");
    setShowEmoji(false);
    clearTimeout(typingTimeout.current);
    getSocket().emit("stopTyping", { conversationId });

    getSocket().emit("sendMessage", { conversationId, text: trimmed }, (res) => {
      // server ack confirms delivery; the optimistic bubble is replaced
      // naturally once the real "receiveMessage" event arrives for this room
      if (!res?.ok) {
        console.error("Message failed to send:", res?.error);
      }
    });
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-mist-500 text-sm">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-mist-300/30 dark:border-ink-700">
        <div className="h-9 w-9 rounded-full bg-signal/20 text-signal flex items-center justify-center font-semibold text-sm">
          {otherUser?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-950 dark:text-mist-100 font-display">
            {otherUser?.name}
          </p>
          <p className="text-xs text-mist-500">
            {isOtherTyping ? "typing…" : isOtherOnline ? "online" : "offline"}
          </p>
        </div>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-4 bg-mist-100 dark:bg-ink-950"
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id || m._id}
            message={m}
            isMine={(m.senderId?.toString?.() || m.senderId) === user.id}
          />
        ))}
        {isOtherTyping && <TypingIndicator />}
      </div>

      {/* composer */}
      <form
        onSubmit={handleSend}
        className="relative flex items-center gap-2 px-4 py-3 border-t border-mist-300/30 dark:border-ink-700 bg-white dark:bg-ink-900"
      >
        {showEmoji && (
          <div className="absolute bottom-16 left-4 z-10">
            <EmojiPicker
              onEmojiClick={(emojiData) => setText((t) => t + emojiData.emoji)}
              theme="auto"
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className="p-2 rounded-lg text-mist-500 hover:bg-mist-100 dark:hover:bg-ink-800"
          aria-label="Emoji picker"
        >
          <Smile size={18} />
        </button>
        <input
          value={text}
          onChange={handleTextChange}
          placeholder="Type a message"
          className="flex-1 rounded-xl bg-mist-100 dark:bg-ink-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal text-ink-950 dark:text-mist-100"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2.5 rounded-xl bg-signal hover:bg-signal-dark text-white disabled:opacity-40 transition-colors"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
