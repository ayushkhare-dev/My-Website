import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../lib/types";
import { ProductCard } from "./ProductCard";

export function TrendingRail({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [centerId, setCenterId] = useState<string | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(track.querySelectorAll<HTMLElement>("[data-rail-item]"));
    const observer = new IntersectionObserver(
      (entries) => {
        let best: { id: string; ratio: number } | null = null;
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.railItem!;
          const box = e.target.getBoundingClientRect();
          const trackBox = track.getBoundingClientRect();
          const dist = Math.abs(box.left + box.width / 2 - (trackBox.left + trackBox.width / 2));
          const ratio = 1 - Math.min(dist / trackBox.width, 1);
          if (!best || ratio > best.ratio) best = { id, ratio };
        }
        if (best) setCenterId(best.id);
      },
      { root: track, threshold: Array.from({ length: 11 }, (_, i) => i / 10) },
    );
    items.forEach((it) => observer.observe(it));
    return () => observer.disconnect();
  }, [products]);

  function scrollBy(dir: 1 | -1) {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div ref={trackRef} className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 sm:px-6 lg:px-8 py-4 -mx-4 sm:-mx-6 lg:-mx-8">
        {products.map((p, i) => (
          <motion.div
            key={p.id}
            data-rail-item={p.id}
            className="snap-center shrink-0 w-[220px] sm:w-[260px]"
            animate={{ scale: centerId === p.id ? 1.03 : 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductCard product={p} index={i} />
          </motion.div>
        ))}
      </div>
      <button
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-9 h-9 rounded-full glass border border-(--color-border) shadow-lg items-center justify-center hover:border-(--color-accent) hover:text-(--color-accent)"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-9 h-9 rounded-full glass border border-(--color-border) shadow-lg items-center justify-center hover:border-(--color-accent) hover:text-(--color-accent)"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
