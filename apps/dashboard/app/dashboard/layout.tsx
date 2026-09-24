"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function onLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-[var(--ink-line)] px-6 py-4">
        <Link href="/dashboard" className="mono text-sm font-medium tracking-tight">
          rhm-base
        </Link>
        <button
          onClick={onLogout}
          className="text-sm text-[var(--paper-dim)] transition hover:text-[var(--paper)]"
        >
          Se déconnecter
        </button>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
