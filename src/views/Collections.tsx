import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { createStore } from "../lib/store";
import type { Product } from "../lib/types";
import { CollectionEditorial } from "../components/CollectionEditorial";
import { ProductCard } from "../components/ProductCard";
import { useNav } from "../lib/nav";

const useProducts = createStore<Product>("products");

interface Curated {
  title: string;
  blurb: string;
  filter: (p: Product) => boolean;
}

const SETS: Curated[] = [
  { title: "New Season", blurb: "Fresh arrivals across every category.", filter: (p) => !!p.isNew },
  { title: "Elevated Essentials", blurb: "The pieces that earn a permanent spot in rotation.", filter: (p) => !!p.isBestSeller },
  { title: "Featured Edit", blurb: "Our current picks of the season.", filter: (p) => !!p.featured },
];

export function Collections() {
  const { items: products } = useProducts();
  const { goTo } = useNav();

  return (
    <div className="space-y-14">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-(--color-accent-dark)">Curated</p>
        <h1 className="font-display font-extrabold text-3xl mt-1">Collections</h1>
      </div>

      <CollectionEditorial />

      {SETS.map((set, si) => {
        const items = products.filter(set.filter).slice(0, 4);
        if (items.length === 0) return null;
        return (
          <motion.section key={set.title} initial={{ y: 14 }} whileInView={{ y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: si * 0.05 }} className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display font-extrabold text-2xl">{set.title}</h2>
                <p className="text-sm text-(--color-muted) mt-1">{set.blurb}</p>
              </div>
              <button onClick={() => goTo("shop")} className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-(--color-accent-dark) hover:underline">
                View all <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {items.map((p, i) => (
                <div key={p.id} className={i === 0 ? "col-span-2 sm:col-span-2" : "col-span-1"}>
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
