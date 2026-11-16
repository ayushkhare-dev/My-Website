import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Zap } from "lucide-react";
import type { Product } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useNav } from "../lib/nav";

const DEAL_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;

function useCountdown(target: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = target ? new Date(target).getTime() : now;
  const remaining = Math.max(0, end - now);
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  return { h, m, s, pct: Math.min(100, Math.max(0, 100 - (remaining / DEAL_WINDOW_MS) * 100)) };
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 font-display font-extrabold text-3xl sm:text-4xl min-w-[68px] text-center text-white tabular-nums overflow-hidden">
        <motion.span key={value} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }} className="block">
          {String(value).padStart(2, "0")}
        </motion.span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 mt-2">{label}</span>
    </div>
  );
}

export function FlashSale({ products }: { products: Product[] }) {
  const { openProduct, goTo } = useNav();
  const deals = useMemo(() => products.filter((p) => p.dealPrice && p.dealEndsAt && new Date(p.dealEndsAt).getTime() > Date.now()), [products]);
  const countdown = useCountdown(deals[0]?.dealEndsAt);

  if (deals.length === 0) return null;

  return (
    <section className="dark relative rounded-[28px] overflow-hidden bg-(--color-canvas) text-white p-6 sm:p-14">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_15%_10%,color-mix(in_oklch,var(--color-accent)_45%,transparent),transparent_55%)]" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 left-0 w-1/3 h-[220%] animate-light-sweep"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }}
        />
      </div>

      <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10">
        <div>
          <motion.span
            initial={{ y: 10 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 border border-(--color-accent)/40 text-(--color-accent) text-xs font-semibold uppercase tracking-[0.25em] px-3 py-1.5 rounded-full"
          >
            <Zap size={12} className="fill-(--color-accent)" /> Limited Drop
          </motion.span>
          <motion.h2
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="font-display font-extrabold text-4xl sm:text-6xl mt-4 tracking-[-0.02em] leading-[0.95]"
          >
            Gone when
            <br className="hidden sm:block" /> the clock hits zero.
          </motion.h2>
          <motion.p
            initial={{ y: 14 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="text-white/50 text-sm mt-3 max-w-[42ch]"
          >
            A short run of pieces at prices we won't repeat. No restock.
          </motion.p>
          <button
            onClick={() => goTo("deals")}
            className="mt-6 inline-flex items-center rounded-full bg-white text-(--color-ink) font-semibold px-7 py-3.5 text-sm hover:bg-(--color-accent) hover:text-white transition-colors"
          >
            Shop the drop
          </button>
        </div>
        <div className="flex items-center gap-3">
          <TimeBox value={countdown.h} label="Hours" />
          <span className="font-display font-extrabold text-2xl text-white/20 -mt-5">:</span>
          <TimeBox value={countdown.m} label="Mins" />
          <span className="font-display font-extrabold text-2xl text-white/20 -mt-5">:</span>
          <TimeBox value={countdown.s} label="Secs" />
        </div>
      </div>

      <div className="relative h-px w-full bg-white/10 mb-10 overflow-hidden rounded-full">
        <motion.div
          className="h-full bg-(--color-accent)"
          initial={{ width: 0 }}
          animate={{ width: `${countdown.pct}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4">
        {deals.map((p, i) => {
          const pct = Math.round(100 - (p.dealPrice! / p.price) * 100);
          return (
            <motion.button
              key={p.id}
              onClick={() => openProduct(p.id)}
              initial={{ y: 14 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group text-left rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-white/30 transition-colors"
            >
              <div className="relative aspect-square overflow-hidden">
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-2 left-2 bg-(--color-accent) text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{pct}%</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold line-clamp-2 min-h-[2.4em] leading-tight break-words">{p.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display font-extrabold text-sm">{fmtMoney(p.dealPrice!)}</span>
                  <span className="text-xs text-white/40 line-through">{fmtMoney(p.price)}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
