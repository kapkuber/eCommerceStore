import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="mt-2 text-sm text-neutral-600">Signed in as {session.user?.email}</p>
      <form action="/api/auth/signout" method="post" className="mt-6">
        <button className="rounded border px-4 py-2">Sign out</button>
      </form>
    </main>
  );
}

