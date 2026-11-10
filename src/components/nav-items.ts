import type { IconName } from "./icons";

export const NAV_ITEMS: readonly { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/transactions", label: "Transactions", icon: "transactions" },
  { href: "/transfers", label: "Transfers", icon: "swap" },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
