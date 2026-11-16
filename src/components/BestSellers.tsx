import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Product } from "../lib/types";
import { ProductCard } from "./ProductCard";

const FILTERS = ["All", "Fashion", "Electronics", "Shoes", "Beauty", "Lifestyle"] as const;

export function BestSellers({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const sellers = useMemo(() => {
    const base = products.filter((p) => p.isBestSeller);
    const filtered = filter === "All" ? base : filter === "Lifestyle" ? base.filter((p) => p.category === "Home") : base.filter((p) => p.category === filter);
    return filtered.slice(0, 4);
  }, [products, filter]);

  return (
    <section className="space-y-6 bg-neutral-950 rounded-[28px] px-5 sm:px-10 py-14 sm:py-16">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white">Best Sellers</h2>
        <p className="text-white/60 mt-2">Top picks from our customers</p>
      </div>
      <div className="flex justify-center">
        <div className="flex gap-1.5 flex-wrap justify-center">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === f ? "bg-white text-black border-white" : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="grid grid-cols-2 sm:grid-cols-4 gap-4 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {sellers.length === 0 ? (
            <motion.p key="empty" exit={{ opacity: 0 }} className="col-span-full text-sm text-white/60 text-center py-10">
              No best sellers in this category yet.
            </motion.p>
          ) : (
            sellers.map((p, i) => (
              <motion.div key={p.id} layout initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                <ProductCard product={p} index={i} tone="dark" />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
