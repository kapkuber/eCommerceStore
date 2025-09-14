import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let ids: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body.ids)) ids = body.ids.map((x: any) => String(x));
  } catch {}
  if (ids.length === 0) return NextResponse.json({ error: 'No ids' }, { status: 400 });
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
  try { revalidatePath('/account'); revalidatePath('/'); } catch {}
  return NextResponse.json({ ok: true, deleted: ids.length });
}

