import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome</h1>
      <p>Explore the catalog:</p>
      <div className="mt-4 space-x-4">
        <Link className="underline" href="/products">Products</Link>
        <Link className="underline" href="/cart">Cart</Link>
      </div>
    </main>
  );
}

