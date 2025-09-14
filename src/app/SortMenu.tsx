"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SortKey = "newest" | "oldest" | "price_desc" | "price_asc";

export default function SortMenu({ current, category }: { current: SortKey; category: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const label: string =
    current === "oldest"
      ? "Oldest"
      : current === "price_desc"
      ? "Highest price"
      : current === "price_asc"
      ? "Lowest price"
      : "Newest";

  const base = category ? `/?category=${encodeURIComponent(category)}` : "/?";
  const withSort = (s: SortKey) => `${base}${category ? "&" : ""}sort=${s}`;

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-neutral-800 hover:bg-neutral-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-neutral-500">Sort by:</span>
        <span className="font-semibold">{label}</span>
        <svg
          className={`h-4 w-4 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <ul
          role="menu"
          className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border bg-white shadow-lg"
        >
          <li>
            <Link href={withSort("newest")} onClick={() => setOpen(false)} className={`block px-4 py-2 hover:bg-neutral-50 ${current === "newest" ? "font-medium" : ""}`}>
              Newest
            </Link>
          </li>
          <li>
            <Link href={withSort("oldest")} onClick={() => setOpen(false)} className={`block px-4 py-2 hover:bg-neutral-50 ${current === "oldest" ? "font-medium" : ""}`}>
              Oldest
            </Link>
          </li>
          <li>
            <Link href={withSort("price_desc")} onClick={() => setOpen(false)} className={`block px-4 py-2 hover:bg-neutral-50 ${current === "price_desc" ? "font-medium" : ""}`}>
              Highest price
            </Link>
          </li>
          <li>
            <Link href={withSort("price_asc")} onClick={() => setOpen(false)} className={`block px-4 py-2 hover:bg-neutral-50 ${current === "price_asc" ? "font-medium" : ""}`}>
              Lowest price
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
