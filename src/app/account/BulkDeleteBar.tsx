"use client";

import { useEffect, useState } from "react";

export default function BulkDeleteBar({ containerId }: { containerId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const container = document.getElementById(containerId);
    const all = document.getElementById("select-all") as HTMLInputElement | null;

    function updateCount() {
      const checks = container?.querySelectorAll<HTMLInputElement>('input.row-check:checked');
      setCount(checks ? checks.length : 0);
      if (all && checks && container) {
        const total = container.querySelectorAll<HTMLInputElement>('input.row-check').length;
        all.indeterminate = checks.length > 0 && checks.length < total;
        all.checked = checks.length > 0 && checks.length === total;
      }
    }

    function onAllChange() {
      if (!all || !container) return;
      const boxes = container.querySelectorAll<HTMLInputElement>('input.row-check');
      boxes.forEach((b) => (b.checked = !!all.checked));
      updateCount();
    }

    updateCount();

    // listen to changes
    container?.addEventListener("change", updateCount);
    all?.addEventListener("change", onAllChange);
    return () => {
      container?.removeEventListener("change", updateCount);
      all?.removeEventListener("change", onAllChange);
    };
  }, [containerId]);

  async function onBulkDelete() {
    const container = document.getElementById(containerId);
    const checks = container?.querySelectorAll<HTMLInputElement>('input.row-check:checked');
    const ids = checks ? Array.from(checks).map((c) => c.value) : [];
    if (ids.length === 0) return;
    const ok = window.confirm(`Delete ${ids.length} product${ids.length === 1 ? '' : 's'}? This cannot be undone.`);
    if (!ok) return;
    await fetch('/api/admin/products/bulk-delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    location.reload();
  }

  return (
    <div className="flex items-center justify-between p-2">
      <div className="text-xs text-neutral-600">Selected: {count}</div>
      <button
        className={`rounded border px-3 py-1 text-xs ${count ? 'border-red-500 text-red-600 hover:bg-red-50' : 'opacity-50 cursor-not-allowed'}`}
        disabled={!count}
        onClick={onBulkDelete}
      >
        Delete Selected
      </button>
    </div>
  );
}

