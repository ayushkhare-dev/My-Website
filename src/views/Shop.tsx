import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { createStore } from "../lib/store";
import { api } from "../lib/api";
import type { Product } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { ProductCard } from "../components/ProductCard";
import { CATEGORY_IMAGES } from "../components/CategoryShowcase";
import { EmptyState } from "../components/ui";
import { useNav } from "../lib/nav";

const useProducts = createStore<Product>("products");

type Sort = "relevance" | "newest" | "price-asc" | "price-desc" | "rating";

interface Filters {
  category: string | null;
  brand: string | null;
  minPrice: string;
  maxPrice: string;
  minRating: number | null;
  inStock: boolean;
  q: string;
  sort: Sort;
}

function parseInitial(qs: string, categoryFilter: string | null): Filters {
  const p = new URLSearchParams(qs);
  return {
    category: p.get("category") ?? categoryFilter,
    brand: p.get("brand"),
    minPrice: p.get("minPrice") ?? "",
    maxPrice: p.get("maxPrice") ?? "",
    minRating: p.get("minRating") ? Number(p.get("minRating")) : null,
    inStock: p.get("inStock") === "1",
    q: p.get("q") ?? "",
    sort: (p.get("sort") as Sort) ?? "relevance",
  };
}

function toQueryString(f: Filters): string {
  const p = new URLSearchParams();
  if (f.category) p.set("category", f.category);
  if (f.brand) p.set("brand", f.brand);
  if (f.minPrice) p.set("minPrice", f.minPrice);
  if (f.maxPrice) p.set("maxPrice", f.maxPrice);
  if (f.minRating) p.set("minRating", String(f.minRating));
  if (f.inStock) p.set("inStock", "1");
  if (f.q) p.set("q", f.q);
  if (f.sort !== "relevance") p.set("sort", f.sort);
  return p.toString();
}

export function Shop() {
  const { items: allProducts } = useProducts();
  const { categoryFilter, openCategory, initialShopQuery, syncShopUrl } = useNav();
  const [filters, setFilters] = useState<Filters>(() => parseInitial(initialShopQuery, categoryFilter));
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (categoryFilter) setFilters((f) => ({ ...f, category: categoryFilter }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const brands = useMemo(() => [...new Set(allProducts.map((p) => p.brand))].sort(), [allProducts]);

  useEffect(() => {
    syncShopUrl(toQueryString(filters));
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.category) params.set("category", filters.category);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.minRating) params.set("minRating", String(filters.minRating));
      if (filters.inStock) params.set("inStock", "1");
      params.set("sort", filters.sort);
      setLoading(true);
      api
        .get<Product[]>(`/api/products/search?${params.toString()}`)
        .then((r) => setResults(r))
        .catch(() => setResults(null))
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const filtered = results ?? allProducts;
  const activeCategoryImage = filters.category ? CATEGORY_IMAGES[filters.category.trim().toLowerCase()] : undefined;
  const activeCount = [filters.brand, filters.minPrice, filters.maxPrice, filters.minRating, filters.inStock || null].filter(Boolean).length;

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearAdvanced() {
    setFilters((f) => ({ ...f, brand: null, minPrice: "", maxPrice: "", minRating: null, inStock: false }));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-(--color-accent-dark)">The full range</p>
        <h1 className="font-display font-extrabold text-3xl mt-1">Shop everything</h1>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => update("category", null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            !filters.category ? "bg-(--color-ink) text-(--color-canvas) border-(--color-ink)" : "border-(--color-border) text-(--color-muted) hover:border-(--color-accent)"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => openCategory(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filters.category === c ? "bg-(--color-ink) text-(--color-canvas) border-(--color-ink)" : "border-(--color-border) text-(--color-muted) hover:border-(--color-accent)"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filters.category && (
        <section className="relative isolate h-60 sm:h-72 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-sky-600 to-cyan-400">
          {activeCategoryImage && (
            <img
              src={activeCategoryImage}
              alt=""
              aria-hidden="true"
              className="absolute right-0 top-0 z-0 h-full w-[68%] object-contain object-right p-3 sm:p-5"
            />
          )}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-blue-950/80 via-blue-900/50 to-blue-900/5" />
          <div className="relative z-20 flex h-full max-w-[48%] flex-col justify-end p-6 sm:p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">Explore the collection</p>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold">{filters.category}</h2>
          </div>
        </section>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 sm:w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted)" />
          <input
            value={filters.q}
            onChange={(e) => update("q", e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted) pointer-events-none" />
          <select
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value as Sort)}
            className="appearance-none rounded-xl border border-(--color-border) bg-(--color-surface) pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
            panelOpen || activeCount > 0 ? "border-(--color-accent) text-(--color-accent-dark) bg-(--color-accent-soft)" : "border-(--color-border) text-(--color-muted)"
          }`}
        >
          Filters {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      {panelOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl border border-(--color-border) bg-(--color-surface)">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted) mb-2">Brand</p>
            <select
              value={filters.brand ?? ""}
              onChange={(e) => update("brand", e.target.value || null)}
              className="w-full rounded-lg border border-(--color-border) px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) bg-(--color-canvas)"
            >
              <option value="">Any brand</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted) mb-2">Price range (₹)</p>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => update("minPrice", e.target.value)}
                className="w-full rounded-lg border border-(--color-border) px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) bg-(--color-canvas)"
              />
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => update("maxPrice", e.target.value)}
                className="w-full rounded-lg border border-(--color-border) px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) bg-(--color-canvas)"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted) mb-2">Minimum rating</p>
            <div className="flex gap-1.5">
              {[3, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => update("minRating", filters.minRating === r ? null : r)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                    filters.minRating === r ? "border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent-dark)" : "border-(--color-border) text-(--color-muted)"
                  }`}
                >
                  {r}+
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.inStock} onChange={(e) => update("inStock", e.target.checked)} className="rounded accent-(--color-accent)" />
              In stock only
            </label>
            {activeCount > 0 && (
              <button onClick={clearAdvanced} className="text-xs font-semibold text-(--color-muted) hover:text-(--color-danger) flex items-center gap-1 mt-2 self-start">
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {filters.minPrice || filters.maxPrice ? (
        <p className="text-xs text-(--color-muted)">
          Showing {filters.minPrice ? fmtMoney(Number(filters.minPrice)) : "₹0"} – {filters.maxPrice ? fmtMoney(Number(filters.maxPrice)) : "any"}
        </p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-(--color-accent-soft) animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={22} />}
          title="No products found"
          subtitle="Try a different search term or clear a filter."
          action={activeCount > 0 || filters.q ? { label: "Clear all filters", onClick: () => setFilters({ category: null, brand: null, minPrice: "", maxPrice: "", minRating: null, inStock: false, q: "", sort: "relevance" }) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
