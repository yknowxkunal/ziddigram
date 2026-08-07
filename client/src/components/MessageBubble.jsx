import { motion } from "framer-motion";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({ message, isMine }) {
  const time = format(new Date(message.createdAt), "h:mm a");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-3.5 py-2 shadow-bubble text-sm leading-relaxed ${
          isMine
            ? "bg-signal text-white rounded-br-sm"
            : "bg-white dark:bg-ink-800 text-ink-950 dark:text-mist-100 rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <div
          className={`flex items-center gap-1 mt-1 justify-end text-[10px] ${
            isMine ? "text-white/70" : "text-mist-500"
          }`}
        >
          <span>{time}</span>
          {isMine && (
            <>
              {message.status === "read" ? (
                <CheckCheck size={13} className="text-sky-300" />
              ) : message.status === "delivered" ? (
                <CheckCheck size={13} />
              ) : (
                <Check size={13} />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
