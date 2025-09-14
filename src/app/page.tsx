// app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// Use Prisma helper type to match the `include` below
type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { images: true; variants: true };
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { category?: string | string[] };
}) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const selectedSlug = Array.isArray(searchParams?.category)
    ? searchParams?.category[0]
    : searchParams?.category;

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(selectedSlug ? { categories: { some: { category: { slug: selectedSlug } } } } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    include: {
      images: { orderBy: { sort: "asc" }, take: 1 },
      variants: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const heroImage = products[0]?.images?.[0]?.url;

  return (
    <main className="mx-auto max-w-7xl px-6">
      {/* Hero */}
      <section className="mt-10 grid gap-6 rounded-2xl border border-neutral-200 bg-white p-0 sm:gap-8 lg:grid-cols-2">
        <div className="flex items-center p-8 sm:p-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
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
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                  <CategoryItem href="/" label="All" active={!selectedSlug} />
                  {categories.map((c) => (
                    <CategoryItem
                      key={c.id}
                      href={`/?category=${encodeURIComponent(c.slug)}`}
                      label={c.name}
                      active={selectedSlug === c.slug}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="lg:col-span-9">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              {products.length} Product{products.length === 1 ? "" : "s"}
              {selectedSlug && (
                <span className="ml-2 rounded-full border px-2 py-0.5 text-xs text-neutral-700">
                  in {categories.find((c) => c.slug === selectedSlug)?.name || selectedSlug}
                </span>
              )}
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

function CategoryItem({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition ${
        active ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <span>{label}</span>
      {active && <span className="text-xs text-neutral-600">Selected</span>}
    </Link>
  );
}
