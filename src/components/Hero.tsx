import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNav } from "../lib/nav";
import { ThreeHero } from "./ThreeHero";

export function Hero() {
  const { goTo } = useNav();
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 });

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    function onMove(e: MouseEvent) {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
      my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
    }
    window.addEventListener("mousemove", onMove);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", onMove);
    };
  }, [mx, my]);

  const atmosphereX = useTransform(sx, [-1, 1], [-6, 6]);
  const atmosphereY = useTransform(sy, [-1, 1], [-6, 6]);
  const imageX = useTransform(sx, [-1, 1], [-14, 14]);
  const imageY = useTransform(sy, [-1, 1], [-14, 14]);
  const headlineX = useTransform(sx, [-1, 1], [8, -8]);
  const headlineY = useTransform(sy, [-1, 1], [5, -5]);
  const metaX = useTransform(sx, [-1, 1], [-4, 4]);
  const ctaX = useTransform(sx, [-1, 1], [-3, 3]);

  return (
    <motion.section
      ref={ref}
      className="hero-panel relative left-1/2 z-10 -ml-[50vw] w-screen max-w-none h-[100svh] min-h-[560px] overflow-hidden text-white"
    >
      <motion.div
        style={{ x: atmosphereX, y: atmosphereY }}
        className="absolute inset-0 opacity-60"
        aria-hidden
      >
        <div className="absolute inset-0 [background:radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--color-accent)_18%,transparent),transparent_60%)]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        style={{ x: imageX, y: imageY }}
        className="absolute inset-0"
      >
        <motion.picture
          initial={{ scale: 1.08 }}
          animate={{ scale: ready ? 1 : 1.08 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          className="block w-full h-full"
          style={{ transform: "scale(1.06)" }}
        >
          <source media="(max-width: 639px)" srcSet="/images/hero-dark-cinematic-portrait.jpg" />
          <img src="/images/hero-dark-cinematic.jpg" alt="" className="hero-photo w-full h-full object-cover" />
        </motion.picture>
        <div className="hero-photo-overlay absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />
        <div className="hero-photo-shade absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/40" />
      </motion.div>

      <div className="grain absolute inset-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="absolute inset-y-0 right-0 w-full sm:w-[62%] lg:w-[54%] pointer-events-none"
      >
        <ThreeHero className="absolute inset-0" />
      </motion.div>

      <div className="relative h-full flex flex-col justify-end px-6 sm:px-10 lg:px-14 pb-16 sm:pb-20 max-w-full sm:max-w-[58%] lg:max-w-[46%]">
        <motion.p
          style={{ x: metaX }}
          initial={{ y: 10 }}
          animate={{ y: ready ? 0 : 10 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="hero-eyebrow text-[11px] font-semibold uppercase tracking-[0.35em] text-(--color-accent) mb-5"
        >
          Shop the next generation.
        </motion.p>

        <motion.h1 style={{ x: headlineX }} className="font-display font-extrabold leading-[0.86] tracking-[-0.03em] text-[15vw] sm:text-[9vw] lg:text-[7.5vw]">
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: "110%" }}
              animate={{ y: ready ? "0%" : "110%" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            >
              THE FUTURE
            </motion.div>
          </div>
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: "110%" }}
              animate={{ y: ready ? "0%" : "110%" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="text-[#f5f0e8]/90"
            >
              IS HERE.
            </motion.div>
          </div>
        </motion.h1>

        <motion.p
          initial={{ y: 8 }}
          animate={{ y: ready ? 0 : 8 }}
          transition={{ delay: 0.95, duration: 0.6 }}
          className="hero-description mt-7 max-w-md text-white/60 text-sm sm:text-base leading-relaxed"
        >
          Objects engineered for the decade ahead — not the season.
        </motion.p>

        <motion.div
          style={{ x: ctaX }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 18 }}
          transition={{ delay: 1.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9"
        >
          <button
            data-cursor="open"
            onClick={() => goTo("shop")}
            className="group inline-flex items-center gap-3 rounded-full border border-white/25 pl-7 pr-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-white hover:text-black transition-colors duration-300"
          >
            Enter the collection
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : -12 }}
        transition={{ delay: 1.55, duration: 0.5 }}
        className="absolute bottom-8 right-6 sm:right-10 lg:right-14 flex items-center gap-2 text-white/40 text-[10px] font-semibold uppercase tracking-[0.25em]"
      >
        <span className="block w-px h-8 bg-white/25" />
        Scroll
      </motion.div>
    </motion.section>
  );
}
