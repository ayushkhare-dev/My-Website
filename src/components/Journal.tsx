import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const ARTICLES = [
  {
    tag: "Craft",
    title: "Inside the workshop: how we choose materials that last decades, not seasons",
    read: "6 min read",
    img: "/images/categories/fashion.jpg",
  },
  {
    tag: "Field notes",
    title: "The everyday-carry edit: what actually earns a spot in your bag",
    read: "4 min read",
    img: "/images/categories/electronics.jpg",
  },
  {
    tag: "Journal",
    title: "Slow design in a fast market — why we ship less, better",
    read: "8 min read",
    img: "/images/categories/home.jpg",
  },
  {
    tag: "Ritual",
    title: "A five-minute morning routine, built around fewer, better objects",
    read: "3 min read",
    img: "/images/categories/beauty.jpg",
  },
];

export function Journal() {
  return (
    <section className="space-y-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="section-number mb-3">06 the journal</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight lowercase">
            stories, <span className="font-serif italic font-normal">not specs</span>
          </h2>
        </div>
        <button className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-(--color-accent-dark) hover:underline shrink-0">
          Read the journal <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {ARTICLES.map((a, i) => (
          <motion.article
            key={a.title}
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.06 }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden">
              <img
                src={a.img}
                alt=""
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {a.tag}
              </span>
            </div>
            <h3 className="font-display font-bold text-base mt-4 leading-snug line-clamp-2 break-words group-hover:text-(--color-accent-dark) transition-colors">
              {a.title}
            </h3>
            <p className="text-xs text-(--color-muted) mt-2">{a.read}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
