import { GlowCard } from "./GlowCard";
import { AnimatedIcon, type AnimatedIconName } from "./AnimatedIcon";

const ITEMS: { icon: AnimatedIconName; title: string; blurb: string }[] = [
  { icon: "truck", title: "free shipping", blurb: "On every order over $75, no fine print." },
  { icon: "package", title: "easy returns", blurb: "30 days to change your mind, no questions." },
  { icon: "shield", title: "secure payment", blurb: "Encrypted checkout, every single time." },
  { icon: "heart", title: "24/7 support", blurb: "Real humans, always within reach." },
];

export function WhyNova() {
  return (
    <section className="space-y-10">
      <div className="text-center max-w-lg mx-auto">
        <p className="section-number mb-3">04 why nova</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight lowercase">built different</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {ITEMS.map((item, i) => (
          <GlowCard key={item.title} index={i}>
            <div className="p-6 flex flex-col gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-(--color-accent-soft) text-(--color-accent)">
                <AnimatedIcon name={item.icon} size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold lowercase">{item.title}</h3>
                <p className="text-sm text-(--color-muted) mt-1 leading-relaxed">{item.blurb}</p>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </section>
  );
}
