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
          <button className="w-full rounded bg-black px-4 py-2 text-white cursor-pointer">Sign in</button>
        </form>
        <div className="my-4 flex items-center justify-center">
          <span className="h-px flex-1 bg-gray-300" />
          <span className="px-2 text-gray-500 text-sm">or</span>
          <span className="h-px flex-1 bg-gray-300" />
        </div>
        <button
          className="w-full flex items-center justify-center gap-2 rounded border border-gray-300 px-4 py-2 text-black bg-white hover:bg-gray-50"
          type="button"
          onClick={() => signIn('google', { callbackUrl })}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.704H24.48v9.02h13.02c-.528 2.84-2.12 5.24-4.52 6.86v5.68h7.32c4.28-3.94 6.73-9.74 6.73-16.856z" fill="#4285F4"/><path d="M24.48 48c6.12 0 11.26-2.04 15.01-5.54l-7.32-5.68c-2.04 1.36-4.66 2.18-7.69 2.18-5.91 0-10.92-3.99-12.72-9.36H4.23v5.86C7.97 43.98 15.62 48 24.48 48z" fill="#34A853"/><path d="M11.76 29.6A14.98 14.98 0 0 1 9.5 24c0-1.96.36-3.86 1.01-5.6v-5.86H4.23A23.98 23.98 0 0 0 0 24c0 3.98.96 7.76 2.66 11.06l9.1-5.46z" fill="#FBBC05"/><path d="M24.48 9.52c3.34 0 6.32 1.15 8.68 3.4l6.5-6.5C35.74 2.36 30.6 0 24.48 0 15.62 0 7.97 4.02 4.23 10.54l9.1 5.86c1.8-5.37 6.81-9.36 12.72-9.36z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><path fill="#fff" d="M0 0h48v48H0z"/></clipPath></defs></svg>
          Continue with Google
        </button>
        <p className="mt-4 text-sm text-center">
          No account? <a className="underline" href="/register">Register</a>
        </p>
      </section>
    </main>
  );
}
