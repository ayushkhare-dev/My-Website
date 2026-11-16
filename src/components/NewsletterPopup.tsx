import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Check } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { setMarketingPopupOpen } from "../lib/popupCoordinator";

const SEEN_KEY = "nextgenify.inner-circle-popup.v1";
const DELAY_MS = 14000;

export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => {
      if (!sessionStorage.getItem(SEEN_KEY)) {
        setOpen(true);
        setMarketingPopupOpen(true);
      }
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function close() {
    sessionStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
    setMarketingPopupOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/api/newsletter/subscribe", { email: email.trim() });
      setDone(true);
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "couldn't subscribe — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="dark relative bg-(--color-canvas) text-white rounded-[28px] overflow-hidden max-w-lg w-full border border-white/10"
          >
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--color-accent)_45%,transparent),transparent_55%)]" />
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="relative px-8 sm:px-12 py-14 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--color-accent)">Members only</p>

              {done ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                  <Check size={28} className="mx-auto text-(--color-good)" />
                  <h3 className="font-display font-extrabold text-2xl mt-4">You're in.</h3>
                  <p className="text-white/50 text-sm mt-2">Welcome to the inner circle — first drop lands in your inbox.</p>
                  <button onClick={close} className="mt-7 text-sm font-semibold text-white/60 hover:text-white underline">
                    Continue browsing
                  </button>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl mt-4 leading-[1.05] tracking-[-0.01em]">
                    Enter the
                    <br />
                    Inner Circle
                  </h2>
                  <p className="text-white/50 text-sm mt-4 max-w-sm mx-auto leading-relaxed">
                    Early access to limited drops, private pricing, and the stories behind what we make. No spam — ever.
                  </p>
                  <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-2.5 max-w-xs mx-auto">
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-center outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) placeholder:text-white/30"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-full bg-white text-(--color-ink) font-semibold px-6 py-3 text-sm hover:bg-(--color-accent) hover:text-white transition-colors disabled:opacity-50"
                    >
                      {busy ? "Joining…" : "Join now"}
                    </button>
                  </form>
                  {error && <p className="text-xs text-(--color-danger) mt-2">{error}</p>}
                  <button onClick={close} className="mt-5 text-xs text-white/35 hover:text-white/60 uppercase tracking-wide">
                    No thanks
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
