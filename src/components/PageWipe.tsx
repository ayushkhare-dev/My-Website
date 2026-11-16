import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNav } from "../lib/nav";

export function PageWipe() {
  const { view } = useNav();
  const [wiping, setWiping] = useState(false);
  const prev = useRef(view);

  useEffect(() => {
    if (prev.current === view) return;
    prev.current = view;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setWiping(true);
    const t = setTimeout(() => setWiping(false), 620);
    return () => clearTimeout(t);
  }, [view]);

  return (
    <AnimatePresence>
      {wiping && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: [0, 1, 1, 0] }}
          exit={{ scaleY: 0 }}
          transition={{ duration: 0.6, times: [0, 0.42, 0.58, 1], ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "top", background: "var(--color-accent)" }}
          className="fixed inset-0 z-[95] pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}
