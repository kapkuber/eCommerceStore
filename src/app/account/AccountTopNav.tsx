"use client";

import { signOut } from "next-auth/react";

export default function AccountTopNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const items: Array<{ label: string; href?: string; onClick?: () => void }>= [
    { label: "MY ACCOUNT", href: "#my-account" },
    { label: "ORDER HISTORY", href: "#order-history" },
    { label: "SHIPPING ADDRESSES", href: "#shipping-addresses" },
  ];
  if (isAdmin) items.push({ label: "PRODUCT DASHBOARD", href: "#product-dashboard" });
  items.push({ label: "SIGN OUT", onClick: () => signOut({ callbackUrl: "/login", redirect: true }) });

  return (
    <nav className="sticky top-0 z-30 w-full border-b bg-[#7b8e71] py-9 text-white">
      <ul className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 text-xs font-extrabold tracking-wide">
        {items.map((it) => (
          <li key={it.label}>
            {it.href ? (
              <a href={it.href} className="opacity-80 hover:opacity-100">
                {it.label}
              </a>
            ) : (
              <button onClick={it.onClick} className="opacity-80 hover:opacity-100">
                {it.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

