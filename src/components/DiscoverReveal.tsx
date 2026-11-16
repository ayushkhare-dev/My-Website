import { motion } from "motion/react";
import type { Product } from "../lib/types";
import { useNav } from "../lib/nav";

const WORDS = [
  { text: "DISCOVER", from: { x: -80, y: 0 } },
  { text: "WHAT'S", from: { x: 0, y: 60 } },
  { text: "NEXT.", from: { x: 80, y: 0 } },
];

export function DiscoverReveal({ products }: { products: Product[] }) {
  const { openProduct } = useNav();
  const picks = products.slice(0, 3);

  return (
    <section className="relative py-10 sm:py-16">
      <div className="relative overflow-x-hidden flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
        {WORDS.map((w, i) => (
          <motion.span
            key={w.text}
            initial={{ x: w.from.x, y: w.from.y }}
            whileInView={{ x: 0, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: i * 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold text-[13vw] sm:text-[7vw] leading-[0.95] tracking-[-0.02em]"
          >
            {w.text}
          </motion.span>
        ))}
      </div>

      <div className="relative mt-12 sm:mt-16 grid grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto px-6 sm:px-0">
        {picks.map((p, i) => {
          const from = i === 0 ? { x: -60, y: 0 } : i === 1 ? { x: 0, y: 60 } : { x: 60, y: 0 };
          const span = i === 1 ? "translate-y-6 sm:translate-y-10" : "";
          return (
            <motion.button
              key={p.id}
              data-cursor="view"
              onClick={() => openProduct(p.id)}
              initial={from}
              whileInView={{ x: 0, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, delay: 0.5 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`relative aspect-square rounded-xl overflow-hidden group ${span}`}
            >
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <p className="absolute bottom-3 left-3 text-white text-xs sm:text-sm font-semibold max-h-0 overflow-hidden group-hover:max-h-6 transition-all duration-300">
                {p.name}
              </p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
