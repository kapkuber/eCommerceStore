import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProductClient from "./ProductClient";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;

  const [session, product] = await Promise.all([
    getServerSession(authOptions),
    prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        images: { orderBy: { sort: "asc" } },
      },
    }),
  ]);

  if (!product) {
    return <main className="p-6">Not found</main>;
  }

  const isAdmin = !!session && (session.user as any)?.role === "ADMIN";

  return (
    <ProductClient
      productId={product.id}
      title={product.title}
      brand={product.brand}
      description={product.description}
      variants={product.variants}
      images={product.images}
      isAdmin={isAdmin}
    />
  );
}
