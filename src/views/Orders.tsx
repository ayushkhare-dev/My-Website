import { motion } from "motion/react";
import { ChevronRight, ClipboardList } from "lucide-react";
import { createStore } from "../lib/store";
import type { Order, OrderStatus } from "../lib/types";
import { fmtMoney, fmtDate } from "../lib/format";
import { Card, EmptyState, Pill } from "../components/ui";
import { useNav } from "../lib/nav";

const useOrders = createStore<Order>("orders");

const STATUS_TONE: Record<OrderStatus, "good" | "warn" | "danger" | "info"> = {
  pending: "info",
  confirmed: "info",
  processing: "warn",
  shipped: "warn",
  delivered: "good",
  cancelled: "danger",
  refunded: "danger",
};

export function Orders() {
  const { items: orders, loading } = useOrders();
  const { openOrder } = useNav();

  const sorted = orders.slice().sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));

  if (loading) return <p className="text-sm text-(--color-muted) text-center py-10">Loading orders…</p>;

  if (sorted.length === 0) {
    return <EmptyState icon={<ClipboardList size={22} />} title="No orders yet" subtitle="Once you check out, your orders will show up here with live status." />;
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-extrabold">Your orders</h1>
      <div className="space-y-3">
        {sorted.map((o, i) => (
          <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
            <Card className="!p-0">
              <button onClick={() => openOrder(o.id)} className="w-full flex items-center gap-4 p-4 text-left">
                <div className="flex -space-x-3 shrink-0">
                  {o.items.slice(0, 3).map((it) => (
                    <img key={it.productId} src={it.image} alt="" className="w-11 h-11 rounded-lg object-cover border-2 border-(--color-surface)" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {o.orderNumber ? `${o.orderNumber} · ` : ""}
                    {o.items.length} item{o.items.length > 1 ? "s" : ""} · {fmtMoney(o.total)}
                  </p>
                  <p className="text-xs text-(--color-muted)">Placed {fmtDate(o.placedAt, { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <Pill tone={STATUS_TONE[o.status]}>{o.status}</Pill>
                <ChevronRight size={16} className="text-(--color-muted)" />
              </button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
