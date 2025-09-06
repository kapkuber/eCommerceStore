import { prisma } from '@/lib/db';

export default async function ProductPage({ params }: { params: { slug: string }}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { variants: true, images: { orderBy: { sort: 'asc' } } }
  });
  if (!product) return <div className="p-6">Not found</div>;

  return (
    <main className="container mx-auto p-6 grid lg:grid-cols-2 gap-8">
      <div>
        <img className="w-full rounded-2xl aspect-video object-cover" src={product.images[0]?.url || ''} alt={product.images[0]?.alt || product.title}/>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <p className="text-muted-foreground">{product.brand}</p>
        <p className="my-3">{product.description}</p>
        <form action="/api/cart/add" method="post" className="space-y-3">
          <input type="hidden" name="variantId" value={product.variants[0]?.id}/>
          <button className="px-4 py-2 rounded-xl border">Add to cart</button>
        </form>
      </div>
    </main>
  );
}
