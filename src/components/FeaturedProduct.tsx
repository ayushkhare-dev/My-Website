import { motion, useTransform } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import type { Product } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useNav } from "../lib/nav";
import { usePinScroll } from "../lib/usePinScroll";

const CALLOUTS = [
  { at: 0.22, x: "18%", y: "30%" },
  { at: 0.48, x: "72%", y: "58%" },
  { at: 0.74, x: "40%", y: "78%" },
];

function Callout({ progress, at, x, y, label }: { progress: ReturnType<typeof usePinScroll>["progress"]; at: number; x: string; y: string; label: string }) {
  const opacity = useTransform(progress, [at - 0.06, at, at + 0.16, at + 0.22], [0, 1, 1, 0]);
  const scale = useTransform(progress, [at - 0.06, at], [0.6, 1]);
  return (
    <motion.div style={{ left: x, top: y, opacity, scale }} className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
      <span className="w-2.5 h-2.5 rounded-full bg-(--color-accent) shadow-[0_0_0_6px_rgba(255,106,31,0.18)]" />
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 whitespace-nowrap">
        {label}
      </span>
    </motion.div>
  );
}

export function FeaturedProduct({ product }: { product: Product }) {
  const { sectionRef, pinRef, progress, pinPositionClass } = usePinScroll();
  const { openProduct } = useNav();
  const imgScale = useTransform(progress, [0, 1], [1, 1.35]);
  const contentOpacity = useTransform(progress, [0, 0.12], [0, 1]);
  const contentY = useTransform(progress, [0, 0.12], [24, 0]);
  const callouts = (product.highlights.length ? product.highlights : ["Premium build", "Engineered detail", "Made to last"]).slice(0, 3);

  return (
    <section ref={sectionRef} className="dark relative h-[240vh]">
      <div ref={pinRef} className={`${pinPositionClass} z-20 h-[90vh] overflow-hidden bg-(--color-canvas) text-(--color-ink)`}>
        <div className="absolute inset-0">
          <motion.img
            style={{ scale: imgScale }}
            src="/images/featured-product.jpg"
            alt={product.name}
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-(--color-canvas) via-(--color-canvas)/85 to-(--color-canvas)/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-(--color-canvas) via-transparent to-transparent" />
          {CALLOUTS.map((c, i) => (
            <Callout key={i} progress={progress} at={c.at} x={c.x} y={c.y} label={callouts[i] ?? product.category} />
          ))}
        </div>

        <div className="relative grid grid-cols-1 h-full px-6 sm:px-16">
          <motion.div style={{ opacity: contentOpacity, y: contentY }} className="max-w-xl self-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--color-accent)">02 — Featured Drop</p>
            <h2 className="font-display font-extrabold text-5xl sm:text-7xl mt-4 leading-[0.95] tracking-[-0.02em]">{product.name}</h2>
            <p className="text-(--color-ink)/60 mt-6 max-w-md leading-relaxed">{product.description}</p>
            <ul className="mt-6 space-y-2">
              {product.highlights.slice(0, 3).map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-(--color-ink)/75">
                  <Check size={14} className="text-(--color-accent)" /> {h}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex items-center gap-5">
              <span className="font-display font-extrabold text-3xl">{fmtMoney(product.price)}</span>
              <button
                onClick={() => openProduct(product.id)}
                data-cursor="open"
                className="group inline-flex items-center gap-2 bg-(--color-ink) text-(--color-canvas) rounded-full pl-6 pr-5 py-3.5 text-sm font-semibold hover:bg-(--color-accent) hover:text-white transition-colors"
              >
                Discover more <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
