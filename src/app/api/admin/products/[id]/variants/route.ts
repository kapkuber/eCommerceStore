import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: productId } = await params;

  const ct = req.headers.get('content-type') || '';
  let sku = '', price = 0, inventoryOnHand = 0, attributes: any = null;
  if (ct.includes('application/json')) {
    const body = await req.json();
    sku = String(body.sku || '').trim();
    price = Number(body.price ?? 0);
    inventoryOnHand = Number(body.inventoryOnHand ?? 0);
    attributes = body.attributes ?? null;
  } else {
    const fd = await req.formData();
    sku = String(fd.get('sku') || '').trim();
    price = Number(fd.get('price') ?? 0);
    inventoryOnHand = Number(fd.get('inventoryOnHand') ?? 0);
    const attr = fd.get('attributes');
    if (attr) {
      try { attributes = JSON.parse(String(attr)); } catch { attributes = null; }
    }
  }
  if (!sku || !(price >= 0)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const priceCents = Math.round(price * 100);
  try {
    await prisma.productVariant.create({ data: { productId, sku, priceCents, currency: 'usd', attributes, inventoryOnHand } });
    try { revalidatePath('/account'); } catch {}
    return NextResponse.redirect(new URL(`/account/products/${productId}/variants`, req.url));
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Duplicate SKU' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
  }
}

