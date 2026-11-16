const SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

export function fmtMoney(n: number, currency = "INR"): string {
  const sym = SYMBOLS[currency] ?? `${currency} `;
  const sign = n < 0 ? "-" : "";
  return `${sign}${sym}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return new Date(iso).toLocaleDateString(undefined, opts);
}

/** Whole days from today to `iso` (negative = past). */
export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export const monthKey = (iso: string): string => iso.slice(0, 7); // yyyy-mm
export const currentMonthKey = (): string => new Date().toISOString().slice(0, 7);

/** Keys for the last `n` months, oldest first. */
export function lastMonthKeys(n = 6): string[] {
  const d = new Date();
  return Array.from({ length: n }, (_, i) => {
    const dt = new Date(d.getFullYear(), d.getMonth() - (n - 1 - i), 1);
    return dt.toISOString().slice(0, 7);
  });
}
