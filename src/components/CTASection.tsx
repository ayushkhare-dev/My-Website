import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNav } from "../lib/nav";
import { Magnetic } from "./Magnetic";

export function CTASection() {
  const { goTo } = useNav();
  return (
    <section className="dark relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-canvas) text-(--color-ink) px-6 sm:px-10 py-20 sm:py-28 text-center">
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ background: "radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--color-accent) 30%, transparent), transparent 60%)" }}
      />
      <motion.h2
        initial={{ y: 16 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative font-display font-bold lowercase tracking-tight text-4xl sm:text-6xl lg:text-7xl"
      >
        ready when <span className="font-serif italic font-normal">you</span> are.
      </motion.h2>
      <motion.div initial={{ y: 10 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }} className="relative mt-8 flex justify-center">
        <Magnetic strength={0.3}>
          <button
            onClick={() => goTo("shop")}
            className="inline-flex items-center gap-2 rounded-full bg-(--color-accent) text-white font-semibold px-7 py-3.5 text-sm lowercase hover:-translate-y-0.5 transition-transform"
          >
            shop now <ArrowRight size={15} />
          </button>
        </Magnetic>
      </motion.div>
    </section>
  );
}
