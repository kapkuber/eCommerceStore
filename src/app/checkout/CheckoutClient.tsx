"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe, type PaymentRequest as StripePaymentRequest } from "@stripe/stripe-js";
import { Elements, PaymentElement, PaymentRequestButtonElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useSession, signOut } from "next-auth/react";

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
  const { data: session, status } = useSession(); // 👈 session on the client

  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartData>({ items: [], total: 0 });
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // form state
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

  // 👇 Pre-fill from session (without clobbering user edits)
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (!email && session.user.email) setEmail(session.user.email);
    const fullName = session.user.name?.trim() || "";
    if ((first === "" && last === "") && fullName) {
      const parts = fullName.split(" ");
      setFirst(parts[0] || "");
      setLast(parts.slice(1).join(" ") || "");
    }
  }, [status, session, email, first, last]);

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
  const shipping = 0;
  const discount = 0;
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

  const stripePromise = useMemo(
    () => loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""),
    []
  );

  const appearance = { theme: "stripe" as const };

  const isSignedIn = status === "authenticated";
  const prefilledName = isSignedIn && Boolean(session?.user?.name?.trim());

  return (
    <Elements
      stripe={stripePromise}
      options={clientSecret ? { clientSecret, appearance } : undefined}
      key={clientSecret || "no-client"}
    >
    <main className="mx-auto max-w-6xl px-4 py-8 lg:grid lg:grid-cols-12 lg:gap-8">
      {/* LEFT: Contact / Delivery / Payment */}
      <section className="lg:col-span-7">
        <h1 className="sr-only">Checkout</h1>

        {/* Express checkout (temporarily disabled) */}
        {false && (
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-medium">Express checkout</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Google Pay / Apple Pay via Stripe Payment Request */}
              <PaymentRequestExpress amount={total} clientSecret={clientSecret} email={email} />

              {/* PayPal Buttons */}
              <PayPalExpress amount={total} />
            </div>
          </div>
        )}

        {/* OR divider (disabled with express) */}
        {false && (
          <div className="my-5 flex items-center gap-4 text-xs text-neutral-500">
            <div className="h-px flex-1 bg-neutral-200" />
            OR
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Contact */}
          <div className="rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Email</h2>
              {/* 👇 Hide if signed in */}
              {!isSignedIn && (
                <a href="/login?callbackUrl=%2Fcheckout" className="text-sm text-green-700 hover:underline">
                  Sign in
                </a>
              )}
            </div>
            {isSignedIn ? (
              <SignedInEmailRow
                email={session?.user?.email || email}
                name={session?.user?.name || ""}
                onSignOut={async () => {
                  await signOut({ callbackUrl: "/checkout" });
                }}
              />
            ) : (
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                autoComplete="email"
              />
            )}
            <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" className="h-4 w-4" /> Email me with news and offers
            </label>
          </div>

          {/* Delivery */}
          <div className="rounded-2xl border p-4">
            <h2 className="mb-3 text-base font-semibold">Delivery</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-lg border px-3 py-2"
                autoComplete="country"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
              </select>

              <div className="sm:col-span-1" />

              <input
                placeholder="First name"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                className={`rounded-lg border px-3 py-2 ${prefilledName ? "bg-neutral-100 text-neutral-500" : ""}`}
                autoComplete="given-name"
              />
              <input
                placeholder="Last name"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                className={`rounded-lg border px-3 py-2 ${prefilledName ? "bg-neutral-100 text-neutral-500" : ""}`}
                autoComplete="family-name"
              />

              <input
                placeholder="Company (optional)"
                className="sm:col-span-2 rounded-lg border px-3 py-2"
                autoComplete="organization"
              />

              <input
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="sm:col-span-2 rounded-lg border px-3 py-2"
                autoComplete="address-line1"
              />
              <input
                placeholder="Apartment, suite, etc. (optional)"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="sm:col-span-2 rounded-lg border px-3 py-2"
                autoComplete="address-line2"
              />

              <input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border px-3 py-2"
                autoComplete="address-level2"
              />
              <input
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-lg border px-3 py-2"
                autoComplete="address-level1"
              />
              <input
                placeholder="ZIP code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="rounded-lg border px-3 py-2"
                autoComplete="postal-code"
              />
              <input
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border px-3 py-2"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Shipping method (placeholder) */}
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
              <>
                <PaymentElement className="mt-3" />
                <StripePayNow
                  amount={total}
                  email={email}
                  name={`${first} ${last}`.trim()}
                  address={{ line1: address, line2: address2, city, state, postal_code: zip, country }}
                />
              </>
            )}
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
    </Elements>
  );
}

function PaymentRequestExpress({ amount, clientSecret, email }: { amount: number; clientSecret: string | null; email: string }) {
  const stripe = useStripe();
  const [ready, setReady] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<StripePaymentRequest | null>(null);

  useEffect(() => {
    if (!stripe || amount <= 0) return;
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: { label: 'Total', amount },
      requestPayerEmail: true,
    });
    pr.canMakePayment().then((res) => {
      if (res) {
        setPaymentRequest(pr);
        setReady(true);
      } else {
        setReady(false);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      try {
        // Reuse the existing PI if present; otherwise create a fresh one
        let cs = clientSecret;
        if (!cs) {
          const resp = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ amount, currency: 'usd' }),
          });
          const j = await resp.json();
          cs = j?.clientSecret || null;
        }
        if (!cs) throw new Error('Missing client secret');

        const confirm = await stripe!.confirmCardPayment(cs, {
          payment_method: ev.paymentMethod.id,
          receipt_email: email || undefined,
        }, { handleActions: false });

        if (confirm.error) {
          ev.complete('fail');
          return;
        }
        ev.complete('success');

        if (confirm.paymentIntent && confirm.paymentIntent.status === 'requires_action') {
          await stripe!.confirmCardPayment(cs);
        }

        // finalize order (reuse existing flow)
        const form = new FormData();
        form.append('email', email);
        form.append('name', '');
        form.append('line1', '');
        form.append('line2', '');
        form.append('city', '');
        form.append('state', '');
        form.append('postal', '');
        form.append('country', 'US');
        form.append('paymentIntentId', confirm.paymentIntent?.id || '');
        const finalize = await fetch('/api/checkout', { method: 'POST', body: form });
        try {
          const j = await finalize.json();
          if (j?.url) window.location.href = j.url; else window.location.href = '/account';
        } catch { window.location.href = '/account'; }
      } catch (e) {
        ev.complete('fail');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, amount, clientSecret]);

  if (!stripe || !ready || !paymentRequest) return (
    <div className="flex h-10 items-center justify-center rounded-lg border text-sm text-neutral-500">
      Google/Apple Pay unavailable
    </div>
  );
  return (
    <div className="overflow-hidden rounded-lg border p-1">
      <PaymentRequestButtonElement options={{ paymentRequest }} />
    </div>
  );
}

function PayPalExpress({ amount }: { amount: number }) {
  const [loaded, setLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  useEffect(() => {
    if (!clientId) return;
    const url = new URL('https://www.paypal.com/sdk/js');
    url.searchParams.set('client-id', clientId);
    url.searchParams.set('currency', 'USD');
    url.searchParams.set('intent', 'capture');
    const script = document.createElement('script');
    script.src = url.toString();
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, [clientId]);

  useEffect(() => {
    if (!loaded || amount <= 0) return;
    const w = window as any;
    if (!w.paypal?.Buttons) return;
    const container = document.getElementById('paypal-express-container');
    if (!container) return;
    container.innerHTML = '';
    w.paypal.Buttons({
      style: { layout: 'horizontal', height: 40, shape: 'rect' },
      createOrder: async () => {
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ amount, currency: 'USD' }),
        });
        const j = await res.json();
        return j.id;
      },
      onApprove: async (data: any) => {
        await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderID }),
        });
        window.location.href = '/account';
      },
      onError: () => {
        // no-op; surface via toast in real app
      },
    }).render('#paypal-express-container');
  }, [loaded, amount]);

  if (!clientId) {
    return <div className="flex h-10 items-center justify-center rounded-lg border text-sm">Configure PayPal</div>;
  }
  if (amount <= 0) {
    return <div className="flex h-10 items-center justify-center rounded-lg border text-sm">Cart is empty</div>;
  }
  return <div id="paypal-express-container" className="h-10" />;
}

function SignedInEmailRow({
  email,
  name,
  onSignOut,
}: {
  email: string;
  name: string;
  onSignOut: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const initials = (name || email || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?";

  return (
    <div className="relative">
      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-800">
            {initials}
          </div>
          <div className="text-sm text-neutral-900">{email}</div>
        </div>
        <button
          type="button"
          aria-label="Account menu"
          className="h-8 w-8 rounded-full text-neutral-700 hover:bg-neutral-100"
          onClick={() => setOpen((v) => !v)}
        >
          ⋯
        </button>
      </div>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-36 overflow-hidden rounded-md border bg-white shadow">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
            onClick={() => onSignOut()}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function StripePayNow({
  amount,
  email,
  name,
  address,
}: {
  amount: number;
  email: string;
  name: string;
  address: { line1: string; line2: string; city: string; state: string; postal_code: string; country: string };
}) {
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
        redirect: "if_required",
        confirmParams: {
          receipt_email: email || undefined,
          payment_method_data: {
            billing_details: { name: name || undefined, email: email || undefined, address },
          },
        },
      });

      if (error) {
        setError(error.message || "Payment failed");
        setSubmitting(false);
        return;
      }

      if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "requires_capture" || paymentIntent.status === "processing")) {
        const form = new FormData();
        form.append("email", email);
        form.append("name", name);
        form.append("line1", address.line1);
        form.append("line2", address.line2);
        form.append("city", address.city);
        form.append("state", address.state);
        form.append("postal", address.postal_code);
        form.append("country", address.country);
        form.append("paymentIntentId", paymentIntent.id);

        // ⚠️ Make sure this path matches your route file:
        // If your file is app/api/stripe/checkout/route.ts then POST to /api/stripe/checkout
        const res = await fetch("/api/checkout", { method: "POST", body: form });

        try {
          const j = await res.json();
          if (j?.url) window.location.href = j.url;
          else window.location.href = "/account";
        } catch {
          window.location.href = "/account";
        }
        return;
      }
      setError("Payment could not be completed.");
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={onSubmit}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={submitting || !stripe || !elements || amount <= 0}
      >
        {submitting ? "Processing…" : `Pay now`}
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
