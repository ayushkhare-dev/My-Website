import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { createStore } from "../lib/store";
import type { Product } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useCart } from "../lib/cart";
import { useNav } from "../lib/nav";
import { Button } from "../components/ui";

const useProducts = createStore<Product>("products");
const FREE_SHIPPING_OVER = 2999;

export function CartDrawer() {
  const { cartOpen, setCartOpen, goTo } = useNav();
  const cart = useCart();
  const { items: products } = useProducts();

  const lines = useMemo(
    () =>
      cart.lines
        .map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }))
        .filter((x): x is { line: typeof cart.lines[number]; product: Product } => !!x.product),
    [cart.lines, products],
  );
  const subtotal = lines.reduce((s, { line, product }) => s + line.qty * product.price, 0);
  const remaining = Math.max(0, FREE_SHIPPING_OVER - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_OVER) * 100);

  function checkout() {
    setCartOpen(false);
    goTo("checkout");
  }

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 z-[85] h-full w-full sm:w-[420px] bg-(--color-surface) shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border)">
              <h2 className="font-display font-bold text-lg">Your bag ({cart.count})</h2>
              <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="p-2 rounded-xl hover:bg-(--color-accent-soft)">
                <X size={18} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                <ShoppingBag size={32} className="text-(--color-muted)" />
                <p className="font-semibold">Your bag is empty</p>
                <p className="text-sm text-(--color-muted)">Add something you love and it'll show up here.</p>
                <Button onClick={() => setCartOpen(false)}>Continue shopping</Button>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-(--color-border)">
                  {remaining > 0 ? (
                    <p className="text-xs text-(--color-muted) mb-2">
                      You're <span className="font-semibold text-(--color-accent-dark)">{fmtMoney(remaining)}</span> away from free shipping
                    </p>
                  ) : (
                    <p className="text-xs text-(--color-good) font-semibold mb-2">You've unlocked free shipping!</p>
                  )}
                  <div className="h-1.5 rounded-full bg-(--color-accent-soft) overflow-hidden">
                    <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} className="h-full bg-(--color-accent)" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-(--color-border)">
                  <AnimatePresence initial={false}>
                    {lines.map(({ line, product }, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        className="flex gap-3 py-4"
                      >
                        <img src={product.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 cursor-pointer" onClick={() => setCartOpen(false)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{product.name}</p>
                          <p className="text-xs text-(--color-muted)">{product.category}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-(--color-border) rounded-lg">
                              <button onClick={() => cart.setQty(product.id, line.qty - 1)} className="p-1.5 hover:bg-(--color-accent-soft) rounded-l-lg">
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center text-xs font-semibold">{line.qty}</span>
                              <button
                                onClick={() => cart.setQty(product.id, Math.min(product.stock, line.qty + 1))}
                                className="p-1.5 hover:bg-(--color-accent-soft) rounded-r-lg"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-display font-bold text-sm">{fmtMoney(product.price * line.qty)}</span>
                          </div>
                        </div>
                        <button onClick={() => cart.remove(product.id)} aria-label="Remove" className="p-1.5 h-fit text-(--color-muted) hover:text-(--color-danger)">
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t border-(--color-border) p-5 space-y-2">
                  <div className="flex justify-between text-sm text-(--color-muted)">
                    <span>Subtotal</span>
                    <span>{fmtMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-display font-bold text-lg">
                    <span>Total</span>
                    <span>{fmtMoney(subtotal)}</span>
                  </div>
                  <Button className="w-full mt-2" onClick={checkout}>
                    Proceed to checkout
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
