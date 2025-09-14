import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if ((session.user as any)?.role !== 'ADMIN') redirect('/account');

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Add Product</h1>
      <p className="mt-1 text-sm text-neutral-600">Create a new product with one image and one variant.</p>

      <form
        className="mt-6 grid gap-4"
        action="/api/admin/products"
        method="post"
      >
        <div>
          <label className="block text-sm font-medium">Product Name</label>
          <input name="title" required className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input name="slug" required className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Brand</label>
            <input name="brand" className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Price (USD)</label>
            <input name="price" type="number" step="0.01" min="0" required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">SKU</label>
            <input name="sku" required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Image URL</label>
            <input name="imageUrl" required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea name="description" rows={4} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Categories</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="categories" value={c.id} />
                <span>{c.name}</span>
              </label>
            ))}
            {categories.length === 0 && (
              <div className="text-sm text-neutral-500">No categories created.</div>
            )}
          </div>
        </div>
        <button className="rounded bg-black px-4 py-2 text-white">Create</button>
      </form>
    </main>
  );
}
