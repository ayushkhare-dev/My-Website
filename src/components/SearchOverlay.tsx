import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Search, TrendingUp, X } from "lucide-react";
import type { Product } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { fmtMoney } from "../lib/format";
import { useNav } from "../lib/nav";
import { api } from "../lib/api";

const TRENDING = ["Smartwatch", "Sneakers", "Leather bag", "Headphones", "Skincare"];
const RECENT_KEY = "nextgenify.recent-searches.v1";

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, openProduct, openCategory } = useNav();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [recent, setRecent] = useState<string[]>(loadRecent);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get<Product[]>(`/api/products/search?q=${encodeURIComponent(q.trim())}&limit=8`)
        .then(setResults)
        .catch(() => setResults([]));
    }, 180);
    return () => clearTimeout(timer);
  }, [q]);

  function close() {
    setSearchOpen(false);
    setQ("");
  }

  function remember(term: string) {
    setRecent((r) => {
      const next = [term, ...r.filter((x) => x !== term)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }

  function pick(term: string) {
    setQ(term);
    remember(term);
  }

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-(--color-canvas)/97 backdrop-blur-xl overflow-y-auto"
        >
          <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-16 pb-20">
            <p className="font-display font-extrabold uppercase tracking-tight text-2xl sm:text-3xl mb-6 text-(--color-muted)">
              What are you <span className="text-(--color-ink)">looking for?</span>
            </p>
            <div className="flex items-center gap-3 border-b-2 border-(--color-border) pb-4">
              <Search size={22} className="text-(--color-muted)" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, brands & categories…"
                className="flex-1 bg-transparent outline-none text-xl sm:text-2xl font-display font-semibold placeholder:text-(--color-muted)/60"
              />
              <button onClick={close} aria-label="Close search" className="p-2 rounded-xl hover:bg-(--color-accent-soft)">
                <X size={20} />
              </button>
            </div>

            {q.trim() ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                {results.length === 0 ? (
                  <p className="text-sm text-(--color-muted) py-10 text-center">No products found for “{q}”.</p>
                ) : (
                  <ul className="space-y-1">
                    {results.map((p, i) => (
                      <motion.li key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <button
                          onClick={() => {
                            remember(q.trim());
                            openProduct(p.id);
                            close();
                          }}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-(--color-accent-soft) transition-colors text-left"
                        >
                          <img src={p.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{p.name}</p>
                            <p className="text-xs text-(--color-muted)">{p.category}</p>
                          </div>
                          <span className="font-display font-bold text-sm">{fmtMoney(p.price)}</span>
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ) : (
              <div className="mt-8 space-y-8">
                {recent.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted) mb-3">Recent searches</p>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((r) => (
                        <button key={r} onClick={() => pick(r)} className="px-3 py-1.5 rounded-full border border-(--color-border) text-sm hover:border-(--color-accent)">
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted) mb-3 flex items-center gap-1.5">
                    <TrendingUp size={13} /> Trending searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING.map((t) => (
                      <button key={t} onClick={() => pick(t)} className="px-3 py-1.5 rounded-full border border-(--color-border) text-sm hover:border-(--color-accent)">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted) mb-3">Browse categories</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          openCategory(c);
                          close();
                        }}
                        className="flex items-center justify-between px-3.5 py-3 rounded-xl border border-(--color-border) hover:border-(--color-accent) text-sm font-medium"
                      >
                        {c} <ArrowUpRight size={14} className="text-(--color-muted)" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
