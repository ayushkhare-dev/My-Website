import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  User,
  X,
} from "lucide-react";
import { useNav, type ViewKey } from "../lib/nav";
import { useCart } from "../lib/cart";
import { useTheme } from "../lib/theme";
import { useFlyToCart } from "../lib/flyToCart";
import { Magnetic } from "./Magnetic";
import type { Auth } from "../lib/auth";

const LINKS: { key: ViewKey; label: string }[] = [
  { key: "shop", label: "Shop" },
  { key: "categories", label: "Categories" },
  { key: "collections", label: "Collections" },
  { key: "deals", label: "Deals" },
  { key: "about", label: "About" },
];

export function Nav({ auth }: { auth: Auth }) {
  const { view, goTo, setSearchOpen, setCartOpen } = useNav();
  const cart = useCart();
  const { theme, toggle } = useTheme();
  const { registerTarget, pulse } = useFlyToCart();
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    registerTarget(cartBtnRef.current);
  }, [registerTarget]);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > lastY.current && y > 160);
      lastY.current = y;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const email = auth.isGuest ? "Guest" : auth.user?.email ?? "";

  function go(v: ViewKey) {
    goTo(v);
    setMobileOpen(false);
    setAccountOpen(false);
  }

  return (
    <>
      <motion.header
        animate={{ y: hidden ? -110 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 inset-x-0 z-50 flex justify-center px-3 sm:px-6"
        style={{ paddingTop: scrolled ? 10 : 18 }}
      >
        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full flex items-center gap-2 rounded-full transition-[max-width,padding,background-color,border-color,box-shadow] duration-300 ${
            scrolled
              ? "glass max-w-4xl px-3 py-2 border border-(--color-border) shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)]"
              : "max-w-6xl px-4 py-2.5 border border-transparent bg-transparent shadow-none"
          }`}
        >
          <button onClick={() => go("home")} aria-label="NextGenify home" className="flex items-center gap-2 font-display font-extrabold text-lg tracking-tight shrink-0">
            <span className="w-8 h-8 rounded-full bg-(--color-accent) text-white flex items-center justify-center text-sm">N</span>
            NextGenify
          </button>

          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {LINKS.map((l) => (
              <button
                key={l.key}
                onClick={() => go(l.key)}
                className="relative px-3.5 py-2 text-sm font-medium text-(--color-muted) hover:text-(--color-ink) transition-colors rounded-full"
              >
                {l.label}
                {view === l.key && (
                  <motion.span layoutId="nav-underline" className="absolute left-3.5 right-3.5 -bottom-0.5 h-[2px] rounded-full bg-(--color-accent)" />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1 ml-auto">
            <Magnetic strength={0.3}>
              <button onClick={() => setSearchOpen(true)} aria-label="Search" className="p-2 rounded-full hover:bg-(--color-accent-soft) transition-colors">
                <Search size={18} />
              </button>
            </Magnetic>
            <Magnetic strength={0.3} className="hidden sm:inline-flex">
              <button onClick={() => go("wishlist")} aria-label="Wishlist" className="flex p-2 rounded-full hover:bg-(--color-accent-soft) transition-colors">
                <Heart size={18} className={view === "wishlist" ? "fill-(--color-accent) text-(--color-accent)" : ""} />
              </button>
            </Magnetic>
            <button onClick={toggle} aria-label="Toggle theme" className="hidden sm:flex p-2 rounded-full hover:bg-(--color-accent-soft) transition-colors overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="block"
                >
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>

            <div className="relative hidden sm:block">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-1 p-2 rounded-full hover:bg-(--color-accent-soft) transition-colors"
                aria-label="Account"
              >
                <User size={18} />
                <ChevronDown size={13} className={`transition-transform ${accountOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-xl p-1.5 z-50"
                  >
                    <p className="px-3 py-2 text-xs text-(--color-muted) truncate border-b border-(--color-border) mb-1">{email}</p>
                    <MenuItem icon={<ClipboardList size={15} />} label="Orders" onClick={() => go("orders")} />
                    {auth.user?.role === "admin" && <MenuItem icon={<LayoutDashboard size={15} />} label="Manage store" onClick={() => go("manage")} />}
                    <MenuItem icon={<User size={15} />} label="Account settings" onClick={() => go("account")} />
                    <MenuItem icon={<LogOut size={15} />} label="Sign out" onClick={() => void auth.logout()} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Magnetic strength={0.3}>
              <button
                ref={cartBtnRef}
                onClick={() => setCartOpen(true)}
                aria-label="Cart"
                className="relative p-2 rounded-full hover:bg-(--color-accent-soft) transition-colors"
              >
                <ShoppingBag size={18} />
                <AnimatePresence>
                  {cart.count > 0 && (
                    <motion.span
                      key={pulse}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: [1.35, 1] }}
                      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-(--color-accent) text-white text-[10px] font-bold flex items-center justify-center"
                    >
                      {cart.count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </Magnetic>

            <Magnetic strength={0.25} className="hidden sm:inline-flex">
              <button
                onClick={() => go("shop")}
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) text-white text-sm font-semibold px-4 py-2 shadow-[0_8px_24px_-6px_var(--color-accent)] hover:shadow-[0_10px_30px_-4px_var(--color-accent)] hover:-translate-y-0.5 transition-[transform,box-shadow]"
              >
                Shop now
              </button>
            </Magnetic>

            <button onClick={() => setMobileOpen(true)} aria-label="Menu" className="lg:hidden p-2 rounded-full hover:bg-(--color-accent-soft)">
              <Menu size={18} />
            </button>
          </div>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-(--color-canvas) flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-display font-extrabold text-lg">NextGenify</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 rounded-xl hover:bg-(--color-accent-soft)">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <motion.button
                  key={l.key}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => go(l.key)}
                  className={`text-left px-3 py-3.5 rounded-xl text-2xl font-display font-bold ${view === l.key ? "text-(--color-accent)" : ""}`}
                >
                  {l.label}
                </motion.button>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-1 border-t border-(--color-border) pt-4">
              <MenuItem icon={<Heart size={16} />} label="Wishlist" onClick={() => go("wishlist")} />
              <MenuItem icon={<ClipboardList size={16} />} label="Orders" onClick={() => go("orders")} />
              {auth.user?.role === "admin" && <MenuItem icon={<LayoutDashboard size={16} />} label="Manage store" onClick={() => go("manage")} />}
              <MenuItem icon={<User size={16} />} label="Account settings" onClick={() => go("account")} />
              <button onClick={toggle} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-(--color-accent-soft)">
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />} Switch to {theme === "light" ? "dark" : "light"} mode
              </button>
              <MenuItem icon={<LogOut size={16} />} label="Sign out" onClick={() => void auth.logout()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-(--color-border) flex items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        <BottomLink icon={<ShopIcon active={view === "shop"} />} label="Shop" active={view === "shop"} onClick={() => go("shop")} />
        <BottomLink icon={<Search size={20} />} label="Search" active={false} onClick={() => setSearchOpen(true)} />
        <BottomLink
          icon={
            <span className="relative">
              <ShoppingBag size={20} />
              {cart.count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-(--color-accent) text-white text-[9px] font-bold flex items-center justify-center">
                  {cart.count}
                </span>
              )}
            </span>
          }
          label="Cart"
          active={false}
          onClick={() => setCartOpen(true)}
        />
        <BottomLink icon={<User size={20} />} label="Account" active={view === "account"} onClick={() => go("account")} />
      </nav>
    </>
  );
}

function ShopIcon({ active }: { active: boolean }) {
  return <ShoppingBag size={20} className={active ? "text-(--color-accent)" : ""} />;
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-(--color-accent-soft) transition-colors">
      {icon} {label}
    </button>
  );
}

function BottomLink({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium">
      <span className={active ? "text-(--color-accent)" : "text-(--color-muted)"}>{icon}</span>
      <span className={active ? "text-(--color-accent)" : "text-(--color-muted)"}>{label}</span>
    </button>
  );
}
