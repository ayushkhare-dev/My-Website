import { useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useMotionTemplate, useSpring } from "motion/react";

export function GlowCard({
  children,
  index = 0,
  className = "",
  tilt = true,
  as: Tag = "div",
  onClick,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  tilt?: boolean;
  as?: "div" | "button";
  onClick?: () => void;
}) {
  const accent = "var(--color-accent)";
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 250, damping: 22 });
  const sry = useSpring(ry, { stiffness: 250, damping: 22 });
  const glow = useMotionTemplate`radial-gradient(240px circle at ${mx}% ${my}%, color-mix(in oklch, ${accent} 30%, transparent), transparent 70%)`;
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px * 100);
    my.set(py * 100);
    if (tilt) {
      ry.set((px - 0.5) * 8);
      rx.set((0.5 - py) * 8);
    }
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      role={Tag === "button" ? "button" : undefined}
      tabIndex={Tag === "button" ? 0 : undefined}
      initial={{ y: 16 }}
      animate={{ y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformPerspective: 900,
        background: `linear-gradient(135deg, color-mix(in oklch, ${accent} 55%, transparent), transparent 60%)`,
      }}
      className={`group relative rounded-3xl p-[1.5px] ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="relative h-full rounded-[calc(1.5rem-1.5px)] overflow-hidden glass border border-(--color-border)">
        <motion.div style={{ background: glow }} className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        <div className="relative z-20 h-full">{children}</div>
      </div>
    </motion.div>
  );
}
