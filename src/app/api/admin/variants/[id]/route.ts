import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const fd = await req.formData();
  const sku = String(fd.get('sku') ?? '').trim();
  const price = Number(fd.get('price') ?? 0);
  const inventoryOnHand = Number(fd.get('inventoryOnHand') ?? 0);
  const attributesRaw = fd.get('attributes');
  let attributes: any = undefined;
  if (attributesRaw != null && String(attributesRaw).length) {
    try { attributes = JSON.parse(String(attributesRaw)); } catch { attributes = null; }
  }
  const data: any = {};
  if (sku) data.sku = sku;
  if (price >= 0) data.priceCents = Math.round(price * 100);
  if (!Number.isNaN(inventoryOnHand) && inventoryOnHand >= 0) data.inventoryOnHand = inventoryOnHand;
  if (attributes !== undefined) data.attributes = attributes;
  try {
    const v = await prisma.productVariant.update({ where: { id }, data, include: { product: true } });
    try { revalidatePath('/account'); if (v.product?.slug) revalidatePath(`/products/${v.product.slug}`); } catch {}
    return NextResponse.redirect(new URL(`/account/products/${v.productId}/variants`, req.url));
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const v = await prisma.productVariant.delete({ where: { id }, include: { product: true } });
    try { revalidatePath('/account'); if (v.product?.slug) revalidatePath(`/products/${v.product.slug}`); } catch {}
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
  }
}

