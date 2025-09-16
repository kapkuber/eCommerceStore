// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { getRedis } from "@/lib/redis";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as
    | { user?: { id?: string } }
    | null;

  const fd = await req.formData();

  // Accept both your names and the ones the CheckoutClient sends
  const name =
    (fd.get("name") as string) ||
    (fd.get("shipping_name") as string) ||
    "";
  const email =
    (fd.get("email") as string) ||
    (fd.get("customer_email") as string) ||
    "";
  const line1 =
    (fd.get("line1") as string) ||
    (fd.get("shipping_address1") as string) ||
    "";
  const line2 =
    (fd.get("line2") as string) ||
    (fd.get("shipping_address2") as string) ||
    "";
  const city =
    (fd.get("city") as string) ||
    (fd.get("shipping_city") as string) ||
    "";
  const state =
    (fd.get("state") as string) ||
    (fd.get("shipping_state") as string) ||
    "";
  const postal =
    (fd.get("postal") as string) ||
    (fd.get("shipping_zip") as string) ||
    "";
  const country =
    (fd.get("country") as string) ||
    (fd.get("shipping_country") as string) ||
    "";

  // Pull cart
  const c = await cookies();
  const cartId = c.get("cart_id")?.value || null;
  if (!cartId) {
    return NextResponse.json({ url: "/checkout" }, { status: 200 });
  }

  const redis = await getRedis();
  const raw = (await redis.hgetall(`cart:${cartId}`)) || ({} as Record<string, string>);
  const variantIds = Object.keys(raw);
  if (variantIds.length === 0) {
    return NextResponse.json({ url: "/checkout" }, { status: 200 });
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
  });

  const items = variants
    .map((v) => ({
      variantId: v.id,
      unitPriceCents: v.priceCents,
      qty: Math.max(0, parseInt(raw[v.id] || "0", 10)) || 0,
    }))
    .filter((x) => x.qty > 0);

  const total = items.reduce((s, it) => s + it.unitPriceCents * it.qty, 0);

  // Resolve a userId: prefer session; otherwise create/find by email
  let userId: string | null = session?.user?.id ?? null;
  if (!userId && email && /.+@.+\..+/.test(email)) {
    const u = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined },
      create: { email, name: name || null },
      select: { id: true },
    });
    userId = u.id;
  }

  // Minimal order creation
  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      totalCents: total,
      currency: "usd",
      items: {
        create: items.map((it) => ({
          variantId: it.variantId,
          unitPriceCents: it.unitPriceCents,
          qty: it.qty,
        })),
      },
    },
  });

  // Reserve inventory (best effort)
  await Promise.all(
    items.map((it) =>
      prisma.productVariant.update({
        where: { id: it.variantId },
        data: { inventoryReserved: { increment: it.qty } },
      })
    )
  );

  // Clear cart
  for (const id of variantIds) {
    if (typeof (redis as any).hdel === "function") {
      await (redis as any).hdel(`cart:${cartId}`, id);
    } else {
      await redis.hset(`cart:${cartId}`, id, "0");
    }
  }

  try {
    revalidatePath("/account");
  } catch {}

  // Return JSON so the CheckoutClient can navigate
  return NextResponse.json({ url: "/account", orderId: order.id });
}
