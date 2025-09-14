import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if ((session.user as any)?.role !== 'ADMIN') redirect('/account');

  const { id } = await params;
  const [p, allCategories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sort: 'asc' }, take: 1 },
        variants: { take: 1 },
        categories: { include: { category: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!p) redirect('/account/products');

  const v = p.variants[0];
  const img = p.images[0];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Edit Product</h1>
      <form className="mt-6 grid gap-4" action={`/api/admin/products/${p.id}`} method="post">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input name="title" defaultValue={p.title} required className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input name="slug" defaultValue={p.slug} required className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Brand</label>
            <input name="brand" defaultValue={p.brand ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Price (USD)</label>
            <input name="price" type="number" step="0.01" min="0" defaultValue={(v?.priceCents ?? 0) / 100} required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">SKU</label>
            <input name="sku" defaultValue={v?.sku ?? ''} required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Image URL</label>
            <input name="imageUrl" defaultValue={img?.url ?? ''} required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea name="description" rows={4} defaultValue={p.description ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Categories</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {allCategories.map((c) => {
              const checked = p.categories.some((pc) => pc.categoryId === c.id);
              return (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="categories" value={c.id} defaultChecked={checked} />
                  <span>{c.name}</span>
                </label>
              );
            })}
            {allCategories.length === 0 && (
              <div className="text-sm text-neutral-500">No categories created.</div>
            )}
          </div>
        </div>
        <button className="rounded bg-black px-4 py-2 text-white">Save</button>
      </form>
    </main>
  );
}
