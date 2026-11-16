import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Package } from "lucide-react";
import type { Product } from "../lib/types";
import { useNav } from "../lib/nav";

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  { eyebrow: "Stage 01", line: "Designed for everyday." },
  { eyebrow: "Stage 02", line: "Built for more." },
  { eyebrow: "Stage 03", line: "Engineered to stand out." },
];

export function ProductStory({ product }: { product?: Product }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const { openProduct } = useNav();

  useEffect(() => {
    if (!product || !sectionRef.current || !imgWrapRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Kill any stale trigger left over from a fast remount (e.g. React
    // StrictMode's double-invoke) so we never end up with two competing
    // pins fighting over the same section.
    ScrollTrigger.getById("product-story")?.kill();

    const ctx = gsap.context(() => {
      // A single timeline owns its scrollTrigger config here — creating a
      // separate ScrollTrigger.create() and then handing that *instance* to
      // gsap.timeline({ scrollTrigger: st }) spins up a second, unlabeled
      // ScrollTrigger bound to the same section. Both then fight to write
      // the pinned element's transform every frame, and the section ends up
      // stuck translated off-screen (reads as a black/blank viewport).
      gsap
        .timeline({
          scrollTrigger: {
            id: "product-story",
            trigger: sectionRef.current,
            start: "top top",
            end: "+=220%",
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            scrub: 1,
            onUpdate: (self) => {
              const p = self.progress;
              setStage(p < 0.3 ? 0 : p < 0.62 ? 1 : p < 0.9 ? 2 : 3);
            },
          },
        })
        .fromTo(
          imgWrapRef.current,
          { scale: 0.5, rotate: -8, x: "-20%" },
          { scale: 0.85, rotate: -3, x: "-6%", ease: "none", duration: 0.32 },
        )
        .to(imgWrapRef.current, { scale: 1.05, rotate: 3, x: 0, ease: "none", duration: 0.3 })
        .to(imgWrapRef.current, { scale: 1.35, rotate: 0, x: 0, ease: "none", duration: 0.38 });
    }, sectionRef);

    // The pin's start/end are measured in real pixels the moment it's
    // created. Everything above this section (hero art, category images,
    // the trending rail) can still be loading and reflowing the page at
    // that instant, which leaves the trigger pinned to stale coordinates —
    // the section then goes dark/blank mid-scroll because GSAP is
    // translating it against a document height that no longer matches
    // reality. Re-measure once the page has actually settled.
    const refresh = () => ScrollTrigger.refresh();
    const raf = requestAnimationFrame(refresh);
    window.addEventListener("load", refresh);

    const pendingImages = Array.from(document.images).filter((img) => !img.complete);
    pendingImages.forEach((img) => {
      img.addEventListener("load", refresh, { once: true });
      img.addEventListener("error", refresh, { once: true });
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
      pendingImages.forEach((img) => {
        img.removeEventListener("load", refresh);
        img.removeEventListener("error", refresh);
      });
      ctx.revert();
    };
  }, [product]);

  if (!product) return null;

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden rounded-[32px] bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={imgWrapRef} className="w-[46vmin] h-[46vmin] max-w-md max-h-md rounded-[28px] overflow-hidden shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] border border-white/10 bg-neutral-900">
          {imgFailed ? (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <Package size={48} strokeWidth={1.25} />
            </div>
          ) : (
            <img
              src={product.images[0]}
              alt={product.name}
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-between p-8 sm:p-14 pointer-events-none">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">The Next Generation</p>

        <AnimatePresence mode="wait">
          {stage < 3 ? (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-(--color-accent) mb-2">{STAGES[stage].eyebrow}</p>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white">{STAGES[stage].line}</h2>
            </motion.div>
          ) : (
            <motion.div key="cta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center pointer-events-auto">
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white mb-5">{product.name}</h2>
              <button
                onClick={() => openProduct(product.id)}
                className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Explore Product <ArrowRight size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= stage ? "w-8 bg-white" : "w-4 bg-white/25"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
