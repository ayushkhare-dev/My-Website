import { useNav, type ViewKey } from "../lib/nav";

const LINKS: { label: string; v: ViewKey }[] = [
  { label: "Shop", v: "shop" },
  { label: "Categories", v: "categories" },
  { label: "Collections", v: "collections" },
  { label: "Deals", v: "deals" },
  { label: "About", v: "about" },
];

export function Footer() {
  const { goTo } = useNav();
  return (
    <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-24 pb-28 lg:pb-10">
      <div className="border-t border-(--color-border) pt-10 flex flex-col items-center text-center gap-5">
        <button onClick={() => goTo("home")} className="flex items-center gap-2 font-display font-extrabold text-lg tracking-tight">
          <span className="w-8 h-8 rounded-full bg-(--color-accent) text-white flex items-center justify-center text-sm">N</span>
          NextGenify
        </button>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <button key={l.v} onClick={() => goTo(l.v)} className="text-sm text-(--color-muted) hover:text-(--color-ink) transition-colors">
              {l.label}
            </button>
          ))}
        </nav>
        <p className="text-xs text-(--color-muted)">© {new Date().getFullYear()} NextGenify. Demo storefront — payments shown are simulated.</p>
      </div>
    </footer>
  );
}
