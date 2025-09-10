import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SignOutButton from './SignOutButton';
import { prisma } from '@/lib/db';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const isAdmin = (session.user as any)?.role === 'ADMIN';

  // If admin, load products to show the management dashboard inline
  const products = isAdmin
    ? await prisma.product.findMany({
        include: {
          images: { orderBy: { sort: 'asc' }, take: 1 },
          variants: { take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="mt-2 text-sm text-neutral-600">Signed in as {session.user?.email}</p>

      {isAdmin && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Products</h2>
            <a href="/account/products/new" className="rounded bg-black px-4 py-2 text-white">Add Product</a>
          </div>
          <ul className="mt-4 divide-y rounded-2xl border">
            {products.map((p) => (
              <li key={p.id} className="grid grid-cols-12 items-center gap-4 p-4">
                <div className="col-span-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0]?.url || ''}
                    alt={p.title}
                    className="h-16 w-16 rounded object-cover bg-neutral-100"
                  />
                </div>
                <div className="col-span-5 min-w-0">
                  <div className="truncate font-medium">{p.title}</div>
                  <div className="truncate text-xs text-neutral-500">/{p.slug}</div>
                </div>
                <div className="col-span-2 text-sm">
                  ${((p.variants[0]?.priceCents ?? 0) / 100).toFixed(2)}
                </div>
                <div className="col-span-3 flex justify-end gap-3">
                  <a href={`/account/products/${p.id}/edit`} className="rounded border px-3 py-1 text-sm">
                    Edit
                  </a>
                  <form action={`/api/admin/products/${p.id}/delete`} method="post">
                    <button className="rounded border px-3 py-1 text-sm text-red-600">Delete</button>
                  </form>
                </div>
              </li>
            ))}
            {products.length === 0 && (
              <li className="p-6 text-sm text-neutral-600">No products yet.</li>
            )}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}
