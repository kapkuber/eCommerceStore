import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      // addresses are optional
    },
  });

  if (!order) return <main className="mx-auto max-w-3xl px-6 py-10">Order not found.</main>;

  const total = order.totalCents;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Thank you! Your order is placed.</h1>
      <p className="mt-1 text-sm text-neutral-600">Order ID: {order.id}</p>
      <p className="mt-1 text-sm text-neutral-600">Status: {order.status}</p>

      <section className="mt-6 rounded-xl border p-4">
        <h2 className="text-base font-semibold">Items</h2>
        <ul className="mt-3 divide-y">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium">{it.variant.product.title}</div>
                <div className="text-neutral-600">SKU: {it.variant.sku}</div>
              </div>
              <div className="text-right">
                <div>Qty: {it.qty}</div>
                <div>${(it.unitPriceCents / 100).toFixed(2)}</div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm font-semibold">
          <span>Total</span>
          <span>${(total / 100).toFixed(2)}</span>
        </div>
      </section>
    </main>
  );
}

