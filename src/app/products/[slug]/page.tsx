import { prisma } from '@/lib/db';
import AddToCartButton from '@/app/products/AddToCartButton';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [session, product] = await Promise.all([
    getServerSession(authOptions),
    prisma.product.findUnique({
      where: { slug },
      include: { variants: true, images: { orderBy: { sort: 'asc' } } },
    }),
  ]);

  if (!product) {
    return <main className="p-6">Not found</main>;
  }

  return (
    <main className="container mx-auto p-6 grid lg:grid-cols-2 gap-8">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full rounded-2xl aspect-video object-cover"
          src={product.images[0]?.url || ''}
          alt={product.images[0]?.alt || product.title}
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <p className="text-neutral-500">{product.brand}</p>
        <p className="my-3 text-sm">{product.description}</p>
        <div className="space-y-3">
          <AddToCartButton variantId={product.variants[0]?.id} />
        </div>
        {(session && (session.user as any)?.role === 'ADMIN') && (
          <div className="mt-4 rounded border p-3 text-sm text-neutral-700">
            <div className="font-medium mb-2">Inventory (Admin)</div>
            {product.variants.map((v) => {
              const available = Math.max(0, (v.inventoryOnHand ?? 0) - (v.inventoryReserved ?? 0));
              return (
                <div key={v.id} className="flex items-center justify-between py-1">
                  <div className="truncate">SKU: {v.sku}</div>
                  <div className="text-right">
                    <span className="mr-3">On hand: {v.inventoryOnHand}</span>
                    <span className="mr-3">Reserved: {v.inventoryReserved}</span>
                    <span>Available: {available}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
