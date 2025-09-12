"use client";
import { useEffect, useState } from "react";
import CartSlideOver from "./cartSlideOver";
import { ShoppingBag } from "lucide-react";

export default function CartTrigger({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  // open cart via custom event
  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("cart:open", openHandler as EventListener);
    return () => window.removeEventListener("cart:open", openHandler as EventListener);
  }, []);

  // listen for count broadcasts from the drawer
  useEffect(() => {
    const onCount = (e: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const n = (e as any).detail as number;
      if (typeof n === "number") setCount(n);
    };
    window.addEventListener("cart:count", onCount as EventListener);

    // initial fetch (so the badge is right on first render)
    (async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const data = (await res.json()) as { items: Array<{ id: string; qty: number }> };
        setCount(data.items?.reduce((n, it) => n + (it.qty ?? 0), 0) ?? 0);

        // event listener
        const onCount = (e: Event) => {
        const n = (e as any).detail as number;
        if (typeof n === "number") setCount(n);
        };
      } catch {}
    })();

    return () => window.removeEventListener("cart:count", onCount as EventListener);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group flex flex-col items-center gap-1 hover:opacity-90 ${className}`}
      >
        <div className="relative">
          <ShoppingBag className="h-6 w-6" />
          {/* Badge */}
          <span
            className="absolute -top-3 -left-3 flex h-5 min-w-[1.25rem] items-center justify-center
                       rounded-full bg-amber-400 px-1 text-[11px] font-bold leading-none
                       text-black shadow"
            aria-label={`${count} items in cart`}
          >
            {count}
          </span>
        </div>
        <span className="text-xs tracking-wide">CART</span>
      </button>

      <CartSlideOver open={open} onClose={() => setOpen(false)} />
    </>
  );
}
