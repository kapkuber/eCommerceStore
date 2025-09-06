import { NextResponse } from 'next/server';
import { addToCart } from '@/lib/cart';

export async function POST(req: Request) {
  const form = await req.formData();
  const variantId = String(form.get('variantId') || '');
  if (!variantId) return NextResponse.json({ error: 'variantId required' }, { status: 400 });

  await addToCart(variantId, 1);
  return NextResponse.redirect(new URL('/cart', req.url)); // simple redirect for now
}
