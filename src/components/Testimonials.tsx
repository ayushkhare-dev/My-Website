import { useRef } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";

const REVIEWS = [
  { name: "Priya S.", rating: 5, text: "The quality feels genuinely premium — packaging, fit, everything. NextGenify has become my default store." },
  { name: "Aman K.", rating: 5, text: "Fast delivery, easy returns, and the checkout was painless. Exactly what online shopping should feel like." },
  { name: "Wei L.", rating: 4, text: "Loved the electronics range especially. Prices are fair and the site itself is a joy to browse." },
  { name: "Sofia R.", rating: 5, text: "Ordered three times now — every single package arrived earlier than promised. Consistently great." },
];

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <section className="space-y-10">
      <div className="text-center max-w-lg mx-auto">
        <p className="section-number mb-3">05 reviews</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight lowercase">what people say</h2>
      </div>
      <motion.div ref={trackRef} className="overflow-hidden cursor-grab active:cursor-grabbing">
        <motion.div
          drag="x"
          dragConstraints={{ left: -((REVIEWS.length - 1) * 340), right: 0 }}
          dragElastic={0.12}
          dragTransition={{ power: 0.3, timeConstant: 200 }}
          className="flex gap-5"
        >
          {REVIEWS.map((r, i) => (
            <div
              key={r.name}
              className="shrink-0 w-[300px] sm:w-[320px] rounded-3xl p-6 glass border border-(--color-border)"
              style={{ borderColor: `color-mix(in oklch, var(--color-accent) 30%, var(--color-border))` }}
            >
              <div className="flex gap-0.5 text-(--color-warn)">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star key={si} size={13} className={si < r.rating ? "fill-(--color-warn)" : "opacity-25"} />
                ))}
              </div>
              <p className="text-sm mt-3 leading-relaxed text-(--color-ink)/90">"{r.text}"</p>
              <p className="text-xs font-semibold text-(--color-muted) mt-4">{r.name}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
