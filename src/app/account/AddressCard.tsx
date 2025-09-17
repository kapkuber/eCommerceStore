"use client";

import { useEffect, useState } from "react";

type Address = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal: string;
  country: string;
};

export default function AddressCard({ address }: { address: Address }) {
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [line1, setLine1] = useState(address.line1 || "");
  const [line2, setLine2] = useState(address.line2 || "");
  const [city, setCity] = useState(address.city || "");
  const [region, setRegion] = useState(address.region || "");
  const [postal, setPostal] = useState(address.postal || "");
  const [country, setCountry] = useState(address.country || "US");

  // Allow external triggers to open edit mode (e.g., a section-level button)
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail?.id as string | undefined;
      if (id && id === address.id) setEditing(true);
    };
    window.addEventListener("address:edit", handler as EventListener);
    return () => window.removeEventListener("address:edit", handler as EventListener);
  }, [address.id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/addresses/${address.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line1, line2, city, region, postal, country }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <div className="rounded-xl border bg-neutral-50 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wide text-neutral-500">CURRENT ADDRESS</div>
            <div className="mt-3 text-sm">
              <div>{line1}{line2 ? `, ${line2}` : ""}</div>
              <div>{[city, region, postal].filter(Boolean).join(", ")}</div>
              <div>{country}</div>
            </div>
          </div>
          <button
            className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-100"
            onClick={() => setEditing(true)}
          >
            Edit address
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="rounded-xl border bg-neutral-50 p-4">
      <div className="text-xs font-semibold tracking-wide text-neutral-500">EDIT ADDRESS</div>
      <div className="mt-3 grid grid-cols-1 gap-3">
        <input className="rounded border px-3 py-2" placeholder="Address" value={line1}
               onChange={(e) => setLine1(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Apartment, suite, etc. (optional)" value={line2 || ""}
               onChange={(e) => setLine2(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input className="rounded border px-3 py-2" placeholder="City" value={city}
                 onChange={(e) => setCity(e.target.value)} required />
          <input className="rounded border px-3 py-2" placeholder="State/Region" value={region || ""}
                 onChange={(e) => setRegion(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Postal code" value={postal}
                 onChange={(e) => setPostal(e.target.value)} required />
        </div>
        <select className="rounded border px-3 py-2" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
        </select>
      </div>
      {error && <div className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={submitting} className="rounded bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {submitting ? "Saving..." : "Save"}
        </button>
        <button type="button" className="rounded border px-3 py-1.5 text-xs font-semibold" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
