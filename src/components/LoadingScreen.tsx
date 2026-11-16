import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function LoadingScreen() {
  const [phase, setPhase] = useState<"logo" | "reveal" | "done">("logo");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    const t1 = setTimeout(() => setPhase("reveal"), 300);
    const t2 = setTimeout(() => setPhase("done"), 460);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.22, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-4"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 1.05, filter: "blur(14px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-extrabold text-3xl sm:text-4xl tracking-[0.02em] text-[#f5f0e8]"
          >
            NEXTGENIFY
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/45"
          >
            The future of shopping.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
