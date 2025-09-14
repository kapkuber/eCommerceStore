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

  const { id } = await params;
  const fd = await req.formData();
  const title = String(fd.get('title') || '').trim();
  const slug = String(fd.get('slug') || '').trim();
  const description = String(fd.get('description') || '').trim();
  const brand = String(fd.get('brand') || '').trim();
  const sku = String(fd.get('sku') || '').trim();
  const imageUrl = String(fd.get('imageUrl') || '').trim();
  const price = Number(String(fd.get('price') || 0));
  const categoryIds = fd.getAll('categories').map((v) => String(v));

  if (!title || !slug || !sku || !imageUrl || !(price >= 0)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const priceCents = Math.round(price * 100);
  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sort: 'asc' }, take: 1 }, variants: { take: 1 } },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const variantId = existing.variants[0]?.id;
    const imageId = existing.images[0]?.id;

    await prisma.product.update({
      where: { id },
      data: {
        title,
        slug,
        description: description || null,
        brand: brand || null,
        images: imageId
          ? { update: { where: { id: imageId }, data: { url: imageUrl, alt: title } } }
          : { create: [{ url: imageUrl, alt: title, sort: 0 }] },
        variants: variantId
          ? { update: { where: { id: variantId }, data: { sku, priceCents, currency: 'usd' } } }
          : { create: [{ sku, priceCents, currency: 'usd', attributes: null, inventoryOnHand: 0 }] },
        // Replace category assignments with submitted ones
        categories: {
          deleteMany: {},
          create: categoryIds.map((cid) => ({ category: { connect: { id: cid } } })),
        },
      },
    });

    try {
      revalidatePath('/');
      revalidatePath('/account');
    } catch {}
    return NextResponse.redirect(new URL('/account', req.url));
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate slug or SKU' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
