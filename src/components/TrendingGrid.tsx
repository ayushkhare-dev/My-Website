import { motion } from "motion/react";
import type { Product } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useNav } from "../lib/nav";

export function TrendingGrid({ products }: { products: Product[] }) {
  const { openProduct } = useNav();

  return (
    <section className="space-y-10">
      <div className="text-center max-w-lg mx-auto">
        <p className="section-number mb-3">03 trending</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight lowercase">
          ranked by <span className="font-serif italic font-normal">demand</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.slice(0, 6).map((p, i) => (
          <motion.button
            key={p.id}
            onClick={() => openProduct(p.id)}
            initial={{ y: 14 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex items-center gap-4 rounded-2xl glass border border-(--color-border) hover:border-(--color-accent) transition-colors p-4 text-left"
          >
            <span className="font-serif italic font-normal text-4xl sm:text-5xl text-(--color-muted)/40 w-14 shrink-0 text-center">{i + 1}</span>
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: "linear-gradient(135deg, rgba(255,106,31,0.14), rgba(255,106,31,0.02))" }}>
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-semibold text-sm line-clamp-2 leading-snug break-words">{p.name}</h3>
              <p className="text-xs text-(--color-muted) mt-0.5">{p.brand}</p>
            </div>
            <span className="font-display font-bold text-sm shrink-0">{fmtMoney(p.dealPrice ?? p.price)}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
