import Link from 'next/link';
import { prisma } from '@/lib/db';

type ProductWithRelations = Awaited<
  ReturnType<typeof prisma.product.findMany>
>[number];

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      images: { orderBy: { sort: 'asc' }, take: 1 },
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Title */}
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">eCommerce</h1>
        <Link
          href="/cart"
          className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Cart
        </Link>
      </header>

      {/* Product grid */}
      <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p: ProductWithRelations) => {
          const image = p.images[0];
          const priceCents = p.variants[0]?.priceCents ?? 0;
          const price = (priceCents / 100).toFixed(2);

          return (
            <article
              key={p.id}
              className="group rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm"
            >
              <div className="overflow-hidden rounded-xl bg-neutral-50 aspect-[4/3]">
                {image?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={image.alt || p.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    No image
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-medium leading-tight">
                    <Link href={`/products/${p.slug}`} className="hover:underline">
                      {p.title}
                    </Link>
                  </h3>
                  <span className="shrink-0 text-sm font-semibold">${price}</span>
                </div>
                {p.brand && (
                  <p className="mt-1 text-sm text-neutral-500">{p.brand}</p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
