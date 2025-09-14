import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function ManageVariantsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if ((session.user as any)?.role !== 'ADMIN') redirect('/account');
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      images: { orderBy: { sort: 'asc' } },
    },
  });
  if (!product) redirect('/account');

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Manage Variants</h1>
      <p className="mt-1 text-sm text-neutral-600">{product.title}</p>

      <section className="mt-6 rounded-2xl border">
        <div className="border-b p-4 font-medium">Add Variant</div>
        <form className="grid gap-4 p-4" action={`/api/admin/products/${product.id}/variants`} method="post">
          <div className="grid gap-4 sm:grid-cols-4">
            <input name="sku" placeholder="SKU" required className="rounded border px-3 py-2" />
            <input name="price" placeholder="Price" type="number" step="0.01" min="0" required className="rounded border px-3 py-2" />
            <input name="inventoryOnHand" placeholder="On hand" type="number" min="0" className="rounded border px-3 py-2" />
            <input name="attributes" placeholder='Attributes JSON e.g. {"color":"Silver"}' className="rounded border px-3 py-2" />
          </div>
          <button className="w-fit rounded bg-black px-4 py-2 text-white">Create Variant</button>
        </form>
      </section>

      <section className="mt-8">
        <div className="rounded-2xl border">
          <div className="grid grid-cols-12 gap-4 bg-neutral-50 p-3 text-xs font-semibold text-neutral-700">
            <div className="col-span-3">SKU</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">On Hand</div>
            <div className="col-span-3">Attributes (JSON)</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <ul className="divide-y">
            {product.variants.map((v) => (
              <li key={v.id} className="grid grid-cols-12 items-start gap-4 p-3">
                <form action={`/api/admin/variants/${v.id}`} method="post" className="contents">
                  <div className="col-span-3"><input name="sku" defaultValue={v.sku} className="w-full rounded border px-3 py-2" /></div>
                  <div className="col-span-2"><input name="price" type="number" step="0.01" min="0" defaultValue={(v.priceCents/100).toFixed(2)} className="w-full rounded border px-3 py-2" /></div>
                  <div className="col-span-2"><input name="inventoryOnHand" type="number" min="0" defaultValue={v.inventoryOnHand ?? 0} className="w-full rounded border px-3 py-2" /></div>
                  <div className="col-span-3"><input name="attributes" defaultValue={v.attributes ? JSON.stringify(v.attributes) : ''} className="w-full rounded border px-3 py-2" /></div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button className="rounded border px-3 py-2 text-sm">Save</button>
                  </div>
                </form>

                <div className="col-span-12 mt-2 grid gap-2">
                  <div className="text-xs font-semibold text-neutral-600">Variant Images</div>
                  <div className="rounded-xl border p-3">
                    <div className="flex flex-wrap gap-3">
                      {Array.isArray((v as any).attributes?.images) && (v as any).attributes.images.length > 0 ? (
                        (v as any).attributes.images.map((url: string) => (
                          <form key={url} action={`/api/admin/variants/${v.id}/images`} method="post" className="relative">
                            <input type="hidden" name="_delete" value="1" />
                            <input type="hidden" name="url" value={url} />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="variant" className="h-20 w-20 rounded object-cover" />
                            <button className="absolute -right-2 -top-2 rounded-full bg-white/95 p-1 shadow" title="Delete image">×</button>
                          </form>
                        ))
                      ) : (
                        <div className="text-xs text-neutral-500">No images for this variant. Upload below.</div>
                      )}
                    </div>
                    <form action={`/api/admin/variants/${v.id}/images`} method="post" encType="multipart/form-data" className="mt-3 flex items-center gap-2">
                      <input name="image" type="file" accept="image/*" className="rounded border px-2 py-1" required />
                      <button className="rounded border px-3 py-1 text-sm">Upload</button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
            {product.variants.length === 0 && <li className="p-4 text-sm text-neutral-600">No variants yet.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}

function VariantImages({ variantId, images, productId }: { variantId: string; images: string[]; productId: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <form key={url} action={`/api/admin/variants/${variantId}/images`} method="post" className="relative">
            <input type="hidden" name="url" value={url} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="variant" className="h-20 w-20 rounded object-cover" />
            <button
              formAction={``}
              onClick={(e) => { e.preventDefault(); fetch(`/api/admin/variants/${variantId}/images`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) }).then(() => location.reload()); }}
              className="absolute -right-2 -top-2 rounded-full bg-white/95 p-1 shadow"
              title="Delete image"
            >
              ×
            </button>
          </form>
        ))}
        {images.length === 0 && <div className="text-xs text-neutral-500">No images for this variant. Upload below.</div>}
      </div>
      <form action={`/api/admin/variants/${variantId}/images`} method="post" encType="multipart/form-data" className="mt-3 flex items-center gap-2">
        <input name="image" type="file" accept="image/*" className="rounded border px-2 py-1" required />
        <button className="rounded border px-3 py-1 text-sm">Upload</button>
      </form>
    </div>
  );
}
