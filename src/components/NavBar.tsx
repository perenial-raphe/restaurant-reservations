"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();

  return (
    <header
      style={{
        borderBottom: "1px solid #eee",
        padding: "12px 16px",
        display: "flex",
        gap: 16,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <nav style={{ display: "flex", gap: 12 }}>
        <Link href="/">Home</Link>
        <Link href="/reserve">Reserve</Link>
        <Link href="/reservations">My Reservations</Link>
      </nav>
      <div>
        {status === "loading" ? null : session?.user ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ opacity: 0.7 }}>{session.user.email}</span>
            <button onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}