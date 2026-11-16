/**
 * Razorpay pay button. Render it where the app takes money; it appears only if
 * the app provisioned `payments` (`VITE_ORVIS_PAYMENTS=1`, written by
 * provision-service.py). `data-pay-button` is the contract verify-site.py checks.
 *
 *   <PayButton amountMinor={49900} label="Pro plan" onPaid={() => refresh()} />
 *
 * Amounts are in the currency's MINOR unit: 49900 = ₹499.00. For a real
 * product decide the amount on the SERVER (see svc-payments.md), not here.
 */
import { useState, type ReactNode } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { payWithRazorpay } from "../lib/orvis";

export function PayButton({
  amountMinor,
  label,
  currency,
  prefill,
  onPaid,
  children,
}: {
  amountMinor: number;
  label?: string;
  currency?: string;
  prefill?: { name?: string; email?: string };
  onPaid?: (orderId: string) => void;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await payWithRazorpay({ amountMinor, label, currency, prefill });
      if (res.paid) onPaid?.(res.order_id);
      else if (res.status !== "cancelled") setError("The payment did not go through.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        data-pay-button
        onClick={pay}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-(--color-accent) text-white hover:bg-(--color-accent-dark) disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
        {children ?? label ?? "Pay"}
      </button>
      {error && <p className="text-xs text-(--color-danger) mt-2">{error}</p>}
    </div>
  );
}
