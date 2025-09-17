import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  let email = '';
  let name = '';
  let firstName = '';
  let lastName = '';
  let password = '';
  if (contentType.includes('application/json')) {
    const body = await req.json();
    email = String(body.email || '').toLowerCase();
    name = String(body.name || '');
    password = String(body.password || '');
  } else {
    const fd = await req.formData();
    email = String(fd.get('email') || '').toLowerCase();
    name = String(fd.get('name') || '');
    password = String(fd.get('password') || '');
  }

  // Basic validation to reduce unexpected inputs
  const emailOk = /.+@.+\..+/.test(email);
  const passOk = password.length >= 8 && password.length <= 256;
  if (!emailOk || !passOk) {
    return NextResponse.json({ error: 'Invalid email or password < 8 characters' }, { status: 400 });
  }

  // Split full name into first/last (simple fallback)
  if (name) {
    const parts = name.trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  try {
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, firstName: firstName || null, lastName: lastName || null, password: hashed } });
    return NextResponse.json({ id: user.id, email: user.email, name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() });
  } catch (err: any) {
    // Handle unique constraint race condition cleanly
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
