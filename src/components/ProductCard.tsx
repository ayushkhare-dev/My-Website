import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { ArrowRight, Check, Eye, Heart, Plus, Star } from "lucide-react";
import type { Product } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useCart } from "../lib/cart";
import { useFlyToCart } from "../lib/flyToCart";
import { useAddedNotice } from "../lib/addedNotice";
import { createStore } from "../lib/store";
import { api } from "../lib/api";
import type { WishlistItem } from "../lib/types";
import { useNav } from "../lib/nav";
import { useQuickView } from "../lib/quickView";

const useWishlist = createStore<WishlistItem>("wishlist");

export function ProductCard({ product, index = 0 }: { product: Product; index?: number; tone?: "surface" | "dark" }) {
  const cart = useCart();
  const { fly } = useFlyToCart();
  const { notify } = useAddedNotice();
  const { openProduct } = useNav();
  const { open: openQuickView } = useQuickView();
  const { items: wishlist, refresh: refreshWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const outOfStock = product.stock <= 0;
  const wishItem = wishlist.find((w) => w.productId === product.id);
  const dealActive = product.dealPrice && product.dealEndsAt && new Date(product.dealEndsAt).getTime() > Date.now();
  const displayPrice = dealActive ? product.dealPrice! : product.price;
  const compareAt = dealActive ? product.price : product.compareAtPrice;

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 260, damping: 22 });
  const sry = useSpring(ry, { stiffness: 260, damping: 22 });
  const cx = useMotionValue(0.5);
  const cy = useMotionValue(0.5);
  const scx = useSpring(cx, { stiffness: 220, damping: 26 });
  const scy = useSpring(cy, { stiffness: 220, damping: 26 });

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 10);
    rx.set((0.5 - py) * 10);
    cx.set(px);
    cy.set(py);
  }
  function onEnter() {
    setHovered(true);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
    setHovered(false);
  }

  function addToCart(e: MouseEvent) {
    e.stopPropagation();
    if (outOfStock) return;
    cart.add(product.id, 1);
    if (imgRef.current) fly(product.images[0], imgRef.current);
    notify(product.name, product.images[0]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  function toggleWish(e: MouseEvent) {
    e.stopPropagation();
    void api.post("/api/wishlist/toggle", { productId: product.id }).then(() => refreshWishlist());
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openProduct(product.id);
    }
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      data-cursor="explore"
      onClick={() => openProduct(product.id)}
      onKeyDown={onKeyDown}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      initial={{ y: 16 }}
      animate={{ y: 0 }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className="group relative cursor-pointer text-left rounded-[26px] overflow-hidden bg-(--color-surface) border border-(--color-border) hover:border-(--color-accent)/60 transition-[border-color,box-shadow] hover:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
    >
      <div className="relative aspect-square overflow-hidden rounded-[20px] m-3 bg-(--color-canvas-soft)">
        <motion.img
          ref={imgRef}
          src={product.images[0]}
          alt={product.name}
          animate={{ scale: hovered ? 1.08 : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full object-cover"
        />
        {outOfStock && <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-sm font-semibold">Out of stock</span>}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 pointer-events-none"
        />

        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 6 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white pointer-events-none"
        >
          VIEW
        </motion.span>

        <motion.button
          onClick={toggleWish}
          whileTap={{ scale: 0.8 }}
          aria-label="Toggle wishlist"
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
            wishItem ? "bg-(--color-danger) text-white" : "bg-(--color-surface)/90 text-(--color-ink) hover:text-(--color-danger)"
          }`}
        >
          <motion.span animate={wishItem ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
            <Heart size={14} className={wishItem ? "fill-white" : ""} />
          </motion.span>
        </motion.button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            openQuickView(product);
          }}
          aria-label="Quick view"
          className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 w-8 h-8 flex items-center justify-center rounded-full bg-(--color-surface)/90 text-(--color-ink) shadow-md"
        >
          <Eye size={14} />
        </button>
      </div>

      <div className="px-4 pb-4 pt-1 relative z-10">
        <span className="inline-flex text-[10px] font-bold uppercase tracking-wide text-(--color-accent) bg-(--color-accent-soft) rounded-full px-2 py-0.5">
          {product.category}
        </span>
        <div className="flex items-start justify-between gap-2 mt-2">
          <motion.div
            className="min-w-0"
            animate={{ y: hovered ? -1 : 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.h3
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-display font-bold text-sm leading-snug line-clamp-2 min-h-[2.4em]"
            >
              {product.name}
            </motion.h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-(--color-muted)">
              <Star size={12} className="fill-(--color-warn) text-(--color-warn)" />
              {product.rating.toFixed(1)}
              <span className="opacity-60">({product.reviewCount})</span>
            </div>
            <motion.div
              className="flex items-baseline gap-2 mt-1.5"
              animate={{ x: hovered ? 2 : 0 }}
              transition={{ duration: 0.3, delay: 0.03 }}
            >
              <span className="font-display font-extrabold">{fmtMoney(displayPrice)}</span>
              {compareAt && <span className="text-xs line-through text-(--color-muted)">{fmtMoney(compareAt)}</span>}
            </motion.div>
            <p className="text-[11px] text-(--color-muted) line-clamp-1 mt-1 max-h-0 overflow-hidden group-hover:max-h-4 transition-all duration-300">
              {product.description}
            </p>
          </motion.div>

          <button
            onClick={addToCart}
            disabled={outOfStock}
            aria-label="Add to cart"
            className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-[transform,background-color,border-color,color] duration-300 group-hover:rotate-90 group-hover:bg-(--color-accent) group-hover:border-(--color-accent) group-hover:text-white disabled:opacity-40 ${
              added ? "bg-(--color-good) border-(--color-good) text-white rotate-0" : "border-(--color-border) text-(--color-ink)"
            }`}
          >
            {added ? <Check size={15} /> : <Plus size={15} />}
          </button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openProduct(product.id);
          }}
          data-cursor="open"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-(--color-accent-dark) opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
        >
          Explore <ArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}
