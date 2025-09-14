// app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import SortMenu from "./SortMenu";
import QuickBuy from "./QuickBuy";

// Use Prisma helper type to match the `include` below
type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { images: true; variants: true };
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; sort?: string | string[] }>;
}) {
  const sp = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const selectedSlug = Array.isArray(sp?.category) ? sp?.category[0] : sp?.category;
  const selectedName = selectedSlug
    ? categories.find((c) => c.slug === selectedSlug)?.name || selectedSlug
    : null;

  const sortParam = (Array.isArray(sp?.sort) ? sp?.sort[0] : sp?.sort || "newest") as
    | "newest"
    | "oldest"
    | "price_desc"
    | "price_asc";

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(selectedSlug ? { categories: { some: { category: { slug: selectedSlug } } } } : {}),
  };

  // Compute orderBy based on sort param
  const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
    switch (sortParam) {
      case "oldest":
        return { createdAt: "asc" };
      case "newest":
      default:
        return { createdAt: "desc" };
    }
  })();

  const products = await prisma.product.findMany({
    where,
    include: {
      images: { orderBy: { sort: "asc" }, take: 1 },
      variants: true,
    },
    orderBy,
  });

  // Apply price-based sorts in application code (Prisma orderBy on relation min/max isn't supported)
  const renderedProducts = (() => {
    if (sortParam === "price_desc" || sortParam === "price_asc") {
      const priceOf = (p: ProductWithRelations) => {
        const prices = (p.variants || []).map((v) => v.priceCents ?? 0);
        if (prices.length === 0) return 0;
        return Math.min(...prices);
      };
      const sorted = [...products].sort((a, b) => priceOf(a) - priceOf(b));
      return sortParam === "price_desc" ? sorted.reverse() : sorted;
    }
    return products;
  })();

  // Use first variant's first variant-specific image (attributes.images[0]) for hero
  const heroImage = (() => {
    const p = products[0];
    if (!p) return null as string | null;
    const v = p.variants?.[0] as any;
    const imgs = v?.attributes?.images as unknown;
    if (Array.isArray(imgs) && imgs.length) return String(imgs[0]);
    return null as string | null;
  })();

  return (
    <main className="mx-auto max-w-7xl px-6">
      {/* Hero */}
      <section className="mt-10 grid gap-6 rounded-2xl border border-neutral-200 bg-white p-0 sm:gap-8 lg:grid-cols-2">
        <div className="flex items-center p-8 sm:p-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {selectedName ?? 'All Products'}
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
              {renderedProducts.length} Product{renderedProducts.length === 1 ? "" : "s"}
              {selectedSlug && (
                <span className="ml-2 rounded-full border px-2 py-0.5 text-xs text-neutral-700">
                  in {categories.find((c) => c.slug === selectedSlug)?.name || selectedSlug}
                </span>
              )}
            </p>
            {/* Sort dropdown */}
            <SortMenu current={sortParam} category={selectedSlug || null} />
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {renderedProducts.map((p: ProductWithRelations) => {
              // Prefer first variant's variant-specific image
              const firstVariant: any = p.variants?.[0];
              const varImgs = (firstVariant?.attributes?.images as unknown);
              const variantImageUrl = Array.isArray(varImgs) && varImgs.length ? String(varImgs[0]) : null;
              const priceCents = p.variants?.[0]?.priceCents ?? 0;
              const price = (priceCents / 100).toFixed(2);

              return (
                <article
                  key={p.id}
                  className="group rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-300 hover:shadow-sm overflow-visible"
                >
                  <Link href={`/products/${p.slug}`} className="block">
                    <div className="relative overflow-hidden rounded-xl bg-neutral-50">
                      <div className="aspect-[4/3] w-full">
                        {variantImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={variantImageUrl}
                            alt={p.title}
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
                        <span className="shrink-0 text-base font-bold">
                          ${price}
                        </span>
                      </div>
                      {p.brand && (
                        <p className="mt-1 text-sm text-neutral-500">{p.brand}</p>
                      )}
                    </div>
                  </Link>
                  <QuickBuy variants={p.variants as any} />
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
