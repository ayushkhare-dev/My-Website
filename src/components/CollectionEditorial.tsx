import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useNav } from "../lib/nav";

export function CollectionEditorial() {
  const ref = useRef<HTMLDivElement>(null);
  const { goTo } = useNav();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.1]);
  const textX = useTransform(scrollYProgress, [0, 1], [-40, 10]);
  const clip = useTransform(scrollYProgress, [0, 0.4], ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"]);

  return (
    <section ref={ref} className="relative rounded-[28px] overflow-hidden aspect-video flex items-center">
      <motion.div style={{ scale: imgScale }} className="absolute inset-0">
        <img src="/images/collection-editorial.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.2_0.05_335)]/85 via-[oklch(0.2_0.05_335)]/45 to-transparent" />
      </motion.div>

      <motion.div
        style={{ clipPath: clip, background: "linear-gradient(135deg, oklch(0.24 0.07 335), oklch(0.14 0.04 335))" }}
        className="absolute inset-0"
      />

      <motion.div style={{ x: textX }} className="relative z-10 max-w-xl px-8 sm:px-16 py-20 text-white">
        <h2 className="font-display font-extrabold text-4xl sm:text-6xl leading-[1.05]">
          THE NextGenify
          <br />
          COLLECTION
        </h2>
        <p className="text-white/75 mt-5 max-w-md leading-relaxed">Luxury in every detail.</p>
        <button
          onClick={() => goTo("collections")}
          className="mt-8 inline-flex items-center gap-2 bg-(--color-accent) text-white rounded-full px-6 py-3 text-sm font-semibold shadow-[0_10px_30px_-8px_oklch(0.62_0.19_35_/_0.55)] hover:bg-(--color-accent-dark) transition-colors"
        >
          Explore Collection
        </button>
      </motion.div>
    </section>
  );
}
