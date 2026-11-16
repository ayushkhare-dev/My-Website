import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const PILLARS = [
  { n: "01", t: "Obsessive craft", d: "Every material sourced, tested, and rejected until it earns its place." },
  { n: "02", t: "No noise", d: "We ship fewer things, better. If it doesn't last, it doesn't launch." },
  { n: "03", t: "Made to be used", d: "Designed for real days, not photoshoots. Function first, always." },
];

export function BrandStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1, 1.08]);

  return (
    <section ref={ref} className="dark relative rounded-[28px] overflow-hidden bg-(--color-canvas) text-white">
      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ aspectRatio: "2720/1536" }}>
        <motion.img
          style={{ scale: imgScale }}
          src="/images/brand-story.jpg"
          alt=""
          className="w-full h-full object-cover opacity-35"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-(--color-canvas)/70 to-(--color-canvas)" />

      <div className="relative px-6 sm:px-16 py-20 sm:py-28">
        <motion.p
          initial={{ y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-(--color-accent)"
        >
          05 — Our story
        </motion.p>
        <motion.h2
          initial={{ y: 24 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06, duration: 0.7 }}
          className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl max-w-4xl mt-5 leading-[1.02] tracking-[-0.02em]"
        >
          We build things that outlast the trend that made us buy them.
        </motion.h2>
        <motion.p
          initial={{ y: 16 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.14 }}
          className="text-white/55 mt-7 max-w-lg leading-relaxed"
        >
          NextGenify started with a simple complaint: most things you buy are engineered to be replaced. We wanted the opposite — objects worth keeping.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 mt-16 max-w-4xl">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ y: 20 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08 }}
              className="border-t border-white/15 pt-5"
            >
              <span className="font-display font-bold text-sm text-(--color-accent)">{p.n}</span>
              <h3 className="font-display font-bold text-lg mt-2">{p.t}</h3>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">{p.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
