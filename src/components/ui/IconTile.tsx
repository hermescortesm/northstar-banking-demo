import type { CSSProperties, ReactNode } from "react";
import { cn } from "./cn";

/**
 * Square tile holding an icon. With `color` it shows that colour on a 13% tint (category tiles),
 * otherwise the accent-soft look. Usage: <IconTile color="#3B5B8C"><Icon name="users" /></IconTile>
 */
export function IconTile({
  color, size = "md", bordered = false, className, children,
}: { color?: string; size?: "sm" | "md" | "lg"; bordered?: boolean; className?: string; children: ReactNode }) {
  const style: CSSProperties | undefined = color ? { color, background: `${color}21` } : undefined;
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "grid flex-none place-items-center",
        size === "sm" && "size-[30px] rounded-lg",
        size === "md" && "size-9 rounded-[10px]",
        size === "lg" && "size-12 rounded-[14px]",
        !color && (bordered ? "border border-border bg-surface-2 text-accent" : "bg-accent-soft text-accent"),
        className,
      )}
    >
      {children}
    </span>
  );
}
