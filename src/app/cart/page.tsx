export const runtime = 'nodejs';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/db';
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react';

export default async function CartPage() {
  const cartId = (await cookies()).get('cart_id')?.value;
  if (!cartId) return <div className="p-6">Your cart is empty.</div>;

  const items = (await redis.hgetall(`cart:${cartId}`)) || {} as Record<string, string>;
  const variantIds = Object.keys(items);
  if (variantIds.length === 0) return <div className="p-6">Your cart is empty.</div>;

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true }
  });

  const rows = variants.map((v: { id: string | number; priceCents: number; }) => {
    const qty = parseInt(items[v.id] || '0', 10);
    return { v, qty, line: v.priceCents * qty };
  });

  const total = rows.reduce((s: any, r: { line: any; }) => s + r.line, 0);

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Cart</h1>
      <div className="space-y-2">
        {rows.map((r: { v: { id: Key | null | undefined; product: { title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }; sku: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; priceCents: number; }; qty: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; line: number; }) => (
          <div key={r.v.id} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="font-medium">{r.v.product.title}</div>
              <div className="text-sm text-muted-foreground">{r.v.sku}</div>
            </div>
            <div>{r.qty} × ${(r.v.priceCents/100).toFixed(2)}</div>
            <div className="font-semibold">${(r.line/100).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-right text-xl font-semibold">Total: ${(total/100).toFixed(2)}</div>
      <form method="post" action="/api/stripe/checkout" className="mt-4">
        <input type="hidden" name="amount" value={total}/>
        <button className="px-4 py-2 rounded-xl border">Checkout</button>
      </form>
    </main>
  );
}
