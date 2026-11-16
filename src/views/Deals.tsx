import { Tag } from "lucide-react";
import { createStore } from "../lib/store";
import type { Product } from "../lib/types";
import { FlashSale } from "../components/FlashSale";
import { ProductCard } from "../components/ProductCard";
import { EmptyState } from "../components/ui";

const useProducts = createStore<Product>("products");

export function Deals() {
  const { items: products, loading } = useProducts();
  const discounted = products.filter((p) => p.compareAtPrice && !(p.dealPrice && p.dealEndsAt && new Date(p.dealEndsAt).getTime() > Date.now()));

  if (loading) return <p className="text-sm text-(--color-muted) text-center py-10">Loading…</p>;

  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-(--color-accent-dark)">Save more</p>
        <h1 className="font-display font-extrabold text-3xl mt-1">Deals</h1>
      </div>

      <FlashSale products={products} />

      <section className="space-y-4">
        <h2 className="font-display font-bold text-lg">More offers</h2>
        {discounted.length === 0 ? (
          <EmptyState icon={<Tag size={22} />} title="No extra offers right now" subtitle="Check back soon — new deals drop regularly." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {discounted.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
