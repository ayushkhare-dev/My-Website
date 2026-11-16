import { motion } from "motion/react";
import { Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useNav } from "../lib/nav";

const VALUES = [
  { icon: Sparkles, title: "Considered by design", body: "Every product in the NextGenify edit is chosen for craft, not trend — built to earn a permanent place in your routine." },
  { icon: ShieldCheck, title: "Quality you can verify", body: "We work directly with manufacturers and test every category ourselves before it reaches the shelf." },
  { icon: Truck, title: "Fast, honest delivery", body: "Free standard shipping over ₹2,999, transparent timelines, and easy returns — no fine print." },
  { icon: Leaf, title: "Built to last", body: "We'd rather sell you one great jacket than three you'll replace next year." },
];

export function About() {
  const { goTo } = useNav();

  return (
    <div className="space-y-16">
      <motion.section initial={{ y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--color-accent-dark)">Our story</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2 leading-tight">
          NextGenify exists for people who want fewer, better things.
        </h1>
        <p className="text-(--color-muted) mt-4 leading-relaxed">
          We started NextGenify with a simple frustration: shopping online for quality goods across fashion, tech, home and
          beauty meant juggling a dozen storefronts, each with its own returns policy and its own compromises. NextGenify
          brings the categories we actually shop for into one considered, well-made edit — curated the way a good
          friend with great taste would do it.
        </p>
      </motion.section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {VALUES.map((v, i) => {
          const Icon = v.icon;
          return (
            <motion.div
              key={v.title}
              initial={{ y: 14 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-(--color-border) p-6 bg-(--color-surface)"
            >
              <div className="w-10 h-10 rounded-xl bg-(--color-accent-soft) text-(--color-accent-dark) flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="font-display font-bold">{v.title}</h3>
              <p className="text-sm text-(--color-muted) mt-1.5 leading-relaxed">{v.body}</p>
            </motion.div>
          );
        })}
      </section>

      <motion.section
        initial={{ y: 14 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        className="rounded-[28px] bg-(--color-ink) text-white p-10 sm:p-14 text-center"
      >
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl">Ready to find your next favorite thing?</h2>
        <button
          onClick={() => goTo("shop")}
          className="mt-6 inline-flex items-center gap-2 bg-white text-(--color-ink) rounded-full px-6 py-3 text-sm font-semibold hover:bg-(--color-accent) hover:text-white transition-colors"
        >
          Explore the shop
        </button>
      </motion.section>
    </div>
  );
}
