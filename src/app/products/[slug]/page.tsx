import { prisma } from '@/lib/db';
import AddToCartButton from '@/app/products/AddToCartButton';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true, images: { orderBy: { sort: 'asc' } } },
  });

  if (!product) {
    return <main className="p-6">Not found</main>;
  }

  return (
    <main className="container mx-auto p-6 grid lg:grid-cols-2 gap-8">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full rounded-2xl aspect-video object-cover"
          src={product.images[0]?.url || ''}
          alt={product.images[0]?.alt || product.title}
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <p className="text-neutral-500">{product.brand}</p>
        <p className="my-3 text-sm">{product.description}</p>
        <div className="space-y-3">
          <AddToCartButton variantId={product.variants[0]?.id} />
        </div>
      </div>
    </main>
  );
}

