import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

interface Notice {
  id: number;
  name: string;
  image: string;
}

interface NoticeCtx {
  notify: (name: string, image: string) => void;
}

const Ctx = createContext<NoticeCtx | null>(null);
let seq = 0;

export function AddedNoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = useCallback((name: string, image: string) => {
    const id = ++seq;
    setNotice({ id, name, image });
    setTimeout(() => {
      setNotice((cur) => (cur?.id === id ? null : cur));
    }, 2600);
  }, []);

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div className="fixed top-24 right-4 sm:right-8 z-[110] pointer-events-none">
        <AnimatePresence>
          {notice && (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.96, transition: { duration: 0.25 } }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="dark flex items-center gap-3 bg-(--color-canvas-2) border border-(--color-border) rounded-2xl shadow-[0_20px_60px_-16px_rgba(0,0,0,0.6)] p-3 pr-5 max-w-xs"
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-black/20">
                <img src={notice.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-(--color-accent)">
                  <Check size={12} /> Added to your collection
                </p>
                <p className="text-sm font-display font-semibold text-white line-clamp-1 mt-0.5">{notice.name}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useAddedNotice(): NoticeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAddedNotice must be used inside AddedNoticeProvider");
  return ctx;
}
