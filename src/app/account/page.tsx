import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SignOutButton from './SignOutButton';
import AccountTopNav from './AccountTopNav';
import AddressCard from './AddressCard';
import EditAddressActions from './EditAddressActions';
import AddressCreateInline from './AddressCreateInline';
import BulkDeleteBar from './BulkDeleteBar';
import { prisma } from '@/lib/db';

// Ensure this page is always rendered fresh to avoid SSR/CSR mismatches
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const isAdmin = (session.user as any)?.role === 'ADMIN';
  const userId = (session.user as any)?.id as string | undefined;

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

  // Load user addresses and orders
  const [addresses, orders] = await Promise.all([
    prisma.address.findMany({ where: { userId: userId || undefined, type: 'SHIPPING' }, orderBy: { updatedAt: 'desc' } }),
    prisma.order.findMany({
      where: { userId: userId || undefined },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { variant: { include: { product: true } } } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-0 pb-16">
      {/* Full-bleed top nav spanning the entire viewport width */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <AccountTopNav isAdmin={isAdmin} />
      </div>

      {/* My Account */}
      <section id="my-account" className="px-6 pt-10">
        <h1 className="text-3xl font-extrabold tracking-tight">My Account</h1>
        <p className="mt-2 text-sm text-neutral-600">Signed in as {session.user?.email}</p>
      </section>

      {/* Shipping Addresses */}
      <section id="shipping-addresses" className="mt-12 px-6">
        <h2 className="text-3xl font-extrabold tracking-tight">Shipping Addresses</h2>
        {addresses.length === 0 ? (
          <>
            {/* Only show Add button when there is no address */}
            <EditAddressActions />
            <p className="mt-4 text-sm text-neutral-600">No saved addresses.</p>
            <AddressCreateInline />
          </>
        ) : (
          <div className="mt-4 grid gap-4 sm:max-w-lg">
            {addresses.map((a) => (
              <AddressCard key={a.id} address={{ id: a.id, line1: a.line1, line2: a.line2, city: a.city, region: a.region, postal: a.postal, country: a.country }} />
            ))}
          </div>
        )}
      </section>

      {/* Order History */}
      <section id="order-history" className="mt-12 px-6">
        <h2 className="text-3xl font-extrabold tracking-tight">Order History</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">You haven't placed any orders yet.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border">
            {orders.map((o) => (
              <li key={o.id} className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-semibold">Order #{o.id.slice(0,8)}</div>
                  <div className="text-neutral-600">${(o.totalCents/100).toFixed(2)}</div>
                </div>
                <div className="mt-1 text-xs text-neutral-600">{new Date(o.createdAt).toLocaleString()} — {o.status}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-700">
                  {o.items.map((it) => (
                    <span key={it.id} className="rounded border px-2 py-1">
                      {it.variant.product.title} × {it.qty}
                    </span>
                  ))}
                </div>
                <a href={`/orders/${o.id}`} className="mt-3 inline-block text-xs font-semibold underline">View details</a>
              </li>
            ))}
          </ul>
        )}
      </section>
      
      {isAdmin && (
        <section id="product-dashboard" className="mt-12 space-y-6 px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight">Inventory Dashboard</h2>
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
            {/* Bulk actions */}
            {products.length > 0 && <BulkDeleteBar containerId="product-list" />}
            <div className="grid grid-cols-12 gap-4 bg-neutral-50 p-3 text-xs font-semibold text-neutral-700">
              <div className="col-span-1 text-center">
                <input id="select-all" type="checkbox" className="h-4 w-4" />
              </div>
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-center">Variants</div>
              <div className="col-span-2 text-center">On Hand</div>
              <div className="col-span-1 text-center">Reserved</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
            <ul id="product-list" className="divide-y">
              {products.map((p) => {
                const vCount = p.variants.length;
                const onHandSum = p.variants.reduce((s: number, vv: any) => s + (vv.inventoryOnHand ?? 0), 0);
                const reservedSum = p.variants.reduce((s: number, vv: any) => s + (vv.inventoryReserved ?? 0), 0);
                return (
                  <li key={p.id} className="p-0">
                    <div className="grid grid-cols-12 items-center gap-4 p-3">
                      <div className="col-span-1 flex justify-center">
                        <input type="checkbox" name="ids" value={p.id} className="row-check h-4 w-4" />
                      </div>
                      <div className="col-span-5 min-w-0">
                        <a href={`/products/${p.slug}`} className="truncate font-medium hover:underline">{p.title}</a>
                        <div className="truncate text-xs text-neutral-500">/{p.slug}</div>
                      </div>
                      <div className="col-span-2 text-center text-sm">{vCount}</div>
                      <div className="col-span-2 text-center text-sm tabular-nums">{onHandSum}</div>
                      <div className="col-span-1 text-center text-sm tabular-nums">{reservedSum}</div>
                      <div className="col-span-1 flex flex-col items-center gap-2">
                      <a href={`/account/products/${p.id}/edit`} className="rounded border px-3 py-1 text-xs">Edit</a>
                      <a href={`/account/products/${p.id}/variants`} className="rounded border px-3 py-1 text-xs">Variants</a>
                    </div>
                    </div>
                    <details className="border-t bg-neutral-50/60">
                      <summary className="cursor-pointer list-none px-3 py-2 text-xs text-neutral-600">Show variants</summary>
                      <div className="p-3">
                        <div className="grid grid-cols-12 gap-3 bg-white p-2 text-xs font-semibold text-neutral-700">
                          <div className="col-span-4">SKU</div>
                          <div className="col-span-2 text-right">Price</div>
                          <div className="col-span-4 text-center">On Hand</div>
                          <div className="col-span-2 text-center">Reserved</div>
                        </div>
                        <ul className="divide-y">
                          {p.variants.map((v: any) => (
                            <li key={v.id} className="grid grid-cols-12 items-center gap-3 p-2">
                              <div className="col-span-4 truncate text-sm">{v.sku}</div>
                              <div className="col-span-2 text-right text-sm">${(v.priceCents/100).toFixed(2)}</div>
                              <div className="col-span-4 text-sm">
                                <form action={`/api/admin/variants/${v.id}/inventory`} method="post" className="mx-auto inline-flex items-center gap-2 justify-center">
                                  <input type="number" name="inventoryOnHand" min={0} defaultValue={v.inventoryOnHand} className="w-20 rounded border px-2 py-1 text-center" />
                                  <button className="rounded border px-3 py-1 text-xs">Save</button>
                                </form>
                              </div>
                              <div className="col-span-2 text-center text-sm tabular-nums">{v.inventoryReserved}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  </li>
                );
              })}
              {products.length === 0 && (
                <li className="p-6 text-sm text-neutral-600">No products yet.</li>
              )}
            </ul>
          </div>
        </section>
      )}
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
