"use client";

import { useState } from "react";

// ----- TYPES -----
type Variant = {
  id: string;
  sku: string | null;
  label?: string | null;            // <-- make optional
  priceCents: number;
  inventoryOnHand: number | null;
  inventoryReserved: number | null;
  attributes?: any;                 // optional: if you want to read from JSON attributes
};

type Image = { id: string; url: string; alt: string | null; sort: number | null };

type ProductClientProps = {
  productId: string;
  title: string;
  brand: string | null;
  description: string | null;
  variants: Variant[];
  images: Image[];
  isAdmin: boolean;
};

// ---- MAIN CLIENT COMPONENT ----
export default function ProductClient({
  productId,
  title,
  brand,
  description,
  variants,
  images,
  isAdmin,
}: ProductClientProps) {
  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-2">
      <ImageGallery images={images} isAdmin={isAdmin} productId={productId} />

      <div className="space-y-5">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {brand && <p className="text-sm text-neutral-500">{brand}</p>}
        </header>

        {description && <p className="text-sm leading-6 text-neutral-800">{description}</p>}

        <BuyBox variants={variants} />

        {isAdmin && <InventoryAdmin variants={variants} />}
      </div>
    </main>
  );
}

// ---- IMAGE GALLERY ----
function ImageGallery({
  images,
  isAdmin,
  productId,
}: {
  images: Image[];
  isAdmin: boolean;
  productId: string;
}) {
  const [list, setList] = useState<Image[]>(images);
  const [active, setActive] = useState(0);

  async function removeImage(id: string, index: number) {
    if (!confirm('Delete this image?')) return;
    const res = await fetch(`/api/admin/images/${id}`, { method: 'DELETE' });
    if (!res.ok) return; // optionally show toast
    setList((prev) => {
      const next = prev.filter((im) => im.id !== id);
      // adjust active index if needed
      if (next.length === 0) {
        setActive(0);
      } else if (index === active || index < active) {
        setActive((a) => Math.max(0, Math.min(a - 1, next.length - 1)));
      }
      return next;
    });
  }

  const main = list[active];

  return (
    <div>
      <div className="aspect-square w-full overflow-hidden rounded-2xl border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={main?.url || "/placeholder.png"}
          alt={main?.alt || "Product image"}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {list.map((img, i) => (
          <div key={img.id} className="relative w-full">
            <button
              type="button"
              onClick={() => setActive(i)}
              className={`block w-full overflow-hidden rounded-xl border ${
                i === active ? "border-black" : "border-neutral-300 hover:border-neutral-400"
              }`}
              title={img.alt || undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || "Product thumb"}
                className="aspect-square h-auto w-full object-cover"
              />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => removeImage(img.id, i)}
                className="absolute right-2 top-2 rounded-full bg-white/95 p-1 shadow border hover:bg-white"
                aria-label="Delete image"
                title="Delete image"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdmin && <AdminAddImage productId={productId} />}
    </div>
  );
}

// ---- ADMIN ADD IMAGE ----
function AdminAddImage({ productId }: { productId: string }) {
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    form.append("productId", productId);

    await fetch("/api/admin/add-image", {
      method: "POST",
      body: form,
    });
    location.reload();
  }

  return (
    <div className="mt-4 text-sm">
      <label className="cursor-pointer rounded border px-3 py-2 hover:bg-neutral-50">
        Add image (admin)
        <input type="file" hidden onChange={handleUpload} />
      </label>
    </div>
  );
}

// ---- BUY BOX ----
function BuyBox({ variants }: { variants: Variant[] }) {
  const [selected, setSelected] = useState(variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [plan, setPlan] = useState<"SUBSCRIBE" | "ONETIME">("SUBSCRIBE"); // default subscription
  const [freq, setFreq] = useState("30"); // days

  const variant = variants.find((v) => v.id === selected);
  const price = variant?.priceCents ?? 0;
  const outOfStock = !variant || (variant.inventoryOnHand ?? 0) <= 0;

  // subscription pricing
  const SUB_SAVE = 0.10;
  const subUnit = Math.round(price * (1 - SUB_SAVE));
  const oneUnit = price;

  const unit = plan === "SUBSCRIBE" ? subUnit : oneUnit;
  const total = unit * Math.max(1, qty);

  function changeQty(n: number) {
    setQty((q) => Math.max(1, q + n));
  }

  async function addToCart() {
    if (!selected || qty < 1 || outOfStock) return;
    await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: selected, delta: qty }),
    });
    window.dispatchEvent(new CustomEvent("cart:open"));
  }

  return (
    <div className="space-y-6">
      {/* Variant selector (pills) */}
      <div>
        <div className="mb-2 text-sm font-semibold">Variant</div>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={`rounded-full px-3 py-1.5 text-sm border transition ${
                v.id === selected
                  ? "border-black bg-black text-white"
                  : `border-neutral-300 hover:bg-neutral-50 ${
                      (v.inventoryOnHand ?? 0) <= 0 ? "opacity-50" : ""
                    }`
              }`}
              title={(v.inventoryOnHand ?? 0) <= 0 ? "Out of stock" : v.sku || undefined}
            >
              {variantDisplay(v)}
            </button>
          ))}
        </div>
        {outOfStock && (
          <div className="mt-2 text-sm font-medium text-red-600">Out of stock</div>
        )}
      </div>

      {/* Subscribe & Save card */}
      <label
        className={`relative block overflow-hidden rounded-2xl border transition ${
          plan === "SUBSCRIBE" ? "border-black shadow-sm" : "border-neutral-300 hover:border-neutral-400"
        }`}
      >
        {/* Save pill */}
        <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-white">
          Save 10%
        </div>

        <div className="flex items-start gap-3 px-5 pt-5">
          <input
            type="radio"
            name="purchaseType"
            className="mt-1 h-5 w-5"
            checked={plan === "SUBSCRIBE"}
            onChange={() => setPlan("SUBSCRIBE")}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Subscribe &amp; Save</div>
              <div className="text-right">
                <div className="text-sm text-neutral-400 line-through">
                  ${ (oneUnit / 100).toFixed(2) }
                </div>
                <div className="text-lg font-bold">${ (subUnit / 100).toFixed(2) }</div>
              </div>
            </div>

            <ul className="mt-3 space-y-2 text-[15px]">
              <Benefit>Save 10% + Get Free US Shipping</Benefit>
              <Benefit>No commitment. Cancel anytime.</Benefit>
              <Benefit>
                <span className="font-semibold">Subscription Rewards:</span> 5% cashback on all
                orders + surprise gifts!
              </Benefit>
            </ul>

            {/* Deliver every */}
            <div className="mt-4">
              <div className="text-sm font-semibold">Deliver every:</div>
              <div className="mt-2">
                <div className="relative">
                  <select
                    value={freq}
                    onChange={(e) => setFreq(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-neutral-300 bg-white px-3 py-2 pr-9 text-sm"
                  >
                    <option value="30">30 days: save 10%</option>
                    <option value="45">45 days: save 10%</option>
                    <option value="60">60 days: save 10%</option>
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* bottom spacing */}
        <div className="h-4" />
      </label>

      {/* One-time card */}
      <label
        className={`block rounded-2xl border px-5 py-4 transition ${
          plan === "ONETIME" ? "border-black shadow-sm" : "border-neutral-300 hover:border-neutral-400"
        }`}
      >
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name="purchaseType"
            className="h-5 w-5"
            checked={plan === "ONETIME"}
            onChange={() => setPlan("ONETIME")}
          />
          <div className="flex w-full items-center justify-between">
            <div className="text-lg font-semibold">One-time</div>
            <div className="text-lg font-bold">${ (oneUnit / 100).toFixed(2) }</div>
          </div>
        </div>
      </label>

      {/* Quantity + CTA */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border">
          <button className="h-9 w-9 text-lg" onClick={() => changeQty(-1)} aria-label="decrease">−</button>
          <span className="w-10 text-center">{qty}</span>
          <button className="h-9 w-9 text-lg" onClick={() => changeQty(+1)} aria-label="increase">+</button>
        </div>

        <button
          onClick={addToCart}
          className={`flex-1 rounded-full px-5 py-3 font-semibold text-white ${
            outOfStock ? "bg-green-300/50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Add to Cart • ${ (total / 100).toFixed(2) }
        </button>
      </div>
    </div>
  );
}

// Small helper: check icon + text
function Benefit({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <svg className="mt-1 h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2.5 2.5L16 9" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

// label fallback helper (paste near other helpers)
function variantDisplay(v: Variant) {
  // try label, then common attributes, then sku
  // @ts-ignore optional attributes
  return (
    v.label ??
    // common attribute keys
    v?.attributes?.option ??
    v?.attributes?.color ??
    v?.attributes?.name ??
    v?.attributes?.flavor ??
    v.sku ??
    "Variant"
  );
}

// ---- INVENTORY ADMIN ----
function InventoryAdmin({ variants }: { variants: Variant[] }) {
  return (
    <div className="mt-4 rounded border p-3 text-sm text-neutral-700">
      <div className="mb-2 font-medium">Inventory (Admin)</div>
      {variants.map((v) => {
        const available = Math.max(
          0,
          (v.inventoryOnHand ?? 0) - (v.inventoryReserved ?? 0)
        );
        return (
          <div
            key={v.id}
            className="flex items-center justify-between border-b py-1 last:border-0"
          >
            <div className="truncate">SKU: {v.sku}</div>
            <div className="text-right">
              <span className="mr-3">On hand: {v.inventoryOnHand}</span>
              <span className="mr-3">Reserved: {v.inventoryReserved}</span>
              <span>Available: {available}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
