import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Check } from "lucide-react";
import { api, ApiError } from "../lib/api";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/api/newsletter/subscribe", { email: email.trim() });
      setDone(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "couldn't subscribe — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl glass border border-(--color-border) p-8 sm:p-10 text-center max-w-2xl mx-auto">
      <Mail className="mx-auto text-(--color-accent)" size={22} />
      <h3 className="font-display font-bold text-2xl mt-3 lowercase">stay in the loop</h3>
      <p className="text-sm text-(--color-muted) mt-1.5">New drops, deals and stories — no spam, ever.</p>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-(--color-good)"
          >
            <Check size={16} /> you're subscribed
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} className="mt-5 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-(--color-accent) text-[#1a1712] font-semibold px-6 py-2.5 text-sm shadow-[0_8px_24px_-6px_var(--color-accent)] hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            >
              subscribe
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {error && <p className="text-xs text-(--color-danger) mt-2">{error}</p>}
    </section>
  );
}
