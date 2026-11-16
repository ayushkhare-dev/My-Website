import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Check, PackageX } from "lucide-react";
import { createStore } from "../lib/store";
import { api, ApiError } from "../lib/api";
import type { Order, OrderStatus } from "../lib/types";
import { ORDER_TIMELINE } from "../lib/types";
import { fmtMoney, fmtDate } from "../lib/format";
import { Button, Card, Pill } from "../components/ui";
import { useNav } from "../lib/nav";

const useOrders = createStore<Order>("orders");

const TIMELINE_LABEL: Record<OrderStatus, string> = {
  pending: "Ordered",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function OrderDetail() {
  const { orderId, closeOrder } = useNav();
  const { items: orders, refresh } = useOrders();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;

  const isTerminalBad = order.status === "cancelled" || order.status === "refunded";
  const stepIndex = ORDER_TIMELINE.indexOf(order.status);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      await api.put(`/api/orders/${order!.id}/status`, { status: "cancelled" });
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't cancel this order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={closeOrder} className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-muted) hover:text-(--color-ink)">
        <ArrowLeft size={16} /> Back to orders
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">{order.orderNumber ?? `Order ${order.id.slice(0, 8)}`}</h1>
          <p className="text-sm text-(--color-muted) mt-1">Placed {fmtDate(order.placedAt, { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <Pill tone={isTerminalBad ? "danger" : order.status === "delivered" ? "good" : "info"}>{TIMELINE_LABEL[order.status]}</Pill>
      </div>

      {!isTerminalBad && (
        <Card>
          <div className="flex items-center">
            {ORDER_TIMELINE.map((s, i) => (
              <div key={s} className="flex-1 flex items-center last:flex-none">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: i <= stepIndex ? "var(--color-accent)" : "var(--color-accent-soft)",
                      color: i <= stepIndex ? "#fff" : "var(--color-muted)",
                    }}
                    transition={{ duration: 0.4 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  >
                    {i < stepIndex ? <Check size={14} /> : i + 1}
                  </motion.div>
                  <span className={`text-[11px] font-semibold text-center w-16 ${i <= stepIndex ? "text-(--color-ink)" : "text-(--color-muted)"}`}>{TIMELINE_LABEL[s]}</span>
                </div>
                {i < ORDER_TIMELINE.length - 1 && (
                  <div className="flex-1 h-0.5 -mt-5 bg-(--color-accent-soft) overflow-hidden">
                    <motion.div
                      initial={false}
                      animate={{ width: i < stepIndex ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-(--color-accent)"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="font-display font-bold text-sm uppercase tracking-wide text-(--color-muted)">Items</h2>
        <ul className="space-y-3">
          {order.items.map((it) => (
            <li key={it.productId + (it.color ?? "") + (it.size ?? "")} className="flex items-center gap-3">
              <img src={it.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{it.name}</p>
                <p className="text-xs text-(--color-muted)">
                  Qty {it.qty}
                  {it.color ? ` · ${it.color}` : ""}
                  {it.size ? ` · ${it.size}` : ""}
                </p>
              </div>
              <span className="text-sm font-semibold">{fmtMoney(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-(--color-border) pt-3 space-y-1.5">
          <div className="flex justify-between text-sm text-(--color-muted)">
            <span>Subtotal</span>
            <span>{fmtMoney(order.subtotal)}</span>
          </div>
          {!!order.discount && (
            <div className="flex justify-between text-sm text-(--color-good)">
              <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
              <span>-{fmtMoney(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-(--color-muted)">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : fmtMoney(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-display font-bold pt-2 border-t border-(--color-border)">
            <span>Total</span>
            <span>{fmtMoney(order.total)}</span>
          </div>
        </div>
      </Card>

      <Card className="space-y-2 text-sm">
        <h2 className="font-display font-bold text-sm uppercase tracking-wide text-(--color-muted)">Shipping & payment</h2>
        <p>
          {order.address.fullName}, {order.address.line1}, {order.address.city}, {order.address.state} {order.address.pincode}
        </p>
        <p className="text-(--color-muted)">
          {order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"} · {order.paymentStatus ?? "pending"}
        </p>
      </Card>

      {error && <p role="alert" className="text-sm text-(--color-danger)">{error}</p>}

      {(order.status === "pending" || order.status === "confirmed" || order.status === "processing") && (
        <Button variant="danger" disabled={busy} onClick={() => void cancel()}>
          <PackageX size={15} /> {busy ? "Cancelling…" : "Cancel order"}
        </Button>
      )}
    </div>
  );
}
