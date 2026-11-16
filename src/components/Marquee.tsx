export function Marquee({ text, reverse = false, className = "" }: { text: string; reverse?: boolean; className?: string }) {
  const loop = [text, text, text, text];
  return (
    <div className={`relative overflow-hidden py-2 ${className}`}>
      <div className={`flex whitespace-nowrap ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}>
        {[...loop, ...loop].map((t, i) => (
          <span key={i} className="font-display font-semibold text-2xl sm:text-4xl lowercase tracking-tight text-(--color-muted)/70 shrink-0 px-6">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
