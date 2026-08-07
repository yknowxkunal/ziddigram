import { useEffect, useState } from "react";
import { useChatStore } from "../store/chatStore";
import { useSocket } from "../hooks/useSocket";
import Sidebar from "../components/Sidebar";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";

export default function Chat() {
  useSocket();
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [activeId, setActiveId] = useState(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const loadConversations = useChatStore((s) => s.loadConversations);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  function selectConversation(id) {
    setActiveId(id);
    setShowChatOnMobile(true);
  }

  return (
    <div className="h-screen flex bg-mist-100 dark:bg-ink-950">
      {/* left column: sidebar + chat list */}
      <div
        className={`w-full sm:w-[340px] shrink-0 border-r border-mist-300/30 dark:border-ink-700 bg-white dark:bg-ink-900 flex flex-col ${
          showChatOnMobile ? "hidden sm:flex" : "flex"
        }`}
      >
        <Sidebar darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} onSelectResult={selectConversation} />
        <ChatList activeId={activeId} onSelect={selectConversation} />
      </div>

      {/* right column: active chat */}
      <div className={`flex-1 flex-col ${showChatOnMobile ? "flex" : "hidden sm:flex"}`}>
        {showChatOnMobile && (
          <button
            onClick={() => setShowChatOnMobile(false)}
            className="sm:hidden px-4 py-2 text-xs text-signal font-medium text-left"
          >
            ← Back
          </button>
        )}
        <ChatWindow conversationId={activeId} />
      </div>
    </div>
  );
}
