import { useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "../lib/types";
import { ProductCard } from "./ProductCard";

export function NewArrivals({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(delta: number) {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  function onWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && trackRef.current) {
      trackRef.current.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }

  if (products.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-(--color-accent-dark)">Just landed</p>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mt-1">New arrivals</h2>
        </div>
        <div className="hidden sm:flex gap-2">
          <button onClick={() => scrollBy(-360)} aria-label="Scroll left" className="p-2.5 rounded-full border border-(--color-border) hover:border-(--color-accent)">
            <ArrowLeft size={16} />
          </button>
          <button onClick={() => scrollBy(360)} aria-label="Scroll right" className="p-2.5 rounded-full border border-(--color-border) hover:border-(--color-accent)">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <motion.div
        ref={trackRef}
        onWheel={onWheel}
        drag="x"
        dragConstraints={{ left: -((products.length - 2) * 260), right: 0 }}
        dragElastic={0.08}
        className="flex gap-4 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing snap-x snap-mandatory pb-2"
      >
        {products.map((p, i) => (
          <div key={p.id} className="min-w-[220px] sm:min-w-[240px] snap-start">
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
