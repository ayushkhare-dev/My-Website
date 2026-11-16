/**
 * Isolated floating shopping-assistant widget — button + panel, fixed
 * positioning, its own state and classnames only. Reads products from the
 * existing store and answers with the rule-based engine in
 * `lib/shopAssistant.ts` (no external AI call, no credits spent). Does not
 * touch any existing component, route, or global style.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Minus, Send, Sparkles, X } from "lucide-react";
import type { Product } from "../lib/types";
import { createStore } from "../lib/store";
import { useNav } from "../lib/nav";
import { fmtMoney } from "../lib/format";
import { answer } from "../lib/shopAssistant";
import "./ShopBot.css";

const useBotProducts = createStore<Product>("products");

interface BotMsg {
  id: string;
  role: "user" | "bot";
  text: string;
  products?: Product[];
}

const GREETING: BotMsg = {
  id: "greet-0",
  role: "bot",
  text: "Hi! I'm your NextGenify shopping assistant. Ask me to find something, recommend a product, compare two items, or ask about shipping, returns, or deals.",
};

const SUGGESTIONS = ["What's new?", "Show me deals", "Recommend a watch", "Return policy?"];

function ProductChip({ p, onOpen }: { p: Product; onOpen: (id: string) => void }) {
  const price = p.dealPrice ?? p.price;
  return (
    <button
      type="button"
      onClick={() => onOpen(p.id)}
      className="ngbot-chip flex items-center gap-2.5 w-full text-left rounded-xl p-2 hover:bg-(--color-accent-soft) transition-colors"
    >
      <img src={p.images?.[0]} alt={p.name} className="w-11 h-11 rounded-lg object-cover shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-(--color-ink) truncate">{p.name}</span>
        <span className="block text-[12px] text-(--color-muted)">{fmtMoney(price)}</span>
      </span>
    </button>
  );
}

export function ShopBot() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [messages, setMessages] = useState<BotMsg[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const { items: products } = useBotProducts();
  const { openProduct } = useNav();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const userMsg: BotMsg = { id: `u-${Date.now()}`, role: "user", text: clean };
    const reply = answer(clean, products);
    const botMsg: BotMsg = { id: `b-${Date.now()}`, role: "bot", text: reply.text, products: reply.products };
    setMessages((m) => [...m, userMsg, botMsg]);
    setDraft("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  function toggleOpen() {
    setOpen((v) => !v);
    setEverOpened(true);
  }

  return (
    <div className="ngbot-root">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="ngbot-panel fixed z-[999] flex flex-col overflow-hidden rounded-[22px] border border-(--color-border) shadow-2xl"
            role="dialog"
            aria-label="NextGenify shopping assistant"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-(--color-border) bg-(--color-accent) text-white shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 shrink-0">
                  <Sparkles size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-display font-bold leading-tight truncate">NextGenify Assistant</span>
                  <span className="block text-[11px] text-white/70 leading-tight">Always here to help you shop</span>
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="Minimize"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white"
                >
                  <Minus size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="ngbot-scroll flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3 bg-(--color-canvas)">
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      (m.role === "user"
                        ? "bg-(--color-accent) text-white"
                        : "bg-(--color-surface) border border-(--color-border) text-(--color-ink)") +
                      " max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
                    }
                  >
                    {m.text}
                    {m.products && m.products.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 -mx-1">
                        {m.products.map((p) => (
                          <ProductChip key={p.id} p={p} onOpen={openProduct} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 px-3.5 pb-2 shrink-0 bg-(--color-canvas)">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="ngbot-suggestion text-[11.5px] font-medium rounded-full border border-(--color-border) px-3 py-1.5 text-(--color-muted) hover:text-(--color-accent-dark) hover:border-(--color-accent) transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={submit} className="flex items-center gap-2 px-3 py-3 border-t border-(--color-border) bg-(--color-surface) shrink-0">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about a product…"
                autoComplete="off"
                className="flex-1 min-w-0 rounded-full border border-(--color-border) bg-(--color-canvas) px-3.5 py-2 text-[13px] text-(--color-ink) placeholder:text-(--color-muted) focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-(--color-accent) text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggleOpen}
        aria-label={open ? "Close shopping assistant" : "Open shopping assistant"}
        className="ngbot-fab fixed z-[999] flex items-center justify-center rounded-full bg-(--color-accent) text-white"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        {!everOpened && <span className="ngbot-glow-ring" aria-hidden="true" />}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.16 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.16 }}>
              <Bot size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
