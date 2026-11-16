import { useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Star } from "lucide-react";
import type { Product } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useNav } from "../lib/nav";

export function HorizontalShowcase({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { openProduct } = useNav();
  const [travel, setTravel] = useState(0);
  const [pinPhase, setPinPhase] = useState<"before" | "pinned" | "after">("before");
  const progress = useMotionValue(0);
  const items = products.slice(0, 7);

  useLayoutEffect(() => {
    function measure() {
      if (!trackRef.current) return;
      const trackWidth = trackRef.current.scrollWidth;
      setTravel(Math.max(trackWidth - window.innerWidth, 0));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items.length]);

  useLayoutEffect(() => {
    function onScrollOrResize() {
      const sectionEl = ref.current;
      const pinEl = pinRef.current;
      if (!sectionEl || !pinEl) return;
      const rect = sectionEl.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      const sectionHeight = rect.height;
      const pinHeight = pinEl.getBoundingClientRect().height;
      const dragDistance = Math.max(sectionHeight - pinHeight, 1);
      const scrolled = window.scrollY - sectionTop;
      const p = Math.min(1, Math.max(0, scrolled / dragDistance));
      progress.set(p);
      setPinPhase(scrolled < 0 ? "before" : scrolled > dragDistance ? "after" : "pinned");
    }
    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [progress]);

  const x = useTransform(progress, [0, 1], [0, -travel]);
  const bgX = useTransform(progress, [0, 1], ["0%", "-30%"]);

  const pinPositionClass =
    pinPhase === "pinned" ? "fixed top-0 inset-x-0" : pinPhase === "after" ? "absolute bottom-0 inset-x-0" : "absolute top-0 inset-x-0";

  return (
    <section ref={ref} className="dark relative h-[165vh]">
      <div ref={pinRef} className={`${pinPositionClass} z-20 h-[62vh] overflow-hidden flex items-center bg-(--color-canvas)`}>
        <motion.p
          style={{ x: bgX }}
          className="absolute left-0 top-1/2 -translate-y-1/2 font-display font-extrabold uppercase leading-[0.8] text-[18vw] text-white/[0.06] whitespace-nowrap select-none pointer-events-none"
        >
          NEW SEASON
        </motion.p>

        <div className="absolute top-6 left-0 w-full text-center z-10">
          <p className="section-number mb-2 text-white/50">02 new season</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">The latest arrivals, in motion.</h2>
        </div>

        <motion.div ref={trackRef} style={{ x }} className="flex items-center gap-6 pl-[8vw] pr-[8vw]">
          {items.map((p, i) => (
            <button
              key={p.id}
              onClick={() => openProduct(p.id)}
              className={`group relative shrink-0 rounded-2xl overflow-hidden bg-white ${i % 2 === 0 ? "w-[70vw] h-[70vw] sm:w-[38vw] sm:h-[58vh]" : "w-[58vw] h-[58vw] sm:w-[28vw] sm:h-[44vh]"}`}
            >
              <motion.img
                src={p.images[0]}
                alt={p.name}
                className="w-full h-full object-contain p-4 sm:p-6"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
              <div className="absolute bottom-0 left-0 p-5 text-left text-white">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">{p.category}</p>
                <h3 className="font-display font-bold text-lg mt-1">{p.name}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-display font-extrabold">{fmtMoney(p.dealPrice || p.price)}</span>
                  {(p.compareAtPrice || p.dealPrice) && (
                    <span className="text-xs text-white/50 line-through">{fmtMoney(p.compareAtPrice || p.price)}</span>
                  )}
                  <span className="flex items-center gap-0.5 text-xs text-white/70">
                    <Star size={11} className="fill-(--color-warn) text-(--color-warn)" /> {p.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1.5 max-w-[85%] line-clamp-1">{p.description}</p>
              </div>
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
