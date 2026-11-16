import { useLayoutEffect, useRef, useState } from "react";
import { useMotionValue } from "motion/react";

export function usePinScroll() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const [phase, setPhase] = useState<"before" | "pinned" | "after">("before");

  useLayoutEffect(() => {
    function onScrollOrResize() {
      const sectionEl = sectionRef.current;
      const pinEl = pinRef.current;
      if (!sectionEl || !pinEl) return;
      const rect = sectionEl.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      const sectionHeight = rect.height;
      const pinHeight = pinEl.getBoundingClientRect().height;
      const dragDistance = Math.max(sectionHeight - pinHeight, 1);
      const scrolled = window.scrollY - sectionTop;
      const p = Math.min(1, Math.max(0, scrolled / dragDistance));
      progress.set(p);
      setPhase(scrolled < 0 ? "before" : scrolled > dragDistance ? "after" : "pinned");
    }
    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [progress]);

  const pinPositionClass =
    phase === "pinned" ? "fixed top-0 inset-x-0" : phase === "after" ? "absolute bottom-0 inset-x-0" : "absolute top-0 inset-x-0";

  return { sectionRef, pinRef, progress, phase, pinPositionClass };
}
