"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLedger } from "@/state/LedgerProvider";
import { formatCents } from "@/lib/money";
import { transactionsHref } from "./overview/links";
import { Icon } from "./icons";
import { NAV_ITEMS, isActive } from "./nav-items";

const BADGE_TEXT = "Simulated demo - no real funds";

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
  const { accounts, balances } = useLedger();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const asideRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  // User-initiated close: focus returns to the hamburger once the page is no longer inert.
  const closeDrawer = useCallback(() => {
    restoreFocus.current = true;
    setMobileOpen(false);
  }, []);

  // Leaving the drawer layout (viewport wider than 980px) resets the open state, without moving focus.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 981px)");
    const onChange = (e: MediaQueryListEvent) => e.matches && setMobileOpen(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Focus management: into the drawer on open, back to the opener on close.
  useEffect(() => {
    if (mobileOpen) {
      closeRef.current?.focus();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      openerRef.current?.focus();
    }
  }, [mobileOpen]);

  // Escape closes; Tab is trapped inside the drawer while it is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return closeDrawer();
      if (e.key !== "Tab" || !asideRef.current) return;
      const items = Array.from(
        asideRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input"),
      ).filter((el) => el.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!asideRef.current.contains(active)) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeDrawer]);

  const lbl = collapsed ? `hidden tablet:inline` : "";

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
          tabIndex={-1}
          onClick={closeDrawer}
          className="fixed inset-0 z-[45] cursor-pointer border-0 bg-scrim desktop:hidden"
        />
      )}

      <aside
        id="sidebar"
        ref={asideRef}
        aria-label={mobileOpen ? "Navigation" : "Primary"}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        className={[
          "sticky top-0 z-50 flex h-screen flex-none flex-col gap-1.5 overflow-y-auto overflow-x-hidden bg-bg px-2.5 py-3.5 transition-[width,transform] duration-200",
          collapsed ? "w-[76px]" : "w-64",
          `tablet:fixed tablet:inset-y-0 tablet:left-0 tablet:!w-[284px] tablet:h-auto`,
          mobileOpen
            ? `tablet:visible tablet:translate-x-0 tablet:shadow-lg`
            : `tablet:invisible tablet:-translate-x-full`,
        ].join(" ")}
      >
        <div
          className={`flex items-center gap-2 px-1.5 pb-2.5 pt-0.5 ${
            collapsed ? `justify-center tablet:justify-between` : "justify-between"
          }`}
        >
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5 whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] !text-text"
          >
            <LogoMark />
            <span className={lbl}>Northstar</span>
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
            className={`${ghostIconBtn} ${collapsed ? "hidden" : "inline-flex"} tablet:hidden`}
          >
            <Icon name="panel" size={16} />
          </button>
          <button
            type="button"
            ref={closeRef}
            aria-label="Close navigation"
            onClick={closeDrawer}
            className={`${ghostIconBtn} hidden tablet:inline-flex tablet:size-11`}
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
            className={`${ghostIconBtn} inline-flex size-11 self-center tablet:hidden`}
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
          <span className={`flex min-w-0 flex-1 flex-col ${lbl ? `hidden tablet:flex` : ""}`}>
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
                onClick={closeDrawer}
                className={[
                  "flex h-9 items-center gap-3 whitespace-nowrap rounded-[9px] px-3 font-medium transition-colors",
                  `tablet:h-11`,
                  collapsed ? `justify-center px-0 tablet:justify-start tablet:px-3` : "",
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

        <div className={`flex-col gap-px ${collapsed ? "hidden tablet:flex" : "flex"}`}>
          <div className="px-3 pb-1.5 pt-[18px] text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
            Accounts
          </div>
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={transactionsHref({ account: a.id })}
              onClick={closeDrawer}
              aria-label={`${a.shortName} ${formatCents(balances[a.id].postedCents)}, view ${a.name} transactions`}
              className="flex min-h-[34px] items-center justify-between gap-2.5 rounded-[9px] px-3 text-[13px] !text-text-2 hover:bg-hover hover:!text-text tablet:min-h-11"
            >
              <span className="truncate">{a.shortName}</span>
              <span className="num font-medium text-text">{formatCents(balances[a.id].postedCents)}</span>
            </Link>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2.5">
          <div
            className={`gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-text-2 ${
              collapsed ? `hidden tablet:flex` : "flex"
            } items-start`}
          >
            <span className="mt-px text-warn">
              <Icon name="info" size={16} />
            </span>
            <span>Demo with fictional data. Transfers are simulated, so no real money moves.</span>
          </div>
          <div className="flex items-center gap-2.5 p-1.5">
            <span
              aria-hidden="true"
              className="grid size-8 flex-none place-items-center rounded-full bg-accent text-xs font-semibold text-white"
            >
              AB
            </span>
            <span className={`flex min-w-0 flex-1 flex-col ${lbl ? `hidden tablet:flex` : ""}`}>
              <strong className="truncate text-[13px] font-semibold">Avery Brooks</strong>
              <span className="text-xs text-text-3">Founder &amp; CEO</span>
            </span>
          </div>
        </div>
      </aside>

      <div
        inert={mobileOpen}
        className={`m-2 ml-0 flex min-h-[calc(100vh-16px)] min-w-0 flex-[999_1_560px] flex-col rounded-panel border border-border bg-surface shadow-[0_1px_3px_rgba(10,12,16,.04)] tablet:m-0 tablet:min-h-screen tablet:rounded-none tablet:border-0`}
      >
        <div className="sticky top-0 z-40 rounded-t-panel border-b border-border bg-surface">
          <header className={`flex items-center gap-2.5 px-7 py-3 tablet:px-4 tablet:py-2.5`}>
            <button
              type="button"
              ref={openerRef}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="sidebar"
              onClick={() => setMobileOpen(true)}
              className={`${ghostIconBtn} hidden tablet:inline-flex tablet:size-11`}
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
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-full border border-border bg-surface-2 pl-[38px] pr-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)] not-phone:h-[38px] not-phone:pr-14"
              />
              <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-full border border-border bg-surface px-[7px] py-0.5 font-sans text-[11px] font-medium text-text-3 not-phone:block">
                Enter
              </kbd>
            </form>
            <div className="flex-1" />
            <span
              className={`inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-warn/20 bg-warn-soft px-2.5 text-xs font-semibold text-warn tablet:hidden`}
            >
              <Icon name="info" size={14} />
              {BADGE_TEXT}
            </span>
            <Link
              href="/transfers"
              aria-label="Transfer"
              className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-accent-fill bg-accent-fill px-[15px] text-[13.5px] font-medium !text-accent-ink hover:brightness-[1.07] not-phone:h-9"
            >
              <Icon name="swap" size={16} />
              <span className="phone:hidden">Transfer</span>
            </Link>
          </header>
          <div
            className={`hidden items-center justify-center gap-1.5 border-t border-border bg-warn-soft px-4 py-1.5 text-xs font-semibold text-warn tablet:flex`}
          >
            <Icon name="info" size={14} />
            {BADGE_TEXT}
          </div>
        </div>

        <main
          id="main"
          tabIndex={-1}
          className={`mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-7 pb-[72px] pt-7 tablet:px-4 tablet:pb-16 tablet:pt-5`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
