const OFFERS = ["Free shipping over $75", "30-day easy returns", "New drops every week", "Members save more"];

export function OfferStrip() {
  const loop = [...OFFERS, ...OFFERS];
  return (
    <div className="relative overflow-hidden border-y border-(--color-border) py-5 sm:py-6 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...loop, ...loop].map((t, i) => (
          <span key={i} className="flex items-center gap-6 sm:gap-10 shrink-0 px-6 sm:px-10">
            <span className="font-display font-semibold text-xl sm:text-3xl tracking-[-0.02em] text-(--color-muted)/70">{t}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent)" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
