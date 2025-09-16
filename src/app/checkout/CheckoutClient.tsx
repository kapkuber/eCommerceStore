"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

type CartItem = {
  id: string;
  title: string;
  priceCents: number;
  qty: number;
  line: number;
  imageUrl: string | null;
  variantLabel: string | null;
};

type CartData = { items: CartItem[]; total: number };

export default function CheckoutClient() {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartData>({ items: [], total: 0 });
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // simple form state (you can swap to react-hook-form later)
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("US");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const data = (await res.json()) as CartData;
        setCart(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subtotal = cart.total;
  const shipping = 0; // compute after address if you like
  const discount = 0; // hook up a code later
  const total = Math.max(0, subtotal + shipping - discount);

  // Create/recreate PaymentIntent when total changes
  useEffect(() => {
    if (total <= 0) { setClientSecret(null); return; }
    (async () => {
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "usd" }),
      });
      const json = await resp.json();
      setClientSecret(json?.clientSecret || null);
    })();
  }, [total]);

  const stripePromise = useMemo(() => loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""), []);

  const appearance = { theme: "stripe" as const };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:grid lg:grid-cols-12 lg:gap-8">
      {/* LEFT: Contact / Delivery / Payment */}
      <section className="lg:col-span-7">
        <h1 className="sr-only">Checkout</h1>

        {/* Express checkout (placeholders) */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium">Express checkout</div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["PayPal", "Amazon Pay", "Google Pay"].map((t) => (
              <button
                key={t}
                className="h-10 rounded-lg border bg-white text-sm font-semibold hover:bg-neutral-50"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* OR divider */}
        <div className="my-5 flex items-center gap-4 text-xs text-neutral-500">
          <div className="h-px flex-1 bg-neutral-200" />
          OR
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form onSubmit={(e)=>e.preventDefault()} className="space-y-6">
          {/* Contact */}
          <div className="rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Contact</h2>
              <a href="/api/auth/signin" className="text-sm text-green-700 hover:underline">
                Sign in
              </a>
            </div>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" className="h-4 w-4" /> Email me with news and offers
            </label>
          </div>

          {/* Delivery */}
          <div className="rounded-2xl border p-4">
            <h2 className="mb-3 text-base font-semibold">Delivery</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select value={country} onChange={(e)=>setCountry(e.target.value)} className="rounded-lg border px-3 py-2">
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
              </select>

              <div className="sm:col-span-1" />

              <input
                placeholder="First name"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
              <input
                placeholder="Last name"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />

              <input
                placeholder="Company (optional)"
                className="sm:col-span-2 rounded-lg border px-3 py-2"
              />

              <input
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="sm:col-span-2 rounded-lg border px-3 py-2"
              />
              <input
                placeholder="Apartment, suite, etc. (optional)"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="sm:col-span-2 rounded-lg border px-3 py-2"
              />

              <input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
              <input
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
              <input
                placeholder="ZIP code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
              <input
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          {/* Shipping method (placeholder until address entered) */}
          <div className="rounded-2xl border p-4">
            <h2 className="mb-3 text-base font-semibold">Shipping method</h2>
            <p className="text-sm text-neutral-600">
              Enter your shipping address to view available shipping methods.
            </p>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border p-4">
            <h2 className="mb-3 text-base font-semibold">Payment</h2>
            <p className="text-xs text-neutral-600">All transactions are secure and encrypted.</p>
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                <PaymentElement className="mt-3" />
                <StripePayNow
                  amount={total}
                  email={email}
                  name={`${first} ${last}`.trim()}
                  address={{ line1: address, line2: address2, city, state, postal_code: zip, country }}
                />
              </Elements>
            )}

            <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" className="h-4 w-4" /> Save my information for a faster checkout
            </label>

            {/* Pay button rendered by StripePayNow */}
          </div>
        </form>
      </section>

      {/* RIGHT: Order summary */}
      <aside className="mt-8 lg:col-span-5 lg:mt-0">
        <div className="rounded-2xl border p-4">
          {/* Discount code */}
          <div className="flex gap-2">
            <input
              placeholder="Discount code or gift card"
              className="min-w-0 flex-1 rounded-lg border px-3 py-2"
            />
            <button className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50">Apply</button>
          </div>

          {/* Items */}
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="text-sm text-neutral-500">Loading cart…</div>
            ) : cart.items.length === 0 ? (
              <div className="text-sm text-neutral-500">Your cart is empty.</div>
            ) : (
              cart.items.map((it) => (
                <div key={it.id} className="flex items-start gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg border bg-neutral-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.imageUrl || ""} alt={it.title} className="h-full w-full object-cover" />
                    <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[10px] text-white">
                      {it.qty}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{it.title}</div>
                    {it.variantLabel && (
                      <div className="text-xs text-neutral-500 truncate">{it.variantLabel}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-sm font-semibold">
                    ${(it.line / 100).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={`$${(subtotal / 100).toFixed(2)}`} />
            <Row
              label="Shipping"
              value={shipping === 0 ? "Enter shipping address" : `$${(shipping / 100).toFixed(2)}`}
            />
            {discount > 0 && <Row label="Discount" value={`-$${(discount / 100).toFixed(2)}`} />}
            <div className="mt-2 border-t pt-2 text-base font-semibold">
              <Row label="Total" value={`$${(total / 100).toFixed(2)}`} />
            </div>
          </div>

          {/* Upsells (static placeholders) */}
          <div className="mt-6">
            <div className="text-sm font-semibold">Add to your order</div>
            <div className="mt-3 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded bg-neutral-100" />
                    <div className="text-sm">
                      <div className="font-medium">Sample Product {i}</div>
                      <div className="text-xs text-neutral-500">$24.99</div>
                    </div>
                  </div>
                  <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50">Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

function StripePayNow({ amount, email, name, address }: { amount: number; email: string; name: string; address: { line1: string; line2: string; city: string; state: string; postal_code: string; country: string; } }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          receipt_email: email || undefined,
          payment_method_data: {
            billing_details: {
              name: name || undefined,
              email: email || undefined,
              address,
            },
          },
        },
      });
      if (error) {
        setError(error.message || 'Payment failed');
        setSubmitting(false);
        return;
      }
      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture' || paymentIntent.status === 'processing')) {
        // Create order and clear cart
        const form = new FormData();
        form.append('email', email);
        form.append('name', name);
        form.append('line1', address.line1);
        form.append('line2', address.line2);
        form.append('city', address.city);
        form.append('state', address.state);
        form.append('postal', address.postal_code);
        form.append('country', address.country);
        const res = await fetch('/api/checkout', { method: 'POST', body: form });
        try { const j = await res.json(); if (j?.url) window.location.href = j.url; else window.location.href = '/account'; } catch { window.location.href = '/account'; }
        return;
      }
      setError('Payment could not be completed.');
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      {error && <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <button
        type="button"
        onClick={onSubmit}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={submitting || !stripe || !elements || amount <= 0}
      >
        {submitting ? 'Processing…' : `Pay now`}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
