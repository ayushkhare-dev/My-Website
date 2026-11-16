import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Lock, MapPin, ShoppingBag, Tag, Truck, Wallet, X, Zap } from "lucide-react";
import { createStore } from "../lib/store";
import { api, ApiError } from "../lib/api";
import type { Address, Order, Product, SavedAddress } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useCart } from "../lib/cart";
import { useNav } from "../lib/nav";
import { Button, Card, EmptyState, Field, inputCls } from "../components/ui";

const useProducts = createStore<Product>("products");
const useAddresses = createStore<SavedAddress>("addresses");

const STANDARD_SHIPPING = 99;
const EXPRESS_SHIPPING = 249;
const FREE_SHIPPING_OVER = 2999;

export function Checkout() {
  const { goTo } = useNav();
  const cart = useCart();
  const { items: products } = useProducts();
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [address, setAddress] = useState<Address>({ fullName: "", email: "", line1: "", city: "", state: "", pincode: "", phone: "" });
  const { items: savedAddresses } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  useEffect(() => {
    if (selectedAddressId || savedAddresses.length === 0) return;
    const def = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    setSelectedAddressId(def.id);
    setAddress({ ...def, email: address.email });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses]);

  function chooseSavedAddress(a: SavedAddress) {
    setSelectedAddressId(a.id);
    setAddress({ ...a, email: address.email });
    setSaveAddress(false);
  }

  function editingNewAddress(patch: Partial<Address>) {
    setSelectedAddressId(null);
    setAddress({ ...address, ...patch });
  }

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const lines = useMemo(
    () =>
      cart.lines
        .map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }))
        .filter((x): x is { line: typeof cart.lines[number]; product: Product } => !!x.product),
    [cart.lines, products],
  );
  const subtotal = lines.reduce((s, { line, product }) => s + line.qty * (product.dealPrice || product.price), 0);
  const shipping = subtotal === 0 ? 0 : delivery === "express" ? EXPRESS_SHIPPING : subtotal >= FREE_SHIPPING_OVER ? 0 : STANDARD_SHIPPING;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(subtotal - discount + shipping, 0);

  useEffect(() => {
    setCoupon(null);
    setCouponError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal === 0]);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.post<{ code: string; discount: number }>("/api/coupons/validate", { code: couponInput.trim(), subtotal });
      setCoupon({ code: res.code, discount: res.discount });
    } catch (e) {
      setCoupon(null);
      setCouponError(e instanceof ApiError ? e.message : "Couldn't validate that coupon.");
    } finally {
      setCheckingCoupon(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPlacing(true);
    setError(null);
    try {
      const order = await api.post<Order>("/api/checkout", {
        items: lines.map(({ line }) => ({ productId: line.productId, qty: line.qty, color: line.color ?? null, size: line.size ?? null })),
        address,
        delivery,
        paymentMethod,
        couponCode: coupon?.code ?? null,
      });
      if (saveAddress && !selectedAddressId) {
        void api.post("/api/addresses", address).catch(() => {});
      }
      setPlacedOrder(order);
      cart.clear();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong placing your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (placedOrder) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center py-16">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-(--color-good) text-white flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircle2 size={30} />
        </motion.div>
        <h1 className="font-display text-2xl font-extrabold">Order placed!</h1>
        <p className="text-sm text-(--color-muted) mt-1 font-semibold">{placedOrder.orderNumber}</p>
        <p className="text-sm text-(--color-muted) mt-2">
          Your order for {fmtMoney(placedOrder.total)} is confirmed
          {placedOrder.paymentMethod === "cod" ? " — pay on delivery." : ". A simulated online payment was marked as paid for this demo."}
        </p>
        <div className="flex gap-3 justify-center mt-7">
          <Button variant="secondary" onClick={() => goTo("shop")}>
            Continue shopping
          </Button>
          <Button onClick={() => goTo("orders")}>View orders</Button>
        </div>
      </motion.div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={24} />}
        title="Your bag is empty"
        subtitle="Add a few things from the shop and they'll show up here, ready for checkout."
        action={{ label: "Browse the shop", onClick: () => goTo("shop") }}
      />
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-extrabold">Checkout</h1>

        <Card className="space-y-3">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide text-(--color-muted)">Contact information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" required className={inputCls} value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input required className={inputCls} value={address.phone} onChange={(e) => editingNewAddress({ phone: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide text-(--color-muted)">Shipping address</h2>

          {savedAddresses.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {savedAddresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => chooseSavedAddress(a)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedAddressId === a.id ? "border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent-dark)" : "border-(--color-border) text-(--color-muted) hover:text-(--color-ink)"
                  }`}
                >
                  <MapPin size={12} /> {a.fullName} · {a.city}
                </button>
              ))}
              <button
                type="button"
                onClick={() => editingNewAddress({})}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedAddressId === null ? "border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent-dark)" : "border-(--color-border) text-(--color-muted) hover:text-(--color-ink)"
                }`}
              >
                + New address
              </button>
            </div>
          )}

          <Field label="Full name">
            <input required className={inputCls} value={address.fullName} onChange={(e) => editingNewAddress({ fullName: e.target.value })} />
          </Field>
          <Field label="Address">
            <input required className={inputCls} value={address.line1} onChange={(e) => editingNewAddress({ line1: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City">
              <input required className={inputCls} value={address.city} onChange={(e) => editingNewAddress({ city: e.target.value })} />
            </Field>
            <Field label="State">
              <input required className={inputCls} value={address.state} onChange={(e) => editingNewAddress({ state: e.target.value })} />
            </Field>
            <Field label="Pincode">
              <input required className={inputCls} value={address.pincode} onChange={(e) => editingNewAddress({ pincode: e.target.value })} />
            </Field>
          </div>
          {selectedAddressId === null && (
            <label className="flex items-center gap-2 text-sm text-(--color-muted) pt-1">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="rounded accent-(--color-accent)" />
              Save this address for next time
            </label>
          )}
        </Card>

        <Card className="space-y-2.5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide text-(--color-muted)">Delivery method</h2>
          <button
            type="button"
            onClick={() => setDelivery("standard")}
            className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition ${
              delivery === "standard" ? "border-(--color-accent) bg-(--color-accent-soft)" : "border-(--color-border)"
            }`}
          >
            <span className="flex items-center gap-3">
              <Truck size={18} className="text-(--color-accent-dark)" />
              <span>
                <span className="block text-sm font-semibold">Standard delivery</span>
                <span className="block text-xs text-(--color-muted)">3–5 business days</span>
              </span>
            </span>
            <span className="text-sm font-semibold">{subtotal >= FREE_SHIPPING_OVER ? "Free" : fmtMoney(STANDARD_SHIPPING)}</span>
          </button>
          <button
            type="button"
            onClick={() => setDelivery("express")}
            className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition ${
              delivery === "express" ? "border-(--color-accent) bg-(--color-accent-soft)" : "border-(--color-border)"
            }`}
          >
            <span className="flex items-center gap-3">
              <Zap size={18} className="text-(--color-accent-dark)" />
              <span>
                <span className="block text-sm font-semibold">Express delivery</span>
                <span className="block text-xs text-(--color-muted)">1–2 business days</span>
              </span>
            </span>
            <span className="text-sm font-semibold">{fmtMoney(EXPRESS_SHIPPING)}</span>
          </button>
        </Card>

        <Card className="space-y-2.5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide text-(--color-muted)">Payment</h2>
          <button
            type="button"
            onClick={() => setPaymentMethod("cod")}
            className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
              paymentMethod === "cod" ? "border-(--color-accent) bg-(--color-accent-soft)" : "border-(--color-border)"
            }`}
          >
            <Truck size={18} className="text-(--color-accent-dark)" />
            <span>
              <span className="block text-sm font-semibold">Cash on delivery</span>
              <span className="block text-xs text-(--color-muted)">Pay in cash when your order arrives.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("online")}
            className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
              paymentMethod === "online" ? "border-(--color-accent) bg-(--color-accent-soft)" : "border-(--color-border)"
            }`}
          >
            <Wallet size={18} className="text-(--color-accent-dark)" />
            <span>
              <span className="block text-sm font-semibold">Pay online (demo)</span>
              <span className="block text-xs text-(--color-muted)">Simulated for this preview — no card details are collected.</span>
            </span>
          </button>
          <p className="flex items-center gap-1.5 text-xs text-(--color-muted) pt-1">
            <Lock size={12} /> Your information is encrypted and only used for this order.
          </p>
        </Card>
      </div>

      <Card className="sticky top-24 space-y-4">
        <h2 className="font-display font-bold">Order summary</h2>
        <ul className="space-y-3 max-h-64 overflow-y-auto">
          {lines.map(({ line, product }) => (
            <li key={product.id} className="flex items-center gap-3">
              <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-(--color-muted)">Qty {line.qty}</p>
              </div>
              <span className="text-sm font-semibold">{fmtMoney((product.dealPrice || product.price) * line.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-1.5">
          {coupon ? (
            <div className="flex items-center justify-between rounded-lg bg-(--color-good)/10 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-(--color-good)">
                <Tag size={12} /> {coupon.code} applied
              </span>
              <button
                type="button"
                onClick={() => {
                  setCoupon(null);
                  setCouponInput("");
                }}
                className="text-(--color-muted) hover:text-(--color-danger)"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code"
                className="flex-1 rounded-lg border border-(--color-border) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) bg-(--color-surface)"
              />
              <Button type="button" variant="secondary" disabled={checkingCoupon} onClick={applyCoupon} className="!px-3.5 !py-2 text-sm">
                {checkingCoupon ? "…" : "Apply"}
              </Button>
            </div>
          )}
          {couponError && <p className="text-xs text-(--color-danger)">{couponError}</p>}
        </div>

        <div className="border-t border-(--color-border) pt-3 space-y-1.5">
          <div className="flex justify-between text-sm text-(--color-muted)">
            <span>Subtotal</span>
            <span>{fmtMoney(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-(--color-good)">
              <span>Discount</span>
              <span>-{fmtMoney(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-(--color-muted)">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : fmtMoney(shipping)}</span>
          </div>
          <div className="flex justify-between font-display font-bold pt-2 border-t border-(--color-border)">
            <span>Total</span>
            <span>{fmtMoney(total)}</span>
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-(--color-danger)">{error}</p>}
        <Button type="submit" disabled={placing} className="w-full">
          {placing ? "Placing order…" : `Place order · ${fmtMoney(total)}`}
        </Button>
      </Card>
    </form>
  );
}
