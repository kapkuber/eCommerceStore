import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getRedis } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  const cartId = (await cookies()).get("cart_id")?.value;
  if (!cartId) return NextResponse.json({ items: [], total: 0 });

  const redis = await getRedis();
  const raw = (await redis.hgetall(`cart:${cartId}`)) || {};
  const variantIds = Object.keys(raw);
  if (variantIds.length === 0) return NextResponse.json({ items: [], total: 0 });

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: { include: { images: { orderBy: { sort: "asc" }, take: 1 } } },
    },
  });

  const items = variants.map((v) => {
    const qty = parseInt((raw as Record<string, string>)[v.id] || "0", 10);
    const line = v.priceCents * qty;
    return {
      id: v.id,
      title: v.product.title,
      sku: v.sku,
      priceCents: v.priceCents,
      qty,
      line,
      imageUrl: v.product.images?.[0]?.url ?? null,
      variantLabel: (() => {
        if (!v.attributes || typeof v.attributes !== "object") return null;
        try {
          const obj = v.attributes as Record<string, unknown>;
          const parts = Object.entries(obj)
            .filter(([_, val]) => val != null)
            .map(([k, val]) => `${k}: ${String(val)}`);
          return parts.length ? parts.join(", ") : null;
        } catch {
          return null;
        }
      })(),
    };
  });

  const total = items.reduce((s, i) => s + i.line, 0);
  return NextResponse.json({ items, total });
}

