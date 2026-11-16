import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Heart, Minus, Plus, ShoppingBag, Star, X } from "lucide-react";
import { useQuickView } from "../lib/quickView";
import { useCart } from "../lib/cart";
import { useNav } from "../lib/nav";
import { api } from "../lib/api";
import { fmtMoney } from "../lib/format";

export function QuickViewModal() {
  const { product, close } = useQuickView();
  const cart = useCart();
  const { openProduct } = useNav();
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);

  useEffect(() => {
    setColor(null);
    setSize(null);
    setQty(1);
    setAdded(false);
    setWished(false);
  }, [product?.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (product) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product, close]);

  if (!product) return <AnimatePresence>{null}</AnimatePresence>;

  const dealActive = product.dealPrice && product.dealEndsAt && new Date(product.dealEndsAt).getTime() > Date.now();
  const displayPrice = dealActive ? product.dealPrice! : product.price;
  const compareAt = dealActive ? product.price : product.compareAtPrice;

  function addToCart() {
    cart.add(product!.id, qty, { color, size });
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  }

  function toggleWish() {
    setWished((w) => !w);
    void api.post("/api/wishlist/toggle", { productId: product!.id });
  }

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[90vw] lg:max-w-6xl h-[85vh] grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-3xl overflow-hidden bg-(--color-surface) border border-(--color-border) shadow-2xl"
          >
            <button onClick={close} aria-label="Close" className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60">
              <X size={18} />
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full bg-(--color-accent-soft) overflow-hidden"
            >
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="p-6 sm:p-9 flex flex-col overflow-y-auto"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-(--color-accent-dark)">{product.brand}</p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-1.5">{product.name}</h2>
              <div className="flex items-center gap-1.5 mt-2 text-sm text-(--color-muted)">
                <Star size={14} className="fill-(--color-warn) text-(--color-warn)" />
                {product.rating.toFixed(1)} <span className="opacity-60">({product.reviewCount})</span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="font-display text-2xl font-extrabold">{fmtMoney(displayPrice)}</span>
                {compareAt && <span className="text-sm text-(--color-muted) line-through">{fmtMoney(compareAt)}</span>}
              </div>
              <p className="text-sm text-(--color-muted) mt-3 line-clamp-3">{product.description}</p>

              {product.colors && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-(--color-muted) mb-1.5">Color</p>
                  <div className="flex gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setColor(c.name)}
                        aria-label={c.name}
                        style={{ background: c.hex }}
                        className={`w-7 h-7 rounded-full border-2 transition ${(color ?? product.colors![0].name) === c.name ? "border-(--color-accent) scale-110" : "border-(--color-border)"}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-(--color-muted) mb-1.5">Size</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                          (size ?? product.sizes![0]) === s ? "border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent-dark)" : "border-(--color-border)"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-5">
                <div className="flex items-center gap-3 mb-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-(--color-muted)">Qty</p>
                  <div className="flex items-center gap-3 rounded-full border border-(--color-border) px-2.5 py-1.5">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="hover:text-(--color-accent)">
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label="Increase quantity" className="hover:text-(--color-accent)">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={addToCart}
                    disabled={product.stock <= 0}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-40 ${
                      added ? "bg-(--color-good) text-white" : "bg-(--color-ink) text-(--color-canvas) hover:bg-(--color-accent)"
                    }`}
                  >
                    {added ? <Check size={15} /> : <Plus size={15} />} {added ? "Added" : "Add to Cart"}
                  </button>
                  <button
                    onClick={toggleWish}
                    aria-label="Toggle wishlist"
                    className={`w-12 flex items-center justify-center rounded-xl border transition-colors ${
                      wished ? "bg-(--color-danger) border-(--color-danger) text-white" : "border-(--color-border) hover:bg-(--color-accent-soft)"
                    }`}
                  >
                    <Heart size={16} className={wished ? "fill-white" : ""} />
                  </button>
                  <button
                    onClick={() => {
                      close();
                      openProduct(product.id);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-(--color-border) px-4 py-3 text-sm font-semibold hover:bg-(--color-accent-soft)"
                  >
                    <ShoppingBag size={15} /> Details
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
