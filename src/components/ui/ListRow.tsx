import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../icons";
import { cn } from "./cn";

/**
 * Row with a leading tile, two text lines and a right-aligned value. Renders a link when `href` is set.
 * Usage: <ListRow href="/x" leading={<IconTile>..</IconTile>} title="Operating" subtitle="Checking" trailing={..} />
 */
export function ListRow({
  href, leading, title, subtitle, trailing, wrap = false, chevron = false, className, ...data
}: {
  href?: string;
  leading: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  trailing: ReactNode;
  /** Let title and subtitle wrap onto several lines instead of truncating. */
  wrap?: boolean;
  /** Trailing chevron that nudges right on hover (rows that are links). */
  chevron?: boolean;
  className?: string;
  "data-testid"?: string;
  "data-account"?: string;
  "data-cents"?: number;
}) {
  const cls = cn(
    "group grid items-center gap-3 border-t border-border px-5 py-3 text-text no-underline",
    chevron ? "grid-cols-[36px_minmax(0,1fr)_auto_14px]" : "grid-cols-[36px_minmax(0,1fr)_auto]",
    href && "transition-colors duration-150 hover:bg-surface-2 active:bg-hover",
    className,
  );
  const body = (
    <>
      {leading}
      <span className="min-w-0">
        <span className={cn("block font-medium", !wrap && "truncate")}>{title}</span>
        <span className={cn("block text-xs text-text-3", !wrap && "truncate")}>{subtitle}</span>
      </span>
      <span className="flex flex-col items-end gap-[3px] text-right">{trailing}</span>
      {chevron && <Icon name="chevRight" size={14} className="text-text-3 opacity-40 transition-[transform,opacity] duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />}
    </>
  );
  return href ? (
    <Link href={href} className={cls} {...data}>{body}</Link>
  ) : (
    <div className={cls} {...data}>{body}</div>
  );
}
