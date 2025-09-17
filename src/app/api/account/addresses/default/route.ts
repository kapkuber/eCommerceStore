import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as
      | { user?: { id?: string; email?: string } }
      | null;
    const userId = session?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({}, { status: 200 });

    const addr = await prisma.address.findFirst({
      where: { userId, type: 'SHIPPING' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, line1: true, line2: true, city: true, region: true, postal: true, country: true },
    });
    return NextResponse.json(addr || {});
  } catch (e: any) {
    return NextResponse.json({}, { status: 200 });
  }
}

