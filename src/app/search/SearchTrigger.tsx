"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SearchItem = {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  price: number; // dollars
  imageUrl: string | null;
};

const POPULAR = ["Keyboards", "Mouses", "USB", "Headphones"];

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setActive(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        const data = (await res.json()) as { items: SearchItem[] };
        setResults(data.items || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  // Esc + arrow nav inside overlay
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (!results.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, results.length - 1));
        listRef.current?.children[Math.min(active + 1, results.length - 1)]?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        listRef.current?.children[Math.max(active - 1, 0)]?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        const r = results[active];
        if (r) window.location.href = `/products/${r.slug}`;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active]);

  const showEmptyState = useMemo(
    () => open && !q.trim() && !loading && results.length === 0,
    [open, q, loading, results.length]
  );

  return (
    <>
      {/* Trigger: just the word “Search” (no icon/outline) */}
      <button
        onClick={() => setOpen(true)}
        className="hover:opacity-80"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Search
      </button>

      {/* Overlay */}
      <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute left-1/2 top-24 w-full max-w-2xl -translate-x-1/2 px-4 transition-all ${
            open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
            {/* Input row with thicker outline */}
            <div className="mx-4 my-3 flex items-center gap-2 rounded-xl border-2 border-neutral-300 px-3 py-2">
              {/* keep the icon inside the bar; remove if you don’t want it */}
              <SearchIcon className="h-5 w-5 text-neutral-500" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-full bg-transparent text-sm text-black outline-none placeholder:text-neutral-400"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
                >
                  Clear
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-xs text-neutral-500 hover:text-neutral-700">
                Esc
              </button>
            </div>

            {/* Results area */}
            <div className="max-h-[70vh] overflow-y-auto">
              {/* Loading skeleton */}
              {loading && (
                <ul className="space-y-2 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="h-12 w-12 animate-pulse rounded bg-neutral-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/5 animate-pulse rounded bg-neutral-200" />
                        <div className="h-3 w-2/5 animate-pulse rounded bg-neutral-200" />
                      </div>
                      <div className="h-3 w-12 animate-pulse rounded bg-neutral-200" />
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state - Popular searches */}
              {showEmptyState && (
                <div className="p-4 text-black">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
                    Popular searches
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR.map((t) => (
                      <button
                        key={t}
                        onClick={() => setQ(t)}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-50"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {!loading && q.trim() && results.length === 0 && (
                <div className="p-4 text-sm text-black">No results</div>
              )}

              {/* Results list (sets base text color once) */}
              {!loading && results.length > 0 && (
                <ul ref={listRef} className="p-2 text-black">
                  {results.map((r, i) => {
                    const isActive = i === active;
                    return (
                      <li key={r.id}>
                        <a
                          href={`/products/${r.slug}`}
                          onMouseEnter={() => setActive(i)}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                            isActive
                              ? "border-neutral-300 bg-neutral-50"
                              : "border-transparent hover:border-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt={r.title} className="h-12 w-12 rounded object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded bg-neutral-200" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{highlight(r.title, q)}</div>
                            <div className="truncate text-xs text-neutral-600">
                              {r.brand ? r.brand : "\u00A0"}
                            </div>
                          </div>
                          <div className="shrink-0 text-sm font-semibold">${r.price.toFixed(2)}</div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* --- small helpers --- */

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function highlight(text: string, q: string) {
  const term = q.trim();
  if (!term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + term.length);
  const after = text.slice(idx + term.length);
  return (
    <>
      {before}
      <mark className="rounded bg-yellow-100 px-0.5">{match}</mark>
      {after}
    </>
  );
}
