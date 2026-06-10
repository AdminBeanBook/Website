"use client";

import { useCheckout } from "@/hooks/useCheckout";

type BuyButtonProps = {
  label?: string;
  className?: string;
};

export function BuyButton({
  label = "Buy Now",
  className = "btn-primary",
}: BuyButtonProps) {
  const { startCheckout, loading, error } = useCheckout();

  return (
    <div className="inline-flex w-full max-w-xs flex-col items-center gap-3">
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={`${className} w-full disabled:cursor-wait disabled:opacity-70`}
      >
        {loading ? "Redirecting to checkout…" : label}
      </button>
      {error && (
        <p className="max-w-xs text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
