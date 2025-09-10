"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      className="rounded border px-4 py-2"
      onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
    >
      Sign out
    </button>
  );
}

