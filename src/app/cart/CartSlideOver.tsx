"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

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

const FREE_SHIPPING_THRESHOLD = 8000; // $80

export default function CartSlideOver({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CartData>({ items: [], total: 0 });
  const panelRef = useRef<HTMLDivElement | null>(null);

  // derive total quantity from current state
  const totalQty = useMemo(
    () => data.items.reduce((n, it) => n + (it.qty ?? 0), 0),
    [data.items]
  );

  async function fetchCart() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const json: CartData = await res.json();
      setData(json);

      // broadcast total quantity (not line count)
      const qty = json.items.reduce((n, it) => n + (it.qty ?? 0), 0);
      window.dispatchEvent(new CustomEvent("cart:count", { detail: qty }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (open) fetchCart(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 👇 Belt & suspenders: if the route changes while the drawer is open, close it.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // intentionally not depending on onClose to avoid re-run noise

  const inFlightRef = useRef<Record<string, number>>({});
  const debounceRef = useRef<Record<string, any>>({});

  function applyLocalDelta(variantId: string, delta: number) {
    setData(prev => {
      const items = prev.items.map(i => ({ ...i }));
      const idx = items.findIndex(i => i.id === variantId);
      if (idx === -1) return prev;

      const it = items[idx];
      const nextQty = Math.max(0, it.qty + delta);
      const newTotal = Math.max(0, prev.total + delta * it.priceCents);

      if (nextQty === 0) {
        items.splice(idx, 1);
      } else {
        it.qty = nextQty;
        it.line = nextQty * it.priceCents;
        items[idx] = it;
      }

      if (typeof window !== "undefined") {
        const qty = items.reduce((n, i) => n + (i.qty ?? 0), 0);
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent("cart:count", { detail: qty }));
        });
      }

      return { items, total: newTotal };
    });
  }

  async function sendAccumulatedDelta(variantId: string) {
    const delta = inFlightRef.current[variantId] || 0;
    if (!delta) return;
    inFlightRef.current[variantId] = 0;

    try {
      await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, delta }),
      });
      // optional: re-sync from server if you don’t fully trust local math
      // await fetchCart();
    } catch (e) {
      // rollback by applying the opposite delta
      applyLocalDelta(variantId, -delta);
      console.error("Failed to update cart:", e);
    }
  }

  function bumpQty(variantId: string, delta: number) {
    // 1) Optimistically update UI instantly
    applyLocalDelta(variantId, delta);

    // 2) Accumulate rapid clicks and send once after a short pause
    inFlightRef.current[variantId] = (inFlightRef.current[variantId] || 0) + delta;

    // clear previous debounce
    if (debounceRef.current[variantId]) {
      clearTimeout(debounceRef.current[variantId]);
    }
    debounceRef.current[variantId] = setTimeout(() => {
      sendAccumulatedDelta(variantId);
    }, 150);
  }

  const subtotal = data.total;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD);
  const earnedFreeShip = subtotal >= FREE_SHIPPING_THRESHOLD;

  // 👇 Click handler that closes first, then navigates (prevents Link's default nav)
  function handleCheckoutClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (data.items.length === 0) return; // still respects disabled state
    e.preventDefault();
    onClose();
    // If you want to let the close animation run for ~150–200ms, you can delay push:
    // setTimeout(() => router.push("/checkout"), 150);
    router.push("/checkout");
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        id="cart-drawer"
        ref={panelRef}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        {/* Header */}
        <div className="relative flex items-center justify-center border-b px-6 py-4">
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="absolute left-6 rounded-full border px-3 py-1 text-sm text-neutral-900 hover:bg-neutral-50"
          >
            X
          </button>
          <h2 id="cart-title" className="text-lg font-semibold text-neutral-900">
            My Cart ({totalQty})
          </h2>
        </div>

        {/* Free-shipping banner */}
        <div className="border-b bg-amber-50 px-6 py-3">
          <p className="text-sm text-neutral-900 text-center">
            {earnedFreeShip ? (
              <>Congrats! You&apos;ve earned <span className="font-semibold">Free Shipping</span>!</>
            ) : (
              <>You are <span className="font-semibold">${(remaining / 100).toFixed(2)}</span> away from <span className="font-semibold">Free Shipping</span></>
            )}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {loading ? (
            <div className="py-10 text-center text-sm text-neutral-700">Loading...</div>
          ) : data.items.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-700">Your cart is empty.</div>
          ) : (
            <ul className="divide-y">
              {data.items.map((it) => (
                <li key={it.id} className="flex gap-4 py-5">
                  {/* Bigger image */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-28 sm:w-28">
                    {it.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt={it.title} className="h-full w-full object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Title + unit price */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-neutral-900">
                          {it.title}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-neutral-900">
                        ${(it.priceCents / 100).toFixed(2)}
                      </div>
                    </div>

                    {/* Qty + Remove */}
                    <div className="mt-3 flex items-center gap-6">
                      <div className="flex items-center">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => bumpQty(it.id, -1)}
                          className="h-8 w-8 rounded-full border text-lg leading-none text-neutral-900 hover:bg-neutral-50"
                        >
                          -
                        </button>
                        <span className="mx-3 select-none text-sm text-neutral-900">{it.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => bumpQty(it.id, +1)}
                          className="h-8 w-8 rounded-full border text-lg leading-none text-neutral-900 hover:bg-neutral-50"
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="text-sm text-neutral-800 underline underline-offset-2"
                        onClick={() => bumpQty(it.id, -it.qty)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 pb-6 pt-4">
          <Link
            href="/checkout"
            onClick={handleCheckoutClick}
            className={`flex w-full items-center justify-center rounded-full bg-black px-4 py-4 text-base font-bold text-white transition hover:opacity-90 ${
              data.items.length === 0 ? "pointer-events-none opacity-50" : ""
            }`}
            aria-disabled={data.items.length === 0}
          >
            Checkout • ${(subtotal / 100).toFixed(2)}
          </Link>

          <p className="mt-2 text-[11px] leading-4 text-neutral-500 text-center">
            By clicking the Checkout button, I represent I agree to the Terms.
          </p>
        </div>
      </aside>
    </>
  );
}
