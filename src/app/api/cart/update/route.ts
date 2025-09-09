// app/api/cart/update/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedis } from "@/lib/redis"; // ⬅️ use the getter, not the promise export

export async function POST(req: Request) {
  const { variantId, delta } = (await req.json()) as {
    variantId: string;
    delta: number;
  };

  if (!variantId || !Number.isFinite(delta)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cartId = cookieStore.get("cart_id")?.value;
  if (!cartId) {
    return NextResponse.json({ ok: true }); // nothing to update
  }

  const redis = await getRedis(); // ⬅️ resolve the client
  const key = `cart:${cartId}`;

  // Read current qty
  const current = Number((await redis.hget(key, variantId)) ?? "0");
  const next = current + delta;

  if (next <= 0) {
    // Prefer true delete when supported
    if (typeof (redis as any).hdel === "function") {
      await (redis as any).hdel(key, variantId);
    } else {
      // Fallback for MemoryRedis without hdel: set to "0"
      await redis.hset(key, variantId, "0");
    }
  } else {
    // ✅ Your MemoryRedis.hset is (key, field, value)
    await redis.hset(key, variantId, String(next));
  }

  return NextResponse.json({ ok: true });
}
