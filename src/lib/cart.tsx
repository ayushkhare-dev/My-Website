import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "./api";
import type { CartDoc } from "./types";

export interface CartLine {
  productId: string;
  qty: number;
  color?: string | null;
  size?: string | null;
}

interface CartCtx {
  lines: CartLine[];
  count: number;
  loading: boolean;
  add: (productId: string, qty?: number, variant?: { color?: string | null; size?: string | null }) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const GUEST_KEY = "verve.cart.v1";
const BASE = "/api/c/cart";

function loadGuestCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

async function upsertLine(line: CartLine): Promise<void> {
  const body: Omit<CartDoc, "id" | "_created" | "_updated"> & { id: string } = {
    id: line.productId,
    productId: line.productId,
    qty: line.qty,
    color: line.color ?? null,
    size: line.size ?? null,
  };
  try {
    await api.put(`${BASE}/${encodeURIComponent(line.productId)}`, body);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) await api.post(BASE, body);
    else throw e;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const merged = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const server = await api.get<CartDoc[]>(BASE);
        if (cancelled) return;
        const guest = loadGuestCart();
        if (!merged.current && guest.length > 0) {
          merged.current = true;
          const byProduct = new Map<string, CartLine>();
          for (const s of server) byProduct.set(s.productId, { productId: s.productId, qty: s.qty, color: s.color, size: s.size });
          for (const g of guest) {
            const existing = byProduct.get(g.productId);
            byProduct.set(g.productId, existing ? { ...existing, qty: existing.qty + g.qty } : g);
          }
          const mergedLines = [...byProduct.values()];
          await Promise.all(mergedLines.map((l) => upsertLine(l)));
          localStorage.removeItem(GUEST_KEY);
          if (!cancelled) setLines(mergedLines);
        } else {
          merged.current = true;
          setLines(server.map((s) => ({ productId: s.productId, qty: s.qty, color: s.color, size: s.size })));
        }
      } catch {
        if (!cancelled) setLines(loadGuestCart());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const onAuth = () => {
      merged.current = false;
      setLoading(true);
      void load();
    };
    window.addEventListener("auth:signed-in", onAuth);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:signed-in", onAuth);
    };
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      loading,
      add: (productId, qty = 1, variant) => {
        setLines((cur) => {
          const found = cur.find((l) => l.productId === productId);
          const nextLine = found ? { ...found, qty: found.qty + qty } : { productId, qty, color: variant?.color ?? null, size: variant?.size ?? null };
          void upsertLine(nextLine);
          if (found) return cur.map((l) => (l.productId === productId ? nextLine : l));
          return [...cur, nextLine];
        });
      },
      setQty: (productId, qty) => {
        setLines((cur) => {
          if (qty <= 0) {
            void api.del(`${BASE}/${encodeURIComponent(productId)}`).catch(() => {});
            return cur.filter((l) => l.productId !== productId);
          }
          const line = cur.find((l) => l.productId === productId);
          if (!line) return cur;
          const next = { ...line, qty };
          void upsertLine(next);
          return cur.map((l) => (l.productId === productId ? next : l));
        });
      },
      remove: (productId) => {
        setLines((cur) => cur.filter((l) => l.productId !== productId));
        void api.del(`${BASE}/${encodeURIComponent(productId)}`).catch(() => {});
      },
      clear: () => {
        const prev = lines;
        setLines([]);
        void Promise.all(prev.map((l) => api.del(`${BASE}/${encodeURIComponent(l.productId)}`).catch(() => {})));
      },
    }),
    [lines, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
