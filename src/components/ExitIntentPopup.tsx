import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Check } from "lucide-react";
import { api } from "../lib/api";
import { isAnyMarketingPopupOpen, setMarketingPopupOpen } from "../lib/popupCoordinator";

const SEEN_KEY = "nextgenify.exit-intent-popup.v1";
const ARM_AFTER_MS = 6000;

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    let armed = false;
    const armTimer = setTimeout(() => {
      armed = true;
    }, ARM_AFTER_MS);

    function onMouseLeave(e: MouseEvent) {
      if (!armed || sessionStorage.getItem(SEEN_KEY) || isAnyMarketingPopupOpen()) return;
      if (e.clientY <= 0) {
        sessionStorage.setItem(SEEN_KEY, "1");
        setOpen(true);
        setMarketingPopupOpen(true);
      }
    }

    document.addEventListener("mouseout", onMouseLeave);
    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseout", onMouseLeave);
    };
  }, []);

  function close() {
    setOpen(false);
    setMarketingPopupOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      await api.post("/api/newsletter/subscribe", { email: email.trim() });
      setDone(true);
    } catch {
      setDone(true);
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
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-(--color-canvas) text-(--color-ink) rounded-[28px] overflow-hidden max-w-md w-full border border-(--color-border) grid grid-cols-1 sm:grid-cols-[1fr] "
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-(--color-accent-soft) hover:bg-(--color-accent)/20 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="relative px-8 py-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--color-accent-dark)">Before you go</p>

              {done ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                  <Check size={26} className="mx-auto text-(--color-good)" />
                  <h3 className="font-display font-extrabold text-2xl mt-4">Code sent.</h3>
                  <p className="text-(--color-muted) text-sm mt-2">Check your inbox — WELCOME10 is on its way.</p>
                  <button onClick={close} className="mt-6 text-sm font-semibold text-(--color-accent-dark) hover:underline">
                    Back to shopping
                  </button>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl mt-4 leading-[1.05] tracking-[-0.01em]">One last look?</h2>
                  <p className="text-(--color-muted) text-sm mt-4 max-w-xs mx-auto leading-relaxed">
                    Take 10% off your first order — just leave your email before you head out.
                  </p>
                  <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-2.5 max-w-xs mx-auto">
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="rounded-full border border-(--color-border) bg-(--color-surface) px-5 py-3 text-sm text-center outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-full bg-(--color-accent) text-white font-semibold px-6 py-3 text-sm hover:bg-(--color-accent-dark) transition-colors disabled:opacity-50"
                    >
                      {busy ? "Sending…" : "Send my code"}
                    </button>
                  </form>
                  <button onClick={close} className="mt-5 text-xs text-(--color-muted) hover:text-(--color-ink) uppercase tracking-wide">
                    Continue without it
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
