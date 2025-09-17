"use client";

import { useEffect, useState } from "react";

export default function AddressCreateInline() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("US");

  useEffect(() => {
    const onNew = () => setOpen(true);
    window.addEventListener("address:new", onNew as EventListener);
    return () => window.removeEventListener("address:new", onNew as EventListener);
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/addresses/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line1, line2, city, region, postal, country }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Create failed');
      }
      // simplest: refresh to show the new address in the list
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <form onSubmit={onSave} className="mt-4 max-w-lg rounded-xl border bg-neutral-50 p-4">
      <div className="text-xs font-semibold tracking-wide text-neutral-500">ADD NEW ADDRESS</div>
      <div className="mt-3 grid grid-cols-1 gap-3">
        <input className="rounded border px-3 py-2" placeholder="Address" value={line1} onChange={(e) => setLine1(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Apartment, suite, etc. (optional)" value={line2} onChange={(e) => setLine2(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input className="rounded border px-3 py-2" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
          <input className="rounded border px-3 py-2" placeholder="State/Region" value={region} onChange={(e) => setRegion(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Postal code" value={postal} onChange={(e) => setPostal(e.target.value)} required />
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
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <button type="button" className="rounded border px-3 py-1.5 text-xs font-semibold" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

