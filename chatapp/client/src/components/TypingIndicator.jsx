export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-white dark:bg-ink-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-bubble flex items-center gap-1">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-mist-500 inline-block" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-mist-500 inline-block" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-mist-500 inline-block" />
      </div>
    </div>
  );
}
