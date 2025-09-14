"use client";

import { useMemo, useState } from "react";

type Variant = {
  id: string;
  sku: string | null;
  priceCents: number;
  inventoryOnHand: number | null;
  inventoryReserved: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: any;
};

export default function QuickBuy({ variants }: { variants: Variant[] }) {
  const [open, setOpen] = useState(false);
  const [variantId, setVariantId] = useState<string | undefined>(variants[0]?.id);
  const [menuOpen, setMenuOpen] = useState(false);

  const selected = useMemo(() => variants.find((v) => v.id === variantId), [variants, variantId]);
  const outOfStock = !selected || (selected.inventoryOnHand ?? 0) <= 0;

  async function addToCart() {
    if (!variantId || outOfStock) return;
    await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, qty: 1 }),
    });
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cart:open'));
      }
    }, 50);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-full border border-black px-4 py-2 text-center text-sm font-semibold hover:bg-neutral-50"
      >
        Quick Buy
      </button>
    );
  }

  return (
    <div className="mt-3 relative z-20 overflow-visible rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold tracking-wide text-neutral-600">
        <span>VARIANT</span>
        <button type="button" onClick={() => setOpen(false)} className="text-neutral-500 hover:text-neutral-700">
          ×
        </button>
      </div>
      <VariantPopover
        variants={variants}
        value={variantId}
        onChange={(id) => setVariantId(id)}
        open={menuOpen}
        setOpen={setMenuOpen}
      />

      <button
        type="button"
        onClick={addToCart}
        disabled={outOfStock}
        className={`mt-3 w-full rounded-full px-5 py-3 text-sm font-semibold text-white ${
          outOfStock ? "cursor-not-allowed bg-neutral-400" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {outOfStock ? "Out of stock" : "Add to Cart"}
      </button>
    </div>
  );
}

function variantLabel(v: Variant) {
  // try common attribute keys, then sku
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const a = v?.attributes || {};
  const label = a.option ?? a.color ?? a.name ?? a.flavor ?? v.sku ?? "Variant";
  return String(label);
}

function VariantPopover({
  variants,
  value,
  onChange,
  open,
  setOpen,
}: {
  variants: Variant[];
  value: string | undefined;
  onChange: (id: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const label = useMemo(() => {
    const v = variants.find((x) => x.id === value) || variants[0];
    return v ? variantLabel(v) : "Select variant";
  }, [value, variants]);

  // Outside click / Escape close
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useMemo(() => setMounted(true), []);

  function onDocClick(e: MouseEvent) {
    if (!container) return;
    if (!container.contains(e.target as Node)) setOpen(false);
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }
  // attach listeners when open
  useMemo(() => {
    if (!open) return;
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, container]);

  return (
    <div ref={setContainer} className="relative z-30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border-2 border-neutral-400 bg-white px-3 py-2 text-left text-sm hover:border-neutral-500 focus:border-black focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <svg
          className={`h-4 w-4 text-neutral-600 transition-transform ${open ? "-scale-y-100" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full mt-2 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white shadow-xl ring-1 ring-black/5"
        >
          {variants.map((v) => {
            const disabled = (v.inventoryOnHand ?? 0) <= 0;
            const text = `${variantLabel(v)}${disabled ? " — Out of stock" : ""}`;
            const isSelected = v.id === value;
            return (
              <li key={v.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(v.id);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm ${
                    disabled
                      ? "cursor-not-allowed text-neutral-400"
                      : isSelected
                      ? "bg-neutral-100"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  {text}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
