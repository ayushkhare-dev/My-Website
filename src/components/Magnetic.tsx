import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/** Wraps any inline element and gives it a subtle magnetic pull toward the cursor. */
export function Magnetic({ children, strength = 0.35, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  function onMove(e: React.MouseEvent) {
    const r = ref.current!.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ x: sx, y: sy }} className={`inline-flex ${className}`}>
      {children}
    </motion.div>
  );
}
