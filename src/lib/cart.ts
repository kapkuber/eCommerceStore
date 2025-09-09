import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getRedis } from './redis';

const CART_COOKIE = 'cart_id';

export async function getCartId() {
  const c = cookies();
  let id = (await c).get(CART_COOKIE)?.value;
  if (!id) {
    id = randomUUID();
    (await c).set(CART_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/' });
  }
  return id;
}

export async function addToCart(variantId: string, qty = 1) {
  const id = await getCartId();
  // store as hash: cart:{id} -> { variantId: qty }
  const key = `cart:${id}`;
  const redis = await getRedis();
  const v = await redis.hget(key, variantId);
  const newQty = (v ? parseInt(v, 10) : 0) + qty;
  await redis.hset(key, variantId, newQty.toString());
  await redis.expire(key, 60 * 60 * 24 * 7); // 7 days
}
