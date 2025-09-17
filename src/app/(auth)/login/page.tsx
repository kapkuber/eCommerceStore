"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search?.get('callbackUrl') || '/account';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn('credentials', { redirect: false, email, password });
    if (res?.ok) {
      router.push(callbackUrl);
    } else {
      setError('Invalid email or password');
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 min-h-[75vh] grid place-items-center">
      <section className="w-full">
        <h1 className="mb-6 text-2xl font-semibold text-center justify-center">Login</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded bg-black px-4 py-2 text-white">Sign in</button>
        </form>
        <p className="mt-4 text-sm text-center">
          No account? <a className="underline" href="/register">Register</a>
        </p>
      </section>
    </main>
  );
}
