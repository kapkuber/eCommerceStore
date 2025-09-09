import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import CartTrigger from "./cart/CartTrigger"; // ⬅️ direct import

export const metadata: Metadata = {
  title: "eCommerce",
  description: "Demo ecommerce app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-white">
      <body className="min-h-full text-neutral-900 antialiased">
        <header className="sticky top-0 z-40 border-b bg-black text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <Link href="/" className="text-xl font-semibold tracking-tight">eCommerce</Link>
            <nav className="hidden gap-8 text-sm md:flex">
              <Link href="/" className="hover:opacity-80">Shop All</Link>
              <Link href="/" className="hover:opacity-80">Learn About Keto</Link>
              <Link href="/" className="hover:opacity-80">Keto Recipes</Link>
              <Link href="/" className="hover:opacity-80">Wholesale</Link>
            </nav>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:opacity-80">Search</Link>
              <Link href="/" className="hover:opacity-80">About</Link>
              <Link href="/" className="hover:opacity-80">Learn</Link>
              <Link href="/account" className="hover:opacity-80">Account</Link>
              <CartTrigger /> {/* client component */}
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
