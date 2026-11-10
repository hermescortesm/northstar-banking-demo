"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NAV_ITEMS, isActive } from "./nav-items";

function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-warning ${className}`}
    >
      Simulated demo — no real funds
    </span>
  );
}

function NavLinks({ variant }: { variant: "side" | "tab" }) {
  const pathname = usePathname();
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const base =
          variant === "side"
            ? "flex min-h-11 items-center rounded-control px-3 text-sm font-medium"
            : "flex min-h-14 flex-1 items-center justify-center text-sm font-medium";
        const color = active
          ? variant === "side"
            ? "bg-accent/10 text-accent"
            : "text-accent"
          : "text-muted hover:text-text";
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${base} ${color}`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:pl-60">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-surface p-4 md:flex">
        <Link href="/" className="mb-6 px-3 text-xl font-semibold tracking-tight text-accent">
          Northstar
        </Link>
        <nav aria-label="Primary" className="flex flex-col gap-1">
          <NavLinks variant="side" />
        </nav>
        <div className="mt-auto">
          <DemoBadge />
        </div>
      </aside>

      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
        <Link href="/" className="text-lg font-semibold tracking-tight text-accent">
          Northstar
        </Link>
        <DemoBadge className="text-[11px]" />
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
        {children}
      </main>

      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden"
      >
        <NavLinks variant="tab" />
      </nav>
    </div>
  );
}
