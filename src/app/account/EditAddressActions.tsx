"use client";

export default function EditAddressActions({ primaryId }: { primaryId?: string }) {
  return (
    <div className="mt-3">
      <button
        type="button"
        className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-100"
        onClick={() => {
          if (primaryId) {
            window.dispatchEvent(new CustomEvent('address:edit', { detail: { id: primaryId } }));
          } else {
            window.dispatchEvent(new Event('address:new'));
          }
        }}
      >
        {primaryId ? 'Edit address' : 'Add address'}
      </button>
    </div>
  );
}

