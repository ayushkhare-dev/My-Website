import { useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { AlertTriangle, LayoutDashboard, Package, Pencil, Plus, ShoppingCart, Tag, Trash2 } from "lucide-react";
import { createStore } from "../lib/store";
import { api, ApiError } from "../lib/api";
import type { Coupon, Order, OrderStatus, Product } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { fmtMoney, fmtDate } from "../lib/format";
import { Button, Card, EmptyState, Field, Modal, Pill, inputCls } from "../components/ui";
import { DonutChart, BarChart } from "../components/charts";

interface AdminStats {
  revenue: number;
  orderCount: number;
  pending: number;
  productCount: number;
  byCategory: { label: string; value: number }[];
  lowStock: { id: string; name: string; stock: number }[];
  topProducts: { productId: string; name: string; unitsSold: number; revenue: number }[];
}

const useProducts = createStore<Product>("products");
const useOrders = createStore<Order>("orders");
const useCoupons = createStore<Coupon>("coupons");

const STATUS_TONE: Record<OrderStatus, "good" | "warn" | "danger" | "info"> = {
  pending: "info",
  confirmed: "info",
  processing: "warn",
  shipped: "warn",
  delivered: "good",
  cancelled: "danger",
  refunded: "danger",
};

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

type Tab = "overview" | "products" | "add-product" | "delete-products" | "orders" | "coupons";

const emptyForm = { name: "", brand: "NextGenify", category: CATEGORIES[0] as string, price: "", compareAtPrice: "", description: "", highlights: "", images: "", stock: "" };
const emptyCoupon = { code: "", discountType: "percentage" as "percentage" | "fixed", discountValue: "", minimumOrder: "", maximumDiscount: "", usageLimit: "", expiry: "" };

function ProductFields({ form, onChange }: { form: typeof emptyForm; onChange: (key: keyof typeof emptyForm, value: string) => void }) {
  return (
    <>
      <Field label="Name">
        <input required maxLength={120} className={inputCls} value={form.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Product name" />
      </Field>
      <Field label="Brand">
        <input required maxLength={80} className={inputCls} value={form.brand} onChange={(e) => onChange("brand", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select className={inputCls} value={form.category} onChange={(e) => onChange("category", e.target.value)}>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </Field>
        <Field label="Stock quantity">
          <input type="number" min={0} step={1} required className={inputCls} value={form.stock} onChange={(e) => onChange("stock", e.target.value)} placeholder="0" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹)">
          <input type="number" min={0} step="0.01" required className={inputCls} value={form.price} onChange={(e) => onChange("price", e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Compare-at price (₹)">
          <input type="number" min={0} step="0.01" className={inputCls} value={form.compareAtPrice} onChange={(e) => onChange("compareAtPrice", e.target.value)} placeholder="Optional" />
        </Field>
      </div>
      <Field label="Description">
        <textarea rows={3} required maxLength={2000} className={inputCls} value={form.description} onChange={(e) => onChange("description", e.target.value)} placeholder="Describe the product for shoppers" />
      </Field>
      <Field label="Highlights (comma separated)">
        <input className={inputCls} value={form.highlights} onChange={(e) => onChange("highlights", e.target.value)} placeholder="Lightweight, Durable, 1 year warranty" />
      </Field>
      <Field label="Product image URL">
        <input className={inputCls} value={form.images} onChange={(e) => onChange("images", e.target.value)} placeholder="/images/products/…" />
      </Field>
    </>
  );
}

export function Manage() {
  const [tab, setTab] = useState<Tab>("overview");
  const { items: products, loading: loadingProducts, add: addProduct, update: updateProduct, remove: removeProduct } = useProducts();
  const { items: orders, loading: loadingOrders, refresh: refreshOrders } = useOrders();
  const { items: coupons, loading: loadingCoupons, add: addCoupon, update: updateCoupon, remove: removeCoupon } = useCoupons();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [productError, setProductError] = useState<string | null>(null);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/api/admin/stats").then(setStats).catch(() => {});
  }, [orders, products]);

  function openEdit(p: Product) {
    setProductError(null);
    setEditing(p);
    setForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      description: p.description,
      highlights: p.highlights.join(", "),
      images: p.images.join(", "),
      stock: String(p.stock),
    });
    setModalOpen(true);
  }

  async function submitProduct(e: FormEvent) {
    e.preventDefault();
    setProductError(null);
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim() || "NextGenify",
      category: form.category,
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      description: form.description.trim(),
      highlights: form.highlights.split(",").map((h) => h.trim()).filter(Boolean),
      images: form.images
        ? form.images.split(",").map((h) => h.trim()).filter(Boolean)
        : ["/images/products/placeholder.svg"],
      stock: Number(form.stock) || 0,
      rating: editing?.rating ?? 5,
      reviewCount: editing?.reviewCount ?? 0,
    };
    try {
      if (editing) {
        await updateProduct(editing.id, payload);
        setModalOpen(false);
      } else {
        await addProduct(payload);
        setForm(emptyForm);
        setTab("products");
      }
    } catch (err) {
      setProductError((err as Error).message || "Could not save the product. Please try again.");
    }
  }

  async function confirmDeleteProduct() {
    if (!pendingDeleteProduct) return;
    setDeletingProduct(true);
    setProductError(null);
    try {
      await removeProduct(pendingDeleteProduct.id);
      setPendingDeleteProduct(null);
    } catch (err) {
      setProductError((err as Error).message || "Could not delete the product. Please try again.");
    } finally {
      setDeletingProduct(false);
    }
  }

  async function submitCoupon(e: FormEvent) {
    e.preventDefault();
    await addCoupon({
      code: couponForm.code.trim().toUpperCase(),
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue) || 0,
      minimumOrder: couponForm.minimumOrder ? Number(couponForm.minimumOrder) : undefined,
      maximumDiscount: couponForm.maximumDiscount ? Number(couponForm.maximumDiscount) : undefined,
      usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined,
      usageCount: 0,
      expiry: couponForm.expiry || undefined,
      active: true,
    });
    setCouponForm(emptyCoupon);
    setCouponModalOpen(false);
  }

  async function setOrderStatus(id: string, status: OrderStatus) {
    setStatusBusy(id);
    setStatusError(null);
    try {
      await api.put(`/api/orders/${id}/status`, { status });
      await refreshOrders();
    } catch (e) {
      setStatusError(e instanceof ApiError ? e.message : "Couldn't update that order.");
    } finally {
      setStatusBusy(null);
    }
  }

  const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "products", label: "Products", icon: Package },
    { key: "add-product", label: "Add product", icon: Plus },
    { key: "delete-products", label: "Delete products", icon: Trash2 },
    { key: "orders", label: "Orders", icon: ShoppingCart },
    { key: "coupons", label: "Coupons", icon: Tag },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Manage store</h1>
        <p className="text-sm text-(--color-muted) mt-1">Products, orders, coupons and performance for your storefront.</p>
      </div>

      <div className="flex gap-1.5 border-b border-(--color-border) overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                tab === t.key ? "border-(--color-accent) text-(--color-accent-dark)" : "border-transparent text-(--color-muted) hover:text-(--color-ink)"
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && stats && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">Revenue</p>
              <p className="font-display text-2xl font-extrabold mt-1">{fmtMoney(stats.revenue)}</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">Orders</p>
              <p className="font-display text-2xl font-extrabold mt-1">{stats.orderCount}</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">Pending orders</p>
              <p className="font-display text-2xl font-extrabold mt-1">{stats.pending}</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">Products</p>
              <p className="font-display text-2xl font-extrabold mt-1">{stats.productCount}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <h3 className="font-display font-bold text-sm mb-4">Stock by category</h3>
              <div className="flex items-center gap-6">
                <DonutChart
                  data={stats.byCategory.map((d, i) => ({
                    label: d.label,
                    value: d.value,
                    color: ["var(--color-accent)", "var(--color-info)", "var(--color-good)", "var(--color-warn)"][i % 4],
                  }))}
                  size={140}
                />
                <ul className="space-y-1.5 text-sm">
                  {stats.byCategory.map((d, i) => (
                    <li key={d.label} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: ["var(--color-accent)", "var(--color-info)", "var(--color-good)", "var(--color-warn)"][i % 4] }}
                      />
                      {d.label} <span className="text-(--color-muted)">({d.value})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Card>
              <h3 className="font-display font-bold text-sm mb-4">Top products by revenue</h3>
              <BarChart
                data={stats.topProducts.map((p) => ({ label: p.name, values: [p.revenue] }))}
                colors={["var(--color-accent)"]}
              />
            </Card>
          </div>

          {stats.lowStock.length > 0 && (
            <Card className="border-(--color-warn)/40">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-(--color-warn)" />
                <h3 className="font-display font-bold text-sm">Low stock</h3>
              </div>
              <ul className="space-y-2">
                {stats.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.name}</span>
                    <Pill tone="warn">{p.stock} left</Pill>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </motion.div>
      )}

      {tab === "products" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setProductError(null); setForm(emptyForm); setEditing(null); setTab("add-product"); }}>
              <Plus size={16} /> Add product
            </Button>
          </div>
          {loadingProducts ? (
            <p className="text-sm text-(--color-muted) text-center py-8">Loading…</p>
          ) : products.length === 0 ? (
            <EmptyState icon={<Package size={22} />} title="No products yet" subtitle="Add your first product to start selling." />
          ) : (
            <Card className="!p-0 divide-y divide-(--color-border)">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3.5">
                  <img src={p.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-(--color-accent-soft)" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-(--color-muted)">
                      {p.category} · {fmtMoney(p.price)} · {p.stock} in stock
                    </p>
                  </div>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-(--color-muted) hover:text-(--color-accent-dark) hover:bg-(--color-accent-soft)">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setPendingDeleteProduct(p)} aria-label={`Delete ${p.name}`} className="p-2 rounded-lg text-(--color-muted) hover:text-(--color-danger) hover:bg-(--color-accent-soft)">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </Card>
          )}
        </motion.div>
      )}

      {tab === "add-product" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="max-w-3xl">
            <div className="mb-5">
              <h2 className="font-display text-lg font-bold">Add a product</h2>
              <p className="mt-1 text-sm text-(--color-muted)">Add the details shoppers need to find and order this item.</p>
            </div>
            <form onSubmit={submitProduct}>
              <ProductFields form={form} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} />
              {productError && <p role="alert" className="mb-3 text-sm text-(--color-danger)">{productError}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit"><Plus size={16} /> Publish product</Button>
                <Button type="button" variant="secondary" onClick={() => setTab("products")}>Cancel</Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {tab === "delete-products" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <h2 className="font-display text-lg font-bold">Delete products</h2>
            <p className="mt-1 text-sm text-(--color-muted)">Choose a product to remove it from your store catalog. You’ll be asked to confirm first.</p>
          </Card>
          {productError && <p role="alert" className="text-sm text-(--color-danger)">{productError}</p>}
          {loadingProducts ? (
            <p className="py-8 text-center text-sm text-(--color-muted)">Loading products…</p>
          ) : products.length === 0 ? (
            <EmptyState icon={<Package size={22} />} title="No products to delete" subtitle="Products you add will appear here." />
          ) : (
            <Card className="!p-0 divide-y divide-(--color-border)">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3.5">
                  <img src={product.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-(--color-accent-soft) object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-(--color-muted)">{product.category} · {fmtMoney(product.price)} · {product.stock} in stock</p>
                  </div>
                  <Button variant="danger" onClick={() => { setProductError(null); setPendingDeleteProduct(product); }}><Trash2 size={14} /> Delete</Button>
                </div>
              ))}
            </Card>
          )}
        </motion.div>
      )}

      {tab === "orders" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {statusError && <p role="alert" className="text-sm text-(--color-danger)">{statusError}</p>}
          {loadingOrders ? (
            <p className="text-sm text-(--color-muted) text-center py-8">Loading…</p>
          ) : orders.length === 0 ? (
            <EmptyState icon={<ShoppingCart size={22} />} title="No orders yet" subtitle="Orders placed at checkout will appear here." />
          ) : (
            orders
              .slice()
              .sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1))
              .map((o) => (
                <Card key={o.id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {o.orderNumber ? `${o.orderNumber} · ` : ""}
                      {o.address.fullName} · {fmtMoney(o.total)}
                    </p>
                    <p className="text-xs text-(--color-muted)">
                      {fmtDate(o.placedAt, { day: "numeric", month: "short", year: "numeric" })} · {o.items.length} item{o.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <select
                    value={o.status}
                    disabled={statusBusy === o.id || o.status === "cancelled" || o.status === "refunded"}
                    onChange={(e) => void setOrderStatus(o.id, e.target.value as OrderStatus)}
                    className="rounded-lg border border-(--color-border) px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--color-accent) disabled:opacity-60"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Pill tone={STATUS_TONE[o.status]}>{o.status}</Pill>
                </Card>
              ))
          )}
        </motion.div>
      )}

      {tab === "coupons" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCouponModalOpen(true)}>
              <Plus size={16} /> Create coupon
            </Button>
          </div>
          {loadingCoupons ? (
            <p className="text-sm text-(--color-muted) text-center py-8">Loading…</p>
          ) : coupons.length === 0 ? (
            <EmptyState icon={<Tag size={22} />} title="No coupons yet" subtitle="Create a coupon customers can apply at checkout." />
          ) : (
            <Card className="!p-0 divide-y divide-(--color-border)">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{c.code}</p>
                    <p className="text-xs text-(--color-muted)">
                      {c.discountType === "percentage" ? `${c.discountValue}% off` : `${fmtMoney(c.discountValue)} off`}
                      {c.minimumOrder ? ` · min ${fmtMoney(c.minimumOrder)}` : ""}
                      {c.usageLimit ? ` · used ${c.usageCount ?? 0}/${c.usageLimit}` : ` · used ${c.usageCount ?? 0}`}
                    </p>
                  </div>
                  <button
                    onClick={() => void updateCoupon(c.id, { active: !c.active })}
                    className="text-xs"
                  >
                    <Pill tone={c.active ? "good" : "danger"}>{c.active ? "Active" : "Disabled"}</Pill>
                  </button>
                  <button onClick={() => void removeCoupon(c.id)} className="p-2 rounded-lg text-(--color-muted) hover:text-(--color-danger) hover:bg-(--color-accent-soft)">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </Card>
          )}
        </motion.div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Edit product">
        <form onSubmit={submitProduct}>
          <ProductFields form={form} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} />
          {productError && <p role="alert" className="mb-3 text-sm text-(--color-danger)">{productError}</p>}
          <Button type="submit" className="w-full mt-1">
            Save changes
          </Button>
        </form>
      </Modal>

      <Modal open={!!pendingDeleteProduct} onClose={() => !deletingProduct && setPendingDeleteProduct(null)} title="Delete this product?">
        <p className="mb-5 text-sm text-(--color-muted)">
          <strong className="text-(--color-ink)">{pendingDeleteProduct?.name}</strong> will be removed from the store catalog. This action can’t be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={deletingProduct} onClick={() => setPendingDeleteProduct(null)}>Keep product</Button>
          <Button variant="danger" disabled={deletingProduct} onClick={() => void confirmDeleteProduct()}>
            <Trash2 size={15} /> {deletingProduct ? "Deleting…" : "Delete product"}
          </Button>
        </div>
      </Modal>

      <Modal open={couponModalOpen} onClose={() => setCouponModalOpen(false)} title="Create coupon">
        <form onSubmit={submitCoupon}>
          <Field label="Code">
            <input required className={inputCls} value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="NextGenify10" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount type">
              <select
                className={inputCls}
                value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as "percentage" | "fixed" })}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </Field>
            <Field label={couponForm.discountType === "percentage" ? "Percent off" : "Amount off (₹)"}>
              <input
                type="number"
                min={0}
                required
                className={inputCls}
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum order (₹)">
              <input type="number" min={0} className={inputCls} value={couponForm.minimumOrder} onChange={(e) => setCouponForm({ ...couponForm, minimumOrder: e.target.value })} />
            </Field>
            <Field label="Max discount (₹)">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={couponForm.maximumDiscount}
                onChange={(e) => setCouponForm({ ...couponForm, maximumDiscount: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Usage limit">
              <input type="number" min={0} className={inputCls} value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} />
            </Field>
            <Field label="Expiry date">
              <input type="date" className={inputCls} value={couponForm.expiry} onChange={(e) => setCouponForm({ ...couponForm, expiry: e.target.value })} />
            </Field>
          </div>
          <Button type="submit" className="w-full mt-1">
            Create coupon
          </Button>
        </form>
      </Modal>
    </div>
  );
}
