import { Heart, ShoppingBag } from "lucide-react";
import { createStore } from "../lib/store";
import type { Product, WishlistItem } from "../lib/types";
import { ProductCard } from "../components/ProductCard";
import { EmptyState, Button } from "../components/ui";
import { useNav } from "../lib/nav";
import { useCart } from "../lib/cart";

const useProducts = createStore<Product>("products");
const useWishlist = createStore<WishlistItem>("wishlist");

export function Wishlist() {
  const { items: products } = useProducts();
  const { items: wishlist, loading, remove: removeWish } = useWishlist();
  const { goTo, setCartOpen } = useNav();
  const cart = useCart();

  const saved = wishlist
    .map((w) => ({ wish: w, product: products.find((p) => p.id === w.productId) }))
    .filter((x): x is { wish: WishlistItem; product: Product } => !!x.product);

  function moveToCart(wishId: string, product: Product) {
    cart.add(product.id, 1);
    void removeWish(wishId);
    setCartOpen(true);
  }

  function moveAllToCart() {
    saved.forEach(({ product }) => cart.add(product.id, 1));
    saved.forEach(({ wish }) => void removeWish(wish.id));
    setCartOpen(true);
  }

  if (loading) return <p className="text-sm text-(--color-muted) text-center py-10">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-(--color-accent-dark)">Saved</p>
          <h1 className="font-display font-extrabold text-3xl mt-1">Your wishlist</h1>
        </div>
        {saved.length > 0 && (
          <Button variant="secondary" onClick={moveAllToCart}>
            <ShoppingBag size={15} /> Move all to bag
          </Button>
        )}
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon={<Heart size={22} />}
          title="Nothing saved yet"
          subtitle="Tap the heart on any product to keep track of what you love."
          action={{ label: "Browse the shop", onClick: () => goTo("shop") }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {saved.map(({ wish, product }, i) => (
            <div key={product.id} className="space-y-2">
              <ProductCard product={product} index={i} />
              <button
                onClick={() => moveToCart(wish.id, product)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-(--color-accent-dark) hover:underline py-1"
              >
                <ShoppingBag size={12} /> Move to bag
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
