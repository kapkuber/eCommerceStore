"use client";

export default function AddToCartButton({ variantId }: { variantId?: string }) {
  async function onClick() {
    if (!variantId) return;
    await fetch("/api/cart/add", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId, qty: 1 }),
    });
    // Small delay so the Set-Cookie from the response is applied
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cart:open"));
    }, 50);
  }

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full border hover:bg-neutral-50"
    >
      Add to cart
    </button>
  );
}
