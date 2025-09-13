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

  // Accept JSON or FormData
  const ct = req.headers.get('content-type') || '';
  let inventoryOnHandRaw: string | number | null = null;
  if (ct.includes('application/json')) {
    const body = await req.json();
    inventoryOnHandRaw = body.inventoryOnHand ?? null;
  } else {
    const fd = await req.formData();
    inventoryOnHandRaw = (fd.get('inventoryOnHand') as string) ?? null;
  }

  if (inventoryOnHandRaw == null) {
    return NextResponse.json({ error: 'Missing inventoryOnHand' }, { status: 400 });
  }

  const parsed = Number(inventoryOnHandRaw);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return NextResponse.json({ error: 'inventoryOnHand must be a non-negative integer' }, { status: 400 });
  }

  try {
    const variant = await prisma.productVariant.update({
      where: { id },
      data: { inventoryOnHand: parsed },
      include: { product: true },
    });

    try {
      revalidatePath('/account');
      if (variant.product?.slug) {
        revalidatePath(`/products/${variant.product.slug}`);
      }
    } catch {}

    const accept = req.headers.get('accept') || '';
    if (accept.includes('application/json') || ct.includes('application/json')) {
      return NextResponse.json({ ok: true, variantId: variant.id, inventoryOnHand: variant.inventoryOnHand });
    }
    // Fallback: redirect back to account page for form submissions
    return NextResponse.redirect(new URL('/account', req.url));
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

