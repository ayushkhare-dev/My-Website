import { createContext, useContext, useState, type ReactNode } from "react";
import type { Product } from "./types";

interface QuickViewCtx {
  product: Product | null;
  open: (p: Product) => void;
  close: () => void;
}

const Ctx = createContext<QuickViewCtx | null>(null);

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  return <Ctx.Provider value={{ product, open: setProduct, close: () => setProduct(null) }}>{children}</Ctx.Provider>;
}

export function useQuickView(): QuickViewCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQuickView must be used inside QuickViewProvider");
  return ctx;
}
