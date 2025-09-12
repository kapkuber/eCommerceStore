// app/cart/CartTrigger.tsx
"use client";
import { useEffect, useState } from "react";
import CartSlideOver from "./cartSlideOver";
import { ShoppingBag } from "lucide-react";

export default function CartTrigger({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("cart:open", openHandler as EventListener);
    return () => window.removeEventListener("cart:open", openHandler as EventListener);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group flex flex-col items-center gap-1 hover:opacity-90 ${className}`}
      >
        <ShoppingBag className="h-6 w-6" />  {/* ← icon */}
        <span className="text-xs tracking-wide">CART</span>
      </button>

      <CartSlideOver open={open} onClose={() => setOpen(false)} />
    </>
  );
}
