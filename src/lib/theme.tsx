import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const KEY = "nextgenify.theme.v1";
const Ctx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

function initial(): Theme {
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) }), [theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
