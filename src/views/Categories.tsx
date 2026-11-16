import { createStore } from "../lib/store";
import type { Product } from "../lib/types";
import { CategoryShowcase } from "../components/CategoryShowcase";

const useProducts = createStore<Product>("products");

export function Categories() {
  const { items: products } = useProducts();

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-(--color-accent-dark)">Browse</p>
        <h1 className="font-display font-extrabold text-3xl mt-1">Categories</h1>
        <p className="text-sm text-(--color-muted) mt-2 max-w-lg">
          {products.length} products across {new Set(products.map((p) => p.category)).size} categories — pick where to start.
        </p>
      </div>
      <CategoryShowcase products={products} />
    </div>
  );
}
