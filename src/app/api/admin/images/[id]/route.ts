import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const img = await prisma.productImage.findUnique({ where: { id }, include: { product: true } });
    if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.productImage.delete({ where: { id } });

    try {
      if (img.product?.slug) revalidatePath(`/products/${img.product.slug}`);
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}

// Optional: allow POST fallback for browsers that can't send DELETE
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return DELETE(req, ctx as any);
}

