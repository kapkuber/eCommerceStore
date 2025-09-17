import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions as any)) as
      | { user?: { id?: string; email?: string; role?: string } }
      | null;
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const line1 = String(body.line1 || '').trim();
    const line2 = body.line2 != null ? String(body.line2).trim() : null;
    const city = String(body.city || '').trim();
    const region = body.region != null ? String(body.region).trim() : null;
    const postal = String(body.postal || '').trim();
    const country = String(body.country || 'US').trim();

    if (!line1 || !city || !postal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure address belongs to requesting user (or user is admin)
    const userId = session.user?.id as string | undefined;
    const isAdmin = session.user?.role === 'ADMIN';
    if (!userId && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addr = await prisma.address.findUnique({ where: { id } });
    if (!addr) return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    if (!isAdmin && addr.userId && addr.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.address.update({
      where: { id },
      // any casts to allow compile even if Prisma client types lag behind
      data: { line1, line2, city, region, postal, country } as any,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 500 });
  }
}
