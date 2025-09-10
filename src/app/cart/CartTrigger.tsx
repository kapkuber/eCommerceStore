"use client";
import { useEffect, useState } from "react";
import CartSlideOver from "./cartSlideOver";

export default function CartTrigger() {
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
        className="hover:opacity-80"
      >
        Cart
      </button>
      <CartSlideOver open={open} onClose={() => setOpen(false)} />
    </>
  );
}
