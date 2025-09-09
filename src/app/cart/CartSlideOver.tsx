"use client";

import { useEffect, useRef, useState } from "react";

type CartItem = {
  id: string;
  title: string;
  sku: string | null;
  priceCents: number;
  qty: number;
  line: number;
  imageUrl: string | null;
  variantLabel: string | null;
};

type CartData = { items: CartItem[]; total: number };

const FREE_SHIPPING_THRESHOLD = 10000; // $100.00 in cents

export default function CartSlideOver({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CartData>({ items: [], total: 0 });
  const panelRef = useRef<HTMLDivElement | null>(null);

  // fetch cart when opening
  useEffect(() => {
    if (!open) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const json: CartData = await res.json();
        if (!ignore) setData(json);
      } finally {
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const subtotal = data.total;
  const progress = Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 will-change-transform
          ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              aria-label="Close cart"
              className="rounded-full border px-2 py-1 text-sm hover:bg-neutral-50"
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold">My Cart ({data.items.length})</h2>
          </div>
        </div>

        {/* Free shipping banner */}
        <div className="px-5 py-3">
          <div className="rounded-xl border bg-white p-3">
            <p className="text-sm">
              {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                <>Congrats! You&apos;ve earned <span className="font-semibold">Free Shipping</span>.</>
              ) : (
                <>
                  You&apos;re <span className="font-semibold">
                    ${(remaining / 100).toFixed(2)}
                  </span>{" "}
                  away from Free Shipping.
                </>
              )}
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {loading ? (
            <div className="py-10 text-center text-sm text-neutral-500">Loading…</div>
          ) : data.items.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-500">Your cart is empty.</div>
          ) : (
            <ul className="space-y-4">
              {data.items.map((it) => (
                <li key={it.id} className="flex gap-3 border-b pb-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.imageUrl}
                        alt={it.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {it.title}
                    </div>
                    {it.variantLabel && (
                      <div className="text-xs text-neutral-500">{it.variantLabel}</div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <div className="flex items-center rounded-full border">
                        {/* Quantity UI is static for now; wire to API later */}
                        <button
                          className="px-2 py-1 text-lg leading-none hover:bg-neutral-50"
                          aria-label="Decrease quantity"
                          disabled
                        >−</button>
                        <span className="px-2">{it.qty}</span>
                        <button
                          className="px-2 py-1 text-lg leading-none hover:bg-neutral-50"
                          aria-label="Increase quantity"
                          disabled
                        >＋</button>
                      </div>
                      <button className="text-xs text-neutral-500 underline" disabled>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      ${(it.line / 100).toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      ${(it.priceCents / 100).toFixed(2)} ea
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Checkout */}
        <div className="border-t p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-semibold">${(subtotal / 100).toFixed(2)}</span>
          </div>

          <form method="post" action="/api/stripe/checkout">
            <input type="hidden" name="amount" value={subtotal} />
            <button
              className="flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
              disabled={data.items.length === 0}
            >
              Checkout • ${(subtotal / 100).toFixed(2)}
            </button>
          </form>

          <p className="mt-2 text-[11px] leading-4 text-neutral-500">
            By clicking the Checkout button, I represent I agree to the Terms.
          </p>
        </div>
      </aside>
    </>
  );
}
