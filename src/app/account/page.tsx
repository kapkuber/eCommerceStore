import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SignOutButton from './SignOutButton';
import { prisma } from '@/lib/db';

// Ensure this page is always rendered fresh to avoid SSR/CSR mismatches
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const isAdmin = (session.user as any)?.role === 'ADMIN';

  // If admin, load inventory stats and product/variant details for dashboard
  let products: Array<any> = [];
  let stats: {
    productCount: number;
    variantCount: number;
    onHandSum: number;
    reservedSum: number;
    lowStockCount: number;
    outOfStockCount: number;
  } | null = null;

  if (isAdmin) {
    const [productList, variantAgg, lowStock, outOfStock, variantCount] = await Promise.all([
      prisma.product.findMany({
        include: {
          images: { orderBy: { sort: 'asc' }, take: 1 },
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.productVariant.aggregate({ _sum: { inventoryOnHand: true, inventoryReserved: true } }),
      prisma.productVariant.count({ where: { inventoryOnHand: { lte: 5 } } }),
      prisma.productVariant.count({ where: { inventoryOnHand: 0 } }),
      prisma.productVariant.count(),
    ]);

    products = productList;
    stats = {
      productCount: productList.length,
      variantCount,
      onHandSum: variantAgg._sum.inventoryOnHand || 0,
      reservedSum: variantAgg._sum.inventoryReserved || 0,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
    };
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="mt-2 text-sm text-neutral-600">Signed in as {session.user?.email}</p>

      {isAdmin && (
        <section className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Inventory Dashboard</h2>
            <a href="/account/products/new" className="rounded bg-black px-4 py-2 text-white">Add Product</a>
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
              <StatCard label="Products" value={stats.productCount} />
              <StatCard label="Variants" value={stats.variantCount} />
              <StatCard label="On Hand" value={stats.onHandSum} />
              <StatCard label="Reserved" value={stats.reservedSum} />
              <StatCard label="Low Stock (≤5)" value={stats.lowStockCount} />
              <StatCard label="Out of Stock" value={stats.outOfStockCount} />
            </div>
          )}

          <div className="rounded-2xl border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 bg-neutral-50 p-3 text-xs font-semibold text-neutral-700">
              <div className="col-span-2">Image</div>
              <div className="col-span-3">Product</div>
              <div className="col-span-2">SKU</div>
              <div className="col-span-1 text-right">Price</div>
              <div className="col-span-2 text-right">On Hand</div>
              <div className="col-span-1 text-right">Reserved</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <ul className="divide-y">
              {products.map((p) => (
                p.variants.map((v: any) => (
                  <li key={v.id} className="grid grid-cols-12 items-center gap-4 p-3">
                    <div className="col-span-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0]?.url || ''}
                        alt={p.title}
                        className="h-12 w-12 rounded object-cover bg-neutral-100"
                      />
                    </div>
                    <div className="col-span-3 min-w-0">
                      <div className="truncate font-medium">{p.title}</div>
                      <div className="truncate text-xs text-neutral-500">/{p.slug}</div>
                    </div>
                    <div className="col-span-2 text-sm truncate">{v.sku}</div>
                    <div className="col-span-1 text-sm text-right">${(v.priceCents / 100).toFixed(2)}</div>
                    <div className="col-span-2 text-sm text-right">
                      <form action={`/api/admin/variants/${v.id}/inventory`} method="post" className="inline-flex items-center gap-2 justify-end">
                        <input
                          type="number"
                          name="inventoryOnHand"
                          min={0}
                          defaultValue={v.inventoryOnHand}
                          className="w-20 rounded border px-2 py-1 text-right"
                        />
                        <button className="rounded border px-2 py-1 text-xs">Save</button>
                      </form>
                    </div>
                    <div className="col-span-1 text-sm text-right">{v.inventoryReserved}</div>
                    <div className="col-span-1 flex justify-end gap-2">
                      <a href={`/account/products/${p.id}/edit`} className="rounded border px-2 py-1 text-xs">Edit</a>
                    </div>
                  </li>
                ))
              ))}
              {products.length === 0 && (
                <li className="p-6 text-sm text-neutral-600">No products yet.</li>
              )}
            </ul>
          </div>
        </section>
      )}

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
