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
  // Editing at product-level now excludes variant price/SKU and images
  const categoryIds = fd.getAll('categories').map((v) => String(v));
  if (!title || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.product.update({
      where: { id },
      data: {
        title,
        slug,
        description: description || null,
        brand: brand || null,
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
      return NextResponse.json({ error: 'Duplicate slug' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
