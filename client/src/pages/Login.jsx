import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login({ emailOrUsername, password });
    setSubmitting(false);
    if (ok) navigate("/chat");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mist-100 dark:bg-ink-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-signal text-white font-display font-bold text-lg mb-4">
            P
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-950 dark:text-mist-100">
            Welcome back
          </h1>
          <p className="text-mist-500 text-sm mt-1">Sign in to keep the conversation going</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-ink-900 rounded-2xl shadow-bubble p-6 space-y-4"
        >
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-mist-500 mb-1 block">
              Email or username
            </label>
            <input
              type="text"
              required
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full rounded-xl border border-ink-700/10 dark:border-ink-700 bg-mist-100 dark:bg-ink-800 px-3 py-2.5 text-sm text-ink-950 dark:text-mist-100 outline-none focus:ring-2 focus:ring-signal"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-mist-500 mb-1 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ink-700/10 dark:border-ink-700 bg-mist-100 dark:bg-ink-800 px-3 py-2.5 text-sm text-ink-950 dark:text-mist-100 outline-none focus:ring-2 focus:ring-signal"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-signal hover:bg-signal-dark text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-mist-500 mt-5">
          New here?{" "}
          <Link to="/signup" className="text-signal font-medium">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
