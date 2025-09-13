// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import SearchTrigger from "./search/SearchTrigger";
import CartTrigger from "./cart/CartTrigger";

// icons for other nav items
import { Info, Lightbulb, User } from "lucide-react";

export const metadata: Metadata = {
  title: "eCommerce",
  description: "Demo ecommerce app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-white">
      <body className="min-h-full text-neutral-900 antialiased">
        <header className="sticky top-0 z-40 border-b bg-black text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              eCommerce
            </Link>

            <nav className="flex items-center gap-6 text-xs">
              {/* SearchTrigger renders just the word “Search” per your setup */}
              <SearchTrigger />

              {/* Icon above label links */}
              <NavIconLink href="/about" icon={Info} label="About" />
              <NavIconLink href="/learn" icon={Lightbulb} label="Learn" />
              <NavIconLink href="/account" icon={User} label="Account" />

              {/* CartTrigger now accepts className; it renders its own icon + label */}
              <CartTrigger className="group flex flex-col items-center gap-1 hover:opacity-90" />
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}

/* ---------- helper ---------- */
function NavIconLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-1 hover:opacity-90">
      <Icon className="h-6 w-6" />
      <span className="tracking-wide">{label.toUpperCase()}</span>
    </Link>
  );
}
