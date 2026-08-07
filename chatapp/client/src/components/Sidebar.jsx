import { useState, useEffect } from "react";
import { Search, Moon, Sun, LogOut } from "lucide-react";
import api from "../utils/api";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";

export default function Sidebar({ darkMode, onToggleDark, onSelectResult }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const startConversation = useChatStore((s) => s.startConversation);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await api.get("/users/search", { params: { q: query } });
      setResults(data.users);
    }, 300); // debounce
    return () => clearTimeout(timeout);
  }, [query]);

  async function handlePick(otherUserId) {
    const conversationId = await startConversation(otherUserId);
    setQuery("");
    setResults([]);
    onSelectResult(conversationId);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-signal flex items-center justify-center text-white font-display font-bold">
            {user?.name?.[0]?.toUpperCase() || "P"}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-950 dark:text-mist-100 font-display">
              {user?.name}
            </p>
            <p className="text-xs text-mist-500">@{user?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-mist-500 hover:bg-mist-100 dark:hover:bg-ink-800"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-mist-500 hover:bg-mist-100 dark:hover:bg-ink-800"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 relative">
        <Search size={15} className="absolute left-7 top-2.5 text-mist-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find people to message"
          className="w-full rounded-xl bg-mist-100 dark:bg-ink-800 pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-signal text-ink-950 dark:text-mist-100"
        />
        {results.length > 0 && (
          <div className="absolute left-4 right-4 mt-1 bg-white dark:bg-ink-800 rounded-xl shadow-bubble overflow-hidden z-10 max-h-64 overflow-y-auto">
            {results.map((u) => (
              <button
                key={u._id}
                onClick={() => handlePick(u._id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-mist-100 dark:hover:bg-ink-700 text-left"
              >
                <div className="h-8 w-8 rounded-full bg-signal/20 text-signal flex items-center justify-center text-xs font-semibold">
                  {u.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-950 dark:text-mist-100">{u.name}</p>
                  <p className="text-xs text-mist-500">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
