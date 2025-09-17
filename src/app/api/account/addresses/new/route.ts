import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as
      | { user?: { id?: string; email?: string; role?: string } }
      | null;
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const created = await prisma.address.create({
      data: { userId, type: 'SHIPPING', line1, line2, city, region, postal, country } as any,
      select: { id: true },
    });
    return NextResponse.json({ id: created.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Create failed' }, { status: 500 });
  }
}
