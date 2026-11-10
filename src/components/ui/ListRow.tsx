import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Row with a leading tile, two text lines and a right-aligned value. Renders a link when `href` is set.
 * Usage: <ListRow href="/x" leading={<IconTile>..</IconTile>} title="Operating" subtitle="Checking" trailing={..} />
 */
export function ListRow({
  href, leading, title, subtitle, trailing, className, ...data
}: {
  href?: string;
  leading: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  trailing: ReactNode;
  className?: string;
  "data-testid"?: string;
  "data-account"?: string;
  "data-cents"?: number;
}) {
  const cls = cn(
    "grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-5 py-3 text-text no-underline",
    href && "transition-colors hover:bg-surface-2",
    className,
  );
  const body = (
    <>
      {leading}
      <span className="min-w-0">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-xs text-text-3">{subtitle}</span>
      </span>
      <span className="flex flex-col items-end gap-[3px] text-right">{trailing}</span>
    </>
  );
  return href ? (
    <Link href={href} className={cls} {...data}>{body}</Link>
  ) : (
    <div className={cls} {...data}>{body}</div>
  );
}
