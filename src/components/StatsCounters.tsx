import { useEffect, useRef, useState } from "react";
import { useInView, motion } from "motion/react";

const STATS = [
  { value: 48000, suffix: "+", label: "happy customers" },
  { value: 1200, suffix: "+", label: "products" },
  { value: 60, suffix: "+", label: "cities served" },
  { value: 4.8, suffix: "", label: "average rating", decimals: 1 },
];

function Counter({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const duration = 1400;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span ref={ref} className="font-display font-bold text-4xl sm:text-5xl tracking-tight">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function StatsCounters() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 py-4">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ y: 14 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.5 }}
          className="text-center"
        >
          <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
          <p className="text-sm text-(--color-muted) mt-1 lowercase">{s.label}</p>
        </motion.div>
      ))}
    </section>
  );
}
