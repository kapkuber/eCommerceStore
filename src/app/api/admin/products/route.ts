import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ct = req.headers.get('content-type') || '';
  let title = '', slug = '', description = '', brand = '', sku = '', imageUrl = '';
  let categoryIds: string[] = [];
  let price = 0;
  if (ct.includes('application/json')) {
    const body = await req.json();
    title = String(body.title || '').trim();
    slug = String(body.slug || '').trim();
    description = String(body.description || '').trim();
    brand = String(body.brand || '').trim();
    sku = String(body.sku || '').trim();
    imageUrl = String(body.imageUrl || '').trim();
    price = Number(body.price || 0);
    const cats = body.categoryIds || body.categories;
    if (Array.isArray(cats)) {
      categoryIds = cats.map((x: any) => String(x)).filter(Boolean);
    }
  } else {
    const fd = await req.formData();
    title = String(fd.get('title') || '').trim();
    slug = String(fd.get('slug') || '').trim();
    description = String(fd.get('description') || '').trim();
    brand = String(fd.get('brand') || '').trim();
    sku = String(fd.get('sku') || '').trim();
    // Prefer uploaded file; fallback to direct URL if provided
    const file = fd.get('image') as File | null;
    const directUrl = String(fd.get('imageUrl') || '').trim();
    if (file && typeof (file as any).arrayBuffer === 'function') {
      const buf = Buffer.from(await file.arrayBuffer());
      const orig = (file as any).name || 'upload.bin';
      const ext = path.extname(orig).toLowerCase() || '.bin';
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.bin';
      const name = `${randomUUID()}${safeExt}`;
      const dir = path.join(process.cwd(), 'public', 'uploads');
      const dest = path.join(dir, name);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(dest, buf);
      imageUrl = `/uploads/${name}`;
    } else {
      imageUrl = directUrl;
    }
    price = Number(String(fd.get('price') || 0));
    const cats = fd.getAll('categories');
    if (Array.isArray(cats)) categoryIds = cats.map((v) => String(v));
  }

  if (!title || !slug || !sku || !imageUrl || !(price >= 0)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const priceCents = Math.round(price * 100);
  try {
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description: description || null,
        brand: brand || null,
        active: true,
        images: { create: [{ url: imageUrl, alt: title, sort: 0 }] },
        variants: {
          create: [{ sku, priceCents, currency: 'usd', attributes: null, inventoryOnHand: 0 }],
        },
        categories: categoryIds.length
          ? { create: categoryIds.map((id) => ({ category: { connect: { id } } })) }
          : undefined,
      },
      include: { variants: true, images: true },
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
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
