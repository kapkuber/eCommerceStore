"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      router.push('/login');
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Registration failed');
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 min-h-[75vh] grid place-items-center">
      <section className="w-full">
        <h1 className="mb-6 text-2xl font-semibold text-center">Create Account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
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
          <button className="w-full rounded bg-black px-4 py-2 text-white">Register</button>
        </form>
        <p className="mt-4 text-sm text-center">
          Already have an account? <a className="underline" href="/login">Login</a>
        </p>
      </section>
    </main>
  );
}
