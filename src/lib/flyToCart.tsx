import { createContext, useCallback, useContext, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";

interface FlyItem {
  id: number;
  src: string;
  from: { x: number; y: number; w: number; h: number };
  to: { x: number; y: number };
}

interface FlyCtx {
  registerTarget: (el: HTMLElement | null) => void;
  fly: (src: string, fromEl: HTMLElement) => void;
  pulse: number;
}

const Ctx = createContext<FlyCtx | null>(null);
let seq = 0;

export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const targetRef: RefObject<HTMLElement | null> = useRef(null);
  const [items, setItems] = useState<FlyItem[]>([]);
  const [pulse, setPulse] = useState(0);

  const registerTarget = useCallback((el: HTMLElement | null) => {
    targetRef.current = el;
  }, []);

  const fly = useCallback((src: string, fromEl: HTMLElement) => {
    const target = targetRef.current;
    if (!target || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPulse((p) => p + 1);
      return;
    }
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = target.getBoundingClientRect();
    const id = ++seq;
    setItems((cur) => [
      ...cur,
      {
        id,
        src,
        from: { x: fromRect.left, y: fromRect.top, w: fromRect.width, h: fromRect.height },
        to: { x: toRect.left + toRect.width / 2 - 10, y: toRect.top + toRect.height / 2 - 10 },
      },
    ]);
    setTimeout(() => {
      setItems((cur) => cur.filter((i) => i.id !== id));
      setPulse((p) => p + 1);
    }, 650);
  }, []);

  return (
    <Ctx.Provider value={{ registerTarget, fly, pulse }}>
      {children}
      <AnimatePresence>
        {items.map((it) => (
          <motion.img
            key={it.id}
            src={it.src}
            initial={{ x: it.from.x, y: it.from.y, width: it.from.w, height: it.from.h, opacity: 1, borderRadius: 12 }}
            animate={{ x: it.to.x, y: it.to.y, width: 20, height: 20, opacity: 0.4, borderRadius: 999 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 pointer-events-none z-[100] object-cover shadow-lg"
          />
        ))}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useFlyToCart(): FlyCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFlyToCart must be used inside FlyToCartProvider");
  return ctx;
}
