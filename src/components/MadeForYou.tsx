import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Product } from "../lib/types";
import { ProductCard } from "./ProductCard";

const FILTERS = ["For your style", "Because you viewed", "Trending near you", "Recommended"] as const;

const FILTER_FN: Record<(typeof FILTERS)[number], (p: Product) => boolean> = {
  "For your style": (p) => p.category === "Fashion" || p.category === "Shoes",
  "Because you viewed": (p) => p.category === "Watches" || p.category === "Electronics",
  "Trending near you": (p) => !!p.isBestSeller,
  Recommended: (p) => !!p.isNew || !!p.isBestSeller,
};

export function MadeForYou({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("For your style");

  const items = useMemo(() => products.filter(FILTER_FN[filter]).slice(0, 4), [products, filter]);

  if (products.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="font-display font-extrabold text-2xl sm:text-4xl">Made For You</h2>
        <p className="text-(--color-muted) mt-2">Personalized recommendations just for you.</p>
      </div>

      <div className="flex gap-1.5 flex-wrap justify-center">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === f ? "bg-(--color-ink) text-(--color-canvas) border-(--color-ink)" : "border-(--color-border) text-(--color-muted) hover:border-(--color-accent)"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-2 sm:grid-cols-4 gap-4 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.p key="empty" exit={{ opacity: 0 }} className="col-span-full text-sm text-(--color-muted) text-center py-10">
              Nothing here yet.
            </motion.p>
          ) : (
            items.map((p, i) => (
              <motion.div key={p.id} layout initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                <ProductCard product={p} index={i} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
