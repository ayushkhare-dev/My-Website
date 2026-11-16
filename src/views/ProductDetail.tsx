import { useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, BadgeCheck, Check, Heart, Minus, Plus, ShoppingBag, Star, Truck, Zap } from "lucide-react";
import { createStore } from "../lib/store";
import { api } from "../lib/api";
import type { Product, Review, WishlistItem } from "../lib/types";
import { fmtMoney, fmtDate } from "../lib/format";
import { useCart } from "../lib/cart";
import { useFlyToCart } from "../lib/flyToCart";
import { useAddedNotice } from "../lib/addedNotice";
import { useNav } from "../lib/nav";
import { Button, Card } from "../components/ui";
import { ProductCard } from "../components/ProductCard";

const useProducts = createStore<Product>("products");
const useReviews = createStore<Review>("reviews");
const useWishlist = createStore<WishlistItem>("wishlist");

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ProductDetail() {
  const { productId, closeProduct, openProduct, setCartOpen } = useNav();
  const { items: products, refresh: refreshProducts } = useProducts();
  const cart = useCart();
  const { fly } = useFlyToCart();
  const { notify } = useAddedNotice();
  const { items: reviews, refresh: refreshReviews } = useReviews();
  const { items: wishlist, refresh: refreshWishlist } = useWishlist();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [activeImg, setActiveImg] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const product = products.find((p) => p.id === productId);

  const productReviews = useMemo(
    () => reviews.filter((r) => r.productId === product?.id).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [reviews, product?.id],
  );
  const related = useMemo(() => (product ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4) : []), [products, product]);

  if (!product) return null;

  const wishItem = wishlist.find((w) => w.productId === product.id);
  const dealActive = product.dealPrice && product.dealEndsAt && new Date(product.dealEndsAt).getTime() > Date.now();
  const displayPrice = dealActive ? product.dealPrice! : product.price;
  const compareAt = dealActive ? product.price : product.compareAtPrice;

  function addToCart(openDrawer: boolean) {
    cart.add(product!.id, qty, { color, size });
    if (imgRef.current) fly(product!.images[0], imgRef.current);
    notify(product!.name, product!.images[0]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
    if (openDrawer) setCartOpen(true);
  }

  async function toggleWishlist() {
    await api.post<{ saved: boolean }>("/api/wishlist/toggle", { productId: product!.id });
    void refreshWishlist();
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;
    await api.post("/api/reviews", {
      productId: product!.id,
      author: author.trim(),
      rating,
      comment: comment.trim(),
    });
    setAuthor("");
    setComment("");
    setRating(5);
    void refreshReviews();
    void refreshProducts();
  }

  return (
    <div className="space-y-14 bg-(--color-canvas) text-(--color-ink) rounded-[28px] p-5 sm:p-10 -mx-4 sm:mx-0">
      <button onClick={closeProduct} className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-muted) hover:text-(--color-ink)">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="flex gap-3 lg:sticky lg:top-28 self-start">
          <div className="flex flex-col gap-2.5 shrink-0">
            {product.images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActiveImg(i)}
                data-cursor="view"
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                  i === activeImg ? "border-(--color-accent)" : "border-(--color-border) hover:border-(--color-muted)"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={product.images[activeImg]}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="aspect-square rounded-3xl overflow-hidden bg-(--color-accent-soft) border border-(--color-border)"
              >
                <img ref={imgRef} src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-14">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-accent-dark)">{product.brand}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold mt-1">{product.name}</h1>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-(--color-muted)">
              <Star size={15} className="fill-(--color-warn) text-(--color-warn)" />
              <span className="font-semibold text-(--color-ink)">{product.rating.toFixed(1)}</span>
              <span>· {productReviews.length || product.reviewCount} reviews</span>
            </div>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="font-display text-2xl font-extrabold">{fmtMoney(displayPrice)}</span>
              {compareAt && <span className="text-(--color-muted) line-through">{fmtMoney(compareAt)}</span>}
              {dealActive && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-(--color-accent) px-2 py-1 rounded-full">
                  <Zap size={11} className="fill-white" /> Flash sale
                </span>
              )}
            </div>
            <p className="text-sm text-(--color-muted) mt-4 leading-relaxed">{product.description}</p>

            {product.colors && (
              <div className="mt-6">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">Color</p>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={hoverColor ?? color ?? product.colors[0].name}
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 3 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs font-semibold text-(--color-ink)"
                    >
                      {hoverColor ?? color ?? product.colors[0].name}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="flex gap-3">
                  {product.colors.map((c) => {
                    const active = (color ?? product.colors![0].name) === c.name;
                    return (
                      <motion.button
                        key={c.name}
                        onClick={() => setColor(c.name)}
                        onMouseEnter={() => setHoverColor(c.name)}
                        onMouseLeave={() => setHoverColor(null)}
                        whileHover={{ scale: 1.12, y: -2 }}
                        whileTap={{ scale: 0.94 }}
                        aria-label={c.name}
                        className="relative w-9 h-9 rounded-full flex items-center justify-center"
                      >
                        <span style={{ background: c.hex }} className="absolute inset-1 rounded-full border border-black/10" />
                        {active && (
                          <motion.span
                            layoutId="color-ring"
                            className="absolute inset-0 rounded-full border-2 border-(--color-accent)"
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.sizes && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted) mb-2">Size</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((s) => {
                    const active = (size ?? product.sizes![0]) === s;
                    return (
                      <motion.button
                        key={s}
                        onClick={() => setSize(s)}
                        whileTap={{ scale: 0.94 }}
                        className="relative px-4 py-2 rounded-lg text-sm font-medium overflow-hidden"
                      >
                        {active && (
                          <motion.span
                            layoutId="size-fill"
                            className="absolute inset-0 bg-(--color-accent-soft) border-2 border-(--color-accent) rounded-lg"
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          />
                        )}
                        {!active && <span className="absolute inset-0 border border-(--color-border) rounded-lg" />}
                        <span className={`relative z-10 ${active ? "text-(--color-accent-dark)" : ""}`}>{s}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-(--color-muted) mt-6">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center border border-(--color-border) rounded-xl">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5 hover:bg-(--color-accent-soft) rounded-l-xl" aria-label="Decrease quantity">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="p-2.5 hover:bg-(--color-accent-soft) rounded-r-xl"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => void toggleWishlist()}
                aria-label="Toggle wishlist"
                className={`p-3 rounded-xl border transition ${
                  wishItem ? "bg-(--color-danger) border-(--color-danger) text-white" : "border-(--color-border) text-(--color-muted) hover:text-(--color-danger)"
                }`}
              >
                <Heart size={18} className={wishItem ? "fill-white" : ""} />
              </button>
            </div>

            <div className="flex gap-3 mt-3">
              <Button variant="secondary" onClick={() => addToCart(false)} disabled={product.stock <= 0} className="flex-1">
                {added ? <Check size={16} /> : <ShoppingBag size={16} />}
                {added ? "Added" : "Add to cart"}
              </Button>
              <Button onClick={() => addToCart(true)} disabled={product.stock <= 0} className="flex-1">
                Buy now
              </Button>
            </div>
          </motion.div>

          <Reveal>
            <section className="pt-6 border-t border-(--color-border)">
              <p className="section-number mb-3 text-(--color-muted)">description</p>
              <ul className="space-y-2 max-w-2xl">
                {product.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-(--color-good)" /> {h}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.05}>
            <section className="pt-6 border-t border-(--color-border)">
              <p className="section-number mb-3 text-(--color-muted)">specifications</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl text-sm">
                <div className="flex justify-between border-b border-(--color-border) py-2">
                  <dt className="text-(--color-muted)">Brand</dt>
                  <dd className="font-medium">{product.brand}</dd>
                </div>
                <div className="flex justify-between border-b border-(--color-border) py-2">
                  <dt className="text-(--color-muted)">Category</dt>
                  <dd className="font-medium">{product.category}</dd>
                </div>
                <div className="flex justify-between border-b border-(--color-border) py-2">
                  <dt className="text-(--color-muted)">In stock</dt>
                  <dd className="font-medium">{product.stock} units</dd>
                </div>
                <div className="flex justify-between border-b border-(--color-border) py-2">
                  <dt className="text-(--color-muted)">Rating</dt>
                  <dd className="font-medium">{product.rating.toFixed(1)} / 5</dd>
                </div>
              </dl>
            </section>
          </Reveal>

          <Reveal delay={0.1}>
            <section className="pt-6 border-t border-(--color-border)">
              <p className="section-number mb-3 text-(--color-muted)">delivery</p>
              <div className="max-w-2xl space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <Truck size={16} className="text-(--color-accent-dark)" /> Free shipping on orders over ₹2,999 — arrives in 3–5 business days.
                </p>
                <p className="text-(--color-muted)">Cash on delivery available. Easy 7-day returns on unused items in original packaging.</p>
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.05}>
            <section className="pt-6 border-t border-(--color-border)">
              <p className="section-number mb-4 text-(--color-muted)">reviews ({productReviews.length || product.reviewCount})</p>
              <Card>
                <form onSubmit={submitReview} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-5">
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Your name"
                    className="rounded-xl border border-(--color-border) px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) bg-(--color-surface)"
                  />
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="rounded-xl border border-(--color-border) px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) bg-(--color-surface)"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} star{r > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  <Button type="submit">Post review</Button>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience…"
                    className="rounded-xl border border-(--color-border) px-3 py-2.5 text-sm sm:col-span-3 focus:outline-none focus:ring-2 focus:ring-(--color-accent) bg-(--color-surface)"
                  />
                </form>

                {productReviews.length === 0 ? (
                  <p className="text-sm text-(--color-muted) text-center py-6">No reviews yet — be the first to write one.</p>
                ) : (
                  <ul className="divide-y divide-(--color-border)">
                    {productReviews.map((r) => (
                      <li key={r.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm flex items-center gap-1.5">
                            {r.author}
                            {r.verified && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-(--color-good) bg-(--color-good)/10 px-1.5 py-0.5 rounded-full">
                                <BadgeCheck size={11} /> Verified purchase
                              </span>
                            )}
                          </p>
                          <span className="text-xs text-(--color-muted)">{fmtDate(r.date)}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className={i < r.rating ? "fill-(--color-warn) text-(--color-warn)" : "text-(--color-border)"} />
                          ))}
                        </div>
                        <p className="text-sm text-(--color-muted) mt-1.5">{r.comment}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          </Reveal>
        </div>
      </div>

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display font-bold text-lg">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
