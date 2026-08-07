import { formatDistanceToNowStrict } from "date-fns";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";

export default function ChatList({ activeId, onSelect }) {
  const conversations = useChatStore((s) => s.conversations);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const user = useAuthStore((s) => s.user);

  if (conversations.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-mist-500">
        No conversations yet. Search for someone to start chatting.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((c) => {
        const isOnline = onlineUserIds.has(c.otherUser?._id?.toString());
        const isMine = c.lastMessage?.senderId?.toString() === user?.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              activeId === c.id
                ? "bg-signal/10"
                : "hover:bg-mist-100 dark:hover:bg-ink-800"
            }`}
          >
            <div className="relative shrink-0">
              <div className="h-11 w-11 rounded-full bg-signal/20 text-signal flex items-center justify-center font-semibold">
                {c.otherUser?.name?.[0]?.toUpperCase() || "?"}
              </div>
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-ink-900" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-950 dark:text-mist-100 truncate">
                  {c.otherUser?.name}
                </p>
                {c.lastMessage?.createdAt && (
                  <span className="text-[11px] text-mist-500 shrink-0 ml-2">
                    {formatDistanceToNowStrict(new Date(c.lastMessage.createdAt))}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-mist-500 truncate">
                  {isMine && c.lastMessage?.text ? "You: " : ""}
                  {c.lastMessage?.text || "Say hello 👋"}
                </p>
                {c.unreadCount > 0 && (
                  <span className="ml-2 shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-signal text-white text-[11px] flex items-center justify-center font-medium">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
