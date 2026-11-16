import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ViewKey = "home" | "shop" | "categories" | "collections" | "deals" | "about" | "wishlist" | "orders" | "manage" | "account" | "checkout";

interface NavCtx {
  view: ViewKey;
  goTo: (v: ViewKey) => void;
  productId: string | null;
  openProduct: (id: string) => void;
  closeProduct: () => void;
  orderId: string | null;
  openOrder: (id: string) => void;
  closeOrder: () => void;
  categoryFilter: string | null;
  openCategory: (c: string) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  /** Raw `?a=b&c=d` query string captured once from the address bar, only
   * meaningful when the app booted straight onto /shop from a shared link. */
  initialShopQuery: string;
  /** Shop calls this on every filter change so its own URL is shareable. */
  syncShopUrl: (qs: string) => void;
}

const Ctx = createContext<NavCtx | null>(null);

const VIEW_PATHS: Record<ViewKey, string> = {
  home: "/",
  shop: "/shop",
  categories: "/categories",
  collections: "/collections",
  deals: "/deals",
  about: "/about",
  wishlist: "/wishlist",
  orders: "/orders",
  manage: "/manage",
  account: "/account",
  checkout: "/checkout",
};

interface RouteState {
  view: ViewKey;
  productId: string | null;
  orderId: string | null;
  categoryFilter: string | null;
  shopQuery: string;
}

function viewForPath(pathname: string): ViewKey {
  const path = pathname.replace(/\/+$/, "") || "/";
  const entry = Object.entries(VIEW_PATHS).find(([, route]) => route === path);
  return (entry?.[0] as ViewKey | undefined) ?? "home";
}

function routeFromUrl(url: URL): RouteState {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const query = new URLSearchParams(url.search);
  const productMatch = path.match(/^\/product\/([^/]+)$/);
  const orderMatch = path.match(/^\/order\/([^/]+)$/);

  if (productMatch || orderMatch) {
    const returnUrl = new URL(query.get("from") || "/", url.origin);
    const view = viewForPath(returnUrl.pathname);
    const returnQuery = new URLSearchParams(returnUrl.search);
    return {
      view,
      productId: productMatch ? decodeURIComponent(productMatch[1]) : null,
      orderId: orderMatch ? decodeURIComponent(orderMatch[1]) : null,
      categoryFilter: view === "shop" ? returnQuery.get("category") : null,
      shopQuery: view === "shop" ? returnUrl.search.replace(/^\?/, "") : "",
    };
  }

  const view = viewForPath(path);
  return {
    view,
    productId: null,
    orderId: null,
    categoryFilter: view === "shop" ? query.get("category") : null,
    shopQuery: view === "shop" ? url.search.replace(/^\?/, "") : "",
  };
}

function returnPath(route: RouteState): string {
  const path = VIEW_PATHS[route.view];
  return route.view === "shop" && route.shopQuery ? `${path}?${route.shopQuery}` : path;
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<RouteState>(() => routeFromUrl(new URL(window.location.href)));
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    function onPopState() {
      setRoute(routeFromUrl(new URL(window.location.href)));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const value: NavCtx = {
    view: route.view,
    goTo: (v) => {
      const next: RouteState = { view: v, productId: null, orderId: null, categoryFilter: null, shopQuery: "" };
      window.history.pushState(null, "", VIEW_PATHS[v]);
      setRoute(next);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    },
    productId: route.productId,
    openProduct: (id) => {
      const from = returnPath(route);
      const query = new URLSearchParams({ from });
      window.history.pushState(null, "", `/product/${encodeURIComponent(id)}?${query.toString()}`);
      setRoute({ ...route, productId: id, orderId: null });
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    },
    closeProduct: () => {
      window.history.replaceState(null, "", returnPath(route));
      setRoute({ ...route, productId: null });
    },
    orderId: route.orderId,
    openOrder: (id) => {
      const from = returnPath(route);
      const query = new URLSearchParams({ from });
      window.history.pushState(null, "", `/order/${encodeURIComponent(id)}?${query.toString()}`);
      setRoute({ ...route, productId: null, orderId: id });
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    },
    closeOrder: () => {
      window.history.replaceState(null, "", returnPath(route));
      setRoute({ ...route, orderId: null });
    },
    categoryFilter: route.categoryFilter,
    openCategory: (c) => {
      const shopQuery = new URLSearchParams({ category: c }).toString();
      window.history.pushState(null, "", `/shop?${shopQuery}`);
      setRoute({ view: "shop", productId: null, orderId: null, categoryFilter: c, shopQuery });
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    },
    searchOpen,
    setSearchOpen,
    cartOpen,
    setCartOpen,
    initialShopQuery: route.shopQuery,
    syncShopUrl: (qs) => {
      window.history.replaceState(null, "", qs ? `/shop?${qs}` : "/shop");
      const params = new URLSearchParams(qs);
      setRoute((current) => ({
        ...current,
        view: "shop",
        shopQuery: qs,
        categoryFilter: params.get("category"),
      }));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): NavCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
}
