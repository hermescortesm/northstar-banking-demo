"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./icons";
import { NAV_ITEMS, isActive } from "./nav-items";

const BADGE_TEXT = "Simulated demo — no real funds";

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-7 flex-none place-items-center rounded-lg text-white"
      style={{ background: "linear-gradient(145deg,#1FD39C,#07805C)" }}
    >
      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
        <path d="M12 1.5l2.4 8.1 8.1 2.4-8.1 2.4L12 22.5l-2.4-8.1L1.5 12l8.1-2.4z" />
      </svg>
    </span>
  );
}

const ghostIconBtn =
  "size-9 flex-none items-center justify-center cursor-pointer rounded-full border border-transparent bg-transparent text-text-2 hover:bg-hover hover:text-text";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const lbl = collapsed ? `hidden max-[980px]:inline` : "";

  return (
    <div className="flex min-h-screen items-start bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-text focus:px-4 focus:py-2 focus:text-surface"
      >
        Skip to main content
      </a>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[45] cursor-pointer border-0 bg-scrim"
        />
      )}

      <aside
        id="sidebar"
        aria-label="Primary"
        className={[
          "sticky top-0 z-50 flex h-screen flex-none flex-col gap-1.5 overflow-y-auto overflow-x-hidden bg-bg px-2.5 py-3.5 transition-[width,transform] duration-200",
          collapsed ? "w-[76px]" : "w-64",
          `max-[980px]:fixed max-[980px]:inset-y-0 max-[980px]:left-0 max-[980px]:!w-[284px] max-[980px]:h-auto`,
          mobileOpen
            ? `max-[980px]:visible max-[980px]:translate-x-0 max-[980px]:shadow-lg`
            : `max-[980px]:invisible max-[980px]:-translate-x-full`,
        ].join(" ")}
      >
        <div
          className={`flex items-center gap-2 px-1.5 pb-2.5 pt-0.5 ${
            collapsed ? `justify-center max-[980px]:justify-between` : "justify-between"
          }`}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] !text-text"
          >
            <LogoMark />
            <span className={lbl}>Northstar</span>
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
            className={`${ghostIconBtn} ${collapsed ? "hidden" : "inline-flex"} max-[980px]:hidden`}
          >
            <Icon name="panel" size={16} />
          </button>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className={`${ghostIconBtn} hidden max-[980px]:inline-flex max-[980px]:size-11`}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        {collapsed && (
          <button
            type="button"
            aria-label="Expand sidebar"
            aria-expanded={false}
            onClick={() => setCollapsed(false)}
            className={`${ghostIconBtn} inline-flex size-11 self-center max-[980px]:hidden`}
          >
            <Icon name="panel" size={16} />
          </button>
        )}

        <div className="flex items-center gap-2.5 p-2">
          <span
            aria-hidden="true"
            className="grid size-[30px] flex-none place-items-center rounded-lg bg-[#E1E4E9] text-xs font-semibold text-[#2B3240]"
          >
            FR
          </span>
          <span className={`flex min-w-0 flex-1 flex-col ${lbl ? `hidden max-[980px]:flex` : ""}`}>
            <strong className="truncate text-[13px] font-semibold">Fernhill Robotics, Inc.</strong>
            <span className="text-xs text-text-3">Business · 3 accounts</span>
          </span>
        </div>

        <nav aria-label="Main" className="mt-2.5 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={[
                  "flex h-9 items-center gap-3 whitespace-nowrap rounded-[9px] px-3 font-medium transition-colors",
                  `max-[980px]:h-11`,
                  collapsed ? `justify-center px-0 max-[980px]:justify-start max-[980px]:px-3` : "",
                  active
                    ? "bg-surface !text-text shadow-[0_1px_2px_rgba(10,12,16,.06),0_0_0_1px_var(--border)]"
                    : "!text-text-2 hover:bg-hover hover:!text-text",
                ].join(" ")}
              >
                <Icon name={item.icon} />
                <span className={lbl}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2.5">
          <div
            className={`gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-text-2 ${
              collapsed ? `hidden max-[980px]:flex` : "flex"
            } items-start`}
          >
            <span className="mt-px text-warn">
              <Icon name="info" size={16} />
            </span>
            <span>Demo with fictional data. Transfers are simulated — no real money moves.</span>
          </div>
          <div className="flex items-center gap-2.5 p-1.5">
            <span
              aria-hidden="true"
              className="grid size-8 flex-none place-items-center rounded-full bg-accent text-xs font-semibold text-white"
            >
              AB
            </span>
            <span className={`flex min-w-0 flex-1 flex-col ${lbl ? `hidden max-[980px]:flex` : ""}`}>
              <strong className="truncate text-[13px] font-semibold">Avery Brooks</strong>
              <span className="text-xs text-text-3">Founder &amp; CEO</span>
            </span>
          </div>
        </div>
      </aside>

      <div
        className={`m-2 ml-0 flex min-h-[calc(100vh-16px)] min-w-0 flex-[999_1_560px] flex-col rounded-panel border border-border bg-surface shadow-[0_1px_3px_rgba(10,12,16,.04)] max-[980px]:m-0 max-[980px]:min-h-screen max-[980px]:rounded-none max-[980px]:border-0`}
      >
        <div className="sticky top-0 z-40 rounded-t-panel border-b border-border bg-surface">
          <header className={`flex items-center gap-2.5 px-7 py-3 max-[980px]:px-4 max-[980px]:py-2.5`}>
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="sidebar"
              onClick={() => setMobileOpen(true)}
              className={`${ghostIconBtn} hidden max-[980px]:inline-flex max-[980px]:size-11`}
            >
              <Icon name="menu" />
            </button>
            <form
              role="search"
              className="relative min-w-0 max-w-[460px] flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                const q = query.trim();
                router.push(q ? `/transactions?q=${encodeURIComponent(q)}` : "/transactions");
              }}
            >
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3">
                <Icon name="search" size={16} />
              </span>
              <label htmlFor="gsearch" className="sr-only">
                Search transactions
              </label>
              <input
                id="gsearch"
                type="search"
                autoComplete="off"
                placeholder="Search transactions"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-full border border-border bg-surface-2 pl-[38px] pr-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)] min-[721px]:h-[38px] min-[721px]:pr-14"
              />
              <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-full border border-border bg-surface px-[7px] py-0.5 text-[11px] font-medium text-text-3 min-[721px]:block">
                Enter
              </kbd>
            </form>
            <div className="flex-1" />
            <span
              className={`inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-warn/20 bg-warn-soft px-2.5 text-xs font-semibold text-warn max-[980px]:hidden`}
            >
              <Icon name="info" size={14} />
              {BADGE_TEXT}
            </span>
            <Link
              href="/transfers"
              aria-label="Transfer"
              className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-accent-fill bg-accent-fill px-[15px] text-[13.5px] font-medium !text-accent-ink hover:brightness-[1.07] min-[721px]:h-9"
            >
              <Icon name="swap" size={16} />
              <span className="max-[720px]:hidden">Transfer</span>
            </Link>
          </header>
          <div
            className={`hidden items-center justify-center gap-1.5 border-t border-border bg-warn-soft px-4 py-1.5 text-xs font-semibold text-warn max-[980px]:flex`}
          >
            <Icon name="info" size={14} />
            {BADGE_TEXT}
          </div>
        </div>

        <main
          id="main"
          tabIndex={-1}
          className={`mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-7 pb-[72px] pt-7 max-[980px]:px-4 max-[980px]:pb-16 max-[980px]:pt-5`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
