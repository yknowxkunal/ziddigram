import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";

export default function Signup() {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const signup = useAuthStore((s) => s.signup);
  const error = useAuthStore((s) => s.error);
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await signup(form);
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
            Create your account
          </h1>
          <p className="text-mist-500 text-sm mt-1">Start chatting in real time</p>
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
          {[
            { key: "name", label: "Name", type: "text", placeholder: "Jordan Lee" },
            { key: "username", label: "Username", type: "text", placeholder: "jordan" },
            { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
            { key: "password", label: "Password", type: "password", placeholder: "At least 8 characters" },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-xs font-medium text-mist-500 mb-1 block">
                {field.label}
              </label>
              <input
                type={field.type}
                required
                minLength={field.key === "password" ? 8 : undefined}
                value={form[field.key]}
                onChange={update(field.key)}
                className="w-full rounded-xl border border-ink-700/10 dark:border-ink-700 bg-mist-100 dark:bg-ink-800 px-3 py-2.5 text-sm text-ink-950 dark:text-mist-100 outline-none focus:ring-2 focus:ring-signal"
                placeholder={field.placeholder}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-signal hover:bg-signal-dark text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-mist-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-signal font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
