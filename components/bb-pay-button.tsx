import { formatUsdCents } from "@flynetdev/core";

// Blackbird Pay. The one purple moment on the page — pill-shaped, black text
// on the brand purple, darker purple on press. Wire onPay to your payment
// flow (create a payment intent server-side, confirm here).
export function BBPayButton({
  amountUsdCents,
  onPay,
  disabled = false,
  className = "",
}: {
  /** Integer cents. Omit for a plain "Pay with Blackbird" label. */
  amountUsdCents?: number;
  onPay?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const label =
    typeof amountUsdCents === "number"
      ? `Pay ${formatUsdCents(amountUsdCents)} with Blackbird`
      : "Pay with Blackbird";

  return (
    <button
      type="button"
      onClick={onPay}
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 font-semibold text-primary-foreground transition duration-150 ease-standard hover:opacity-90 active:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {label}
    </button>
  );
}
