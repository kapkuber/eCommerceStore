import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const productId = String(form.get('productId') || '').trim();
  const file = form.get('file') as File | null;
  const imageUrl = (form.get('imageUrl') as string | null) || null;

  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  let url: string | null = null;
  if (imageUrl && imageUrl.startsWith('http')) {
    // accept a direct URL
    url = imageUrl;
  } else if (file) {
    const buf = Buffer.from(await file.arrayBuffer());
    const orig = (file as any).name || 'upload.bin';
    const ext = path.extname(orig).toLowerCase() || '.bin';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.bin';
    const name = `${randomUUID()}${safeExt}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    const dest = path.join(dir, name);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(dest, buf);
    url = `/uploads/${name}`;
  } else {
    return NextResponse.json({ error: 'Provide file or imageUrl' }, { status: 400 });
  }

  // Compute next sort
  const last = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { sort: 'desc' },
    select: { sort: true },
  });
  const nextSort = (last?.sort ?? 0) + 1;

  const created = await prisma.productImage.create({
    data: { productId, url: url!, alt: product.title, sort: nextSort },
  });

  try {
    revalidatePath(`/products/${product.slug}`);
  } catch {}

  const accept = req.headers.get('accept') || '';
  if (accept.includes('application/json')) {
    return NextResponse.json({ ok: true, image: created });
  }
  return NextResponse.redirect(new URL(`/products/${product.slug}`, req.url));
}
