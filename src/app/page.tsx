// app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";

type ProductWithRelations = Awaited<
  ReturnType<typeof prisma.product.findMany>
>[number];

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      images: { orderBy: { sort: "asc" }, take: 1 },
      variants: true,
      // add any category/collection relations you may have
    },
    orderBy: { createdAt: "desc" },
  });

  const heroImage = products[0]?.images?.[0]?.url;

  return (
    <main className="mx-auto max-w-7xl px-6">
      {/* Hero */}
      <section className="mt-10 grid gap-6 rounded-2xl border border-neutral-200 bg-white p-0 sm:gap-8 lg:grid-cols-2">
        <div className="flex items-center p-8 sm:p-12">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            All products
          </h1>
        </div>

        <div className="overflow-hidden rounded-r-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              heroImage ??
              "https://images.unsplash.com/photo-1542834369-f10ebf06d3cb?q=80&w=1600&auto=format&fit=crop"
            }
            alt="Featured products"
            className="h-full w-full max-h-[360px] object-cover"
          />
        </div>
      </section>

      {/* Content: Filters + Grid */}
      <section className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Sidebar Filters (static UI – wire-up later if you like) */}
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-700">
              FILTER BY
            </h2>
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Categories
                </p>
                <ul className="mt-3 space-y-3 text-sm">
                  {["Best Sellers", "Collagen", "Supplements", "Food", "Bars"].map(
                    (label) => (
                      <li key={label} className="flex items-center gap-3">
                        <input
                          id={label}
                          type="checkbox"
                          className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                        />
                        <label htmlFor={label} className="cursor-pointer">
                          {label}
                        </label>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="lg:col-span-9">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              {products.length} Products
            </p>
            {/* Sort placeholder */}
            <div className="text-sm text-neutral-500">
              Sort by: <span className="font-medium text-neutral-800">Newest</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p: ProductWithRelations) => {
              const image = p.images?.[0];
              const priceCents = p.variants?.[0]?.priceCents ?? 0;
              const price = (priceCents / 100).toFixed(2);

              return (
                <article
                  key={p.id}
                  className="group rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-300 hover:shadow-sm"
                >
                  <Link href={`/products/${p.slug}`} className="block">
                    <div className="relative overflow-hidden rounded-xl bg-neutral-50">
                      <div className="aspect-[4/3] w-full">
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
                    </div>

                    <div className="mt-4 px-1">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-base font-medium leading-tight">
                          {p.title}
                        </h3>
                        <span className="shrink-0 text-sm font-semibold">
                          ${price}
                        </span>
                      </div>
                      {p.brand && (
                        <p className="mt-1 text-sm text-neutral-500">{p.brand}</p>
                      )}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom padding like the reference page */}
      <div className="h-16" />
    </main>
  );
}
