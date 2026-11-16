import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useTransform } from "motion/react";
import { Star } from "lucide-react";
import type { Product } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useNav } from "../lib/nav";
import { usePinScroll } from "../lib/usePinScroll";

function Slide({ children, progress, index, count }: { children: React.ReactNode; progress: ReturnType<typeof usePinScroll>["progress"]; index: number; count: number }) {
  const start = index / count;
  const end = (index + 1) / count;
  const t = Math.min(0.045, (end - start) / 2 - 0.001);
  const x = useTransform(progress, [start - t, start + t, end - t, end + t], [100, 0, 0, -100]);
  const opacity = useTransform(progress, [start - t, start - t / 2, end + t / 2, end + t], [0, 1, 1, 0]);
  return (
    <motion.div
      style={{ x: useTransform(x, (v) => `${v}%`), opacity }}
      className="absolute inset-0"
    >
      {children}
    </motion.div>
  );
}

export function StickyReveal({ products }: { products: Product[] }) {
  const { sectionRef, pinRef, progress, pinPositionClass } = usePinScroll();
  const { openProduct } = useNav();
  const items = products.slice(0, 5);
  const [active, setActive] = useState(0);

  useMotionValueEvent(progress, "change", (v) => {
    const idx = Math.min(items.length - 1, Math.floor(v * items.length));
    setActive(idx);
  });

  return (
    <section ref={sectionRef} className="dark relative" style={{ height: `${items.length * 100}vh` }}>
      <div
        ref={pinRef}
        className={`${pinPositionClass} z-20 h-[88vh] overflow-hidden bg-(--color-canvas)`}
      >
        <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-8 flex flex-col">
          <div className="flex items-end justify-between gap-4 pt-8 pb-4 shrink-0">
            <div>
              <p className="section-number mb-1 text-white/50">03 best sellers</p>
              <h2 className="font-display font-bold text-xl sm:text-3xl text-white tracking-tight">
                The favorites, up close.
              </h2>
            </div>
            <p className="font-display text-sm text-white/40 tabular-nums shrink-0">
              {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </p>
          </div>

          <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 items-center">
            <div
              className="relative rounded-[28px] overflow-hidden order-1 mx-auto"
              style={{ width: "min(78vw, 42vh, 480px)", height: "min(78vw, 42vh, 480px)" }}
            >
              {items.map((p, i) => (
                <Slide key={p.id} progress={progress} index={i} count={items.length}>
                  <button
                    onClick={() => openProduct(p.id)}
                    data-cursor="view"
                    className="w-full h-full block"
                  >
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  </button>
                </Slide>
              ))}
            </div>

            <div className="relative order-2 self-stretch flex items-center overflow-hidden min-h-[280px]">
              <AnimatePresence mode="wait" initial={false}>
                {items[active] && (
                  <motion.div
                    key={items[active].id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 h-full flex flex-col justify-center"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-(--color-accent) mb-4">{items[active].category}</p>
                    <h3 className="font-display font-extrabold text-[9vw] sm:text-[3.4vw] lg:text-[2.6vw] leading-[0.98] text-white break-words max-w-[90%]">
                      {items[active].name}
                    </h3>
                    <div className="flex items-center gap-4 mt-6">
                      <span className="font-display font-bold text-2xl text-white">{fmtMoney(items[active].dealPrice ?? items[active].price)}</span>
                      <span className="flex items-center gap-1 text-sm text-white/60">
                        <Star size={14} className="fill-(--color-warn) text-(--color-warn)" /> {items[active].rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm max-w-md mt-4 line-clamp-2">{items[active].description}</p>
                    <button
                      onClick={() => openProduct(items[active].id)}
                      data-cursor="open"
                      className="mt-8 inline-flex items-center gap-2 self-start text-xs font-bold uppercase tracking-[0.25em] text-white border-b border-white/30 pb-2 hover:border-(--color-accent) hover:text-(--color-accent) transition-colors"
                    >
                      View piece
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex gap-2 pb-8 pt-4 shrink-0">
            {items.map((_, i) => (
              <span key={i} className={`h-[2px] flex-1 rounded-full transition-colors duration-500 ${i === active ? "bg-(--color-accent)" : "bg-white/15"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
