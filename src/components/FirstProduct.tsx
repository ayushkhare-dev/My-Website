import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useNav } from "../lib/nav";

export function FirstProduct({ product }: { product: Product }) {
  const { openProduct } = useNav();
  if (!product) return null;

  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative grid grid-cols-1 items-center">
        <motion.div
          initial={{ y: 12 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative z-0 text-center"
        >
          <p className="font-display font-extrabold text-[16vw] sm:text-[10vw] leading-none tracking-[-0.03em] text-(--color-ink)/[0.06] select-none uppercase">
            {product.name}
          </p>
        </motion.div>

        <div className="relative z-10 -mt-[26vw] sm:-mt-[18vw] flex flex-col items-center">
          <motion.button
            data-cursor="explore"
            onClick={() => openProduct(product.id)}
            initial={{ scale: 0.92, y: 30 }}
            whileInView={{ scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[78vw] sm:w-[52vw] max-w-2xl aspect-square rounded-2xl overflow-hidden"
          >
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          </motion.button>

          <motion.div
            initial={{ y: 16 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-(--color-muted)">{product.category}</p>
            <h3 className="font-display font-extrabold text-3xl sm:text-4xl mt-2 tracking-tight">{product.name}</h3>
            <p className="font-display font-bold text-xl mt-2">{fmtMoney(product.price)}</p>
            <button
              data-cursor="open"
              onClick={() => openProduct(product.id)}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold border-b border-(--color-ink) pb-1 hover:opacity-60 transition-opacity"
            >
              View product <ArrowUpRight size={14} />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
