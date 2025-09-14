import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const fd = await req.formData();
  // If a delete intent is posted via form (_delete flag), handle deletion here to support HTML-only forms
  const del = fd.get('_delete') || fd.get('delete');
  const delUrl = String(fd.get('url') || '').trim();
  if (del && delUrl) {
    const v = await prisma.productVariant.findUnique({ where: { id }, include: { product: true } });
    if (!v) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    let attrs: any = v.attributes || {};
    if (typeof attrs !== 'object' || attrs == null) attrs = {};
    const images: string[] = Array.isArray((attrs as any).images) ? (attrs as any).images : [];
    attrs.images = images.filter((u) => u !== delUrl);
    await prisma.productVariant.update({ where: { id }, data: { attributes: attrs } });
    try { if (v.product?.slug) revalidatePath(`/products/${v.product.slug}`); } catch {}
    return NextResponse.redirect(new URL(`/account/products/${v.productId}/variants`, req.url));
  }

  const file = fd.get('image') as File | null;
  const directUrl = String(fd.get('imageUrl') || '').trim();

  let url: string | null = null;
  if (file && typeof (file as any).arrayBuffer === 'function') {
    const buf = Buffer.from(await file.arrayBuffer());
    const orig = (file as any).name || 'upload.bin';
    const ext = path.extname(orig).toLowerCase() || '.bin';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.bin';
    const name = `${randomUUID()}${safeExt}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), buf);
    url = `/uploads/${name}`;
  } else if (directUrl) {
    url = directUrl;
  }
  if (!url) return NextResponse.json({ error: 'No image' }, { status: 400 });

  // Append to attributes.images array
  const v = await prisma.productVariant.findUnique({ where: { id }, include: { product: true } });
  if (!v) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let attrs: any = v.attributes || {};
  if (typeof attrs !== 'object' || attrs == null) attrs = {};
  const images: string[] = Array.isArray((attrs as any).images) ? (attrs as any).images : [];
  images.push(url);
  attrs.images = images;
  await prisma.productVariant.update({ where: { id }, data: { attributes: attrs } });
  try { if (v.product?.slug) revalidatePath(`/products/${v.product.slug}`); } catch {}
  return NextResponse.redirect(new URL(`/account/products/${v.productId}/variants`, req.url));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '').trim();
    const v = await prisma.productVariant.findUnique({ where: { id }, include: { product: true } });
    if (!v) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    let attrs: any = v.attributes || {};
    if (typeof attrs !== 'object' || attrs == null) attrs = {};
    const images: string[] = Array.isArray((attrs as any).images) ? (attrs as any).images : [];
    const next = images.filter((u) => u !== url);
    attrs.images = next;
    await prisma.productVariant.update({ where: { id }, data: { attributes: attrs } });
    try { if (v.product?.slug) revalidatePath(`/products/${v.product.slug}`); } catch {}
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
