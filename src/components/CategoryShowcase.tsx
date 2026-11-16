import { useMemo, useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useMotionTemplate } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  Dumbbell,
  Footprints,
  Gamepad2,
  HeartPulse,
  House,
  Laptop,
  PackageOpen,
  Shirt,
  Sparkles,
  Watch,
  type LucideIcon,
} from "lucide-react";
import type { Product } from "../lib/types";
import { CATEGORY_BLURB } from "../lib/types";
import { useNav } from "../lib/nav";

type CategoryCardData = { key: string; label: string; blurb: string; image?: string; hue: string; Icon: LucideIcon };

export const CATEGORY_IMAGES: Record<string, string> = {
  fashion: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=max&w=1600&q=85",
  shoes: "https://images.unsplash.com/photo-1576685580253-98ea71eed5ce?auto=format&fit=max&w=1600&q=85",
  accessories: "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=max&w=1600&q=85",
  electronics: "/images/categories/electronics.jpg",
  watches: "https://images.unsplash.com/photo-1588887318603-9d9beca8738f?auto=format&fit=max&w=1600&q=85",
  gaming: "https://images.unsplash.com/photo-1642976507711-77bc1efa2067?auto=format&fit=max&w=1600&q=85",
  beauty: "/images/categories/beauty.jpg",
  health: "https://images.unsplash.com/photo-1571935511593-4f34d99e7a9c?auto=format&fit=max&w=1600&q=85",
  home: "/images/categories/home.jpg",
  travel: "https://images.unsplash.com/photo-1760715651666-c3e408bfdda7?auto=format&fit=max&w=1600&q=85",
  sports: "https://images.unsplash.com/photo-1679216129631-fbcec034558c?auto=format&fit=max&w=1600&q=85",
  fitness: "https://images.unsplash.com/photo-1734668481849-f04683983bcc?auto=format&fit=max&w=1600&q=85",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  fashion: Shirt,
  shoes: Footprints,
  watches: Watch,
  electronics: Laptop,
  beauty: Sparkles,
  home: House,
  sports: Activity,
  travel: BriefcaseBusiness,
  gaming: Gamepad2,
  health: HeartPulse,
  fitness: Dumbbell,
  accessories: PackageOpen,
};

const CATEGORY_HUES = ["62, 140, 255", "29, 190, 224", "120, 112, 255", "34, 190, 150", "255, 156, 72"];

const TILTS = [-3, 2, -2, 3];

function CategoryCard({ c, index }: { c: CategoryCardData; index: number }) {
  const { openCategory } = useNav();
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const spot = useMotionTemplate`radial-gradient(220px circle at ${mx}% ${my}%, rgba(${c.hue}, 0.28), transparent 70%)`;
  const tilt = TILTS[index % TILTS.length];
  const Icon = c.Icon;

  function onMove(e: MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  }

  return (
    <motion.button
      ref={ref}
      data-cursor="auto"
      onClick={() => openCategory(c.key)}
      onMouseMove={onMove}
      initial={{ rotate: tilt }}
      whileHover={{ y: -8, scale: 1.03, rotate: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ zIndex: index }}
      className="group relative rounded-[28px] overflow-hidden aspect-[4/5] text-left border border-(--color-border) shadow-[0_20px_50px_-20px_rgba(0,0,0,0.32)]"
    >
      {c.image ? (
        <img
          src={c.image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-700" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
      <motion.div style={{ background: spot }} className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <span className="absolute top-5 left-5 w-11 h-11 rounded-full border border-white/35 bg-white/15 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
        <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <h3 className="font-display font-extrabold text-xl text-white">{c.label}</h3>
        <p className="text-sm text-white/70 mt-1.5 max-w-[85%] leading-relaxed">{c.blurb}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white">
          Explore <ArrowUpRight size={14} />
        </span>
      </div>
    </motion.button>
  );
}

export function CategoryShowcase({ products }: { products: Product[] }) {
  const categories = useMemo(() => {
    const seen = new Set<string>();
    return products.reduce<CategoryCardData[]>((cards, product) => {
      const label = String(product.category ?? "").trim();
      const normalized = label.toLocaleLowerCase();
      if (!label || seen.has(normalized)) return cards;
      seen.add(normalized);
      const blurb = Object.entries(CATEGORY_BLURB).find(([category]) => category.toLowerCase() === normalized)?.[1];
      cards.push({
        key: label,
        label,
        blurb: blurb ?? `Explore the latest picks in ${label.toLowerCase()}.`,
        image: CATEGORY_IMAGES[normalized],
        hue: CATEGORY_HUES[cards.length % CATEGORY_HUES.length],
        Icon: CATEGORY_ICONS[normalized] ?? PackageOpen,
      });
      return cards;
    }, []);
  }, [products]);

  return (
    <section className="space-y-10">
      <div className="text-center max-w-lg mx-auto">
        <p className="section-number mb-3">{categories.length} collections</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight lowercase">
          shop by <span className="font-serif italic font-normal">collection</span>
        </h2>
        <p className="text-(--color-muted) mt-2">Find your world across {categories.length} collections.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-6">
        {categories.map((c, i) => (
          <CategoryCard key={c.key} c={c} index={i} />
        ))}
      </div>
    </section>
  );
}
