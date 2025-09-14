import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getRedis } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  // Read the cart cookie and pull items from Redis
  const cartId = (await cookies()).get("cart_id")?.value;
  if (!cartId) return NextResponse.json({ items: [], total: 0 });

  const redis = await getRedis();
  const raw = (await redis.hgetall(`cart:${cartId}`)) || {};
  const variantIds = Object.keys(raw);
  if (variantIds.length === 0) return NextResponse.json({ items: [], total: 0 });

  // ProductVariant does not have images in the schema; images live on Product.
  // Include the parent product and its first image for display.
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: {
        include: { images: { orderBy: { sort: "asc" }, take: 1 } },
      },
    },
  });

  const items = variants.map((v) => {
    const qty = parseInt((raw as Record<string, string>)[v.id] || "0", 10);
    const line = v.priceCents * qty;
    // Build a human-friendly label from variant attributes if present
    let variantLabel: string | null = null;
    if (v.attributes && typeof v.attributes === "object") {
      try {
        const obj = v.attributes as Record<string, unknown>;
        const parts = Object.entries(obj)
          .filter(([_, val]) => val != null)
          .map(([k, val]) => `${k}: ${String(val)}`);
        variantLabel = parts.length ? parts.join(", ") : null;
      } catch (_) {
        variantLabel = null;
      }
    }

    const attrImg = Array.isArray((v as any)?.attributes?.images) && (v as any).attributes.images.length
      ? String((v as any).attributes.images[0])
      : null;
    return {
      id: v.id,
      title: v.product.title,
      sku: v.sku,
      priceCents: v.priceCents,
      qty,
      line,
      imageUrl: attrImg,
      variantLabel,
    };
  });

  const total = items.reduce((s, i) => s + i.line, 0);
  return NextResponse.json({ items, total });
}

export async function POST(req: Request) {
  // Accept form POSTs from product page or JSON payloads
  let variantId: string | undefined;
  let qty = 1;
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    variantId = body.variantId as string | undefined;
    qty = Number(body.qty ?? 1);
  } else {
    const fd = await req.formData();
    variantId = (fd.get("variantId") as string) || undefined;
    qty = Number((fd.get("qty") as string) || 1);
  }

  if (!variantId) {
    return NextResponse.json({ error: "Missing variantId" }, { status: 400 });
  }

  // Ensure cart cookie exists
  const c = cookies();
  let cartId = (await c).get("cart_id")?.value;
  if (!cartId) {
    cartId = crypto.randomUUID();
    (await c).set("cart_id", cartId, { httpOnly: true, sameSite: "lax", path: "/" });
  }

  // Update quantity in Redis hash
  const redis = await getRedis();
  const key = `cart:${cartId}`;
  const current = await redis.hget(key, variantId);
  const newQty = (current ? parseInt(current, 10) : 0) + (isNaN(qty) ? 1 : qty);
  await redis.hset(key, variantId, String(newQty));
  await redis.expire(key, 60 * 60 * 24 * 7);

  const res = NextResponse.json({ ok: true, cartId, variantId, qty: newQty });
  // Ensure cookie is set on response too (some runtimes require explicit set)
  res.cookies.set("cart_id", cartId, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
