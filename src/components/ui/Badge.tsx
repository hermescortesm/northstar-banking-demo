import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE: Record<BadgeTone, string> = {
  success: "bg-pos-soft text-pos",
  warning: "bg-warn-soft text-warn",
  danger: "bg-neg-soft text-neg",
  info: "bg-info-soft text-info",
  neutral: "bg-hover text-text-2",
};

/** Small pill. `dot` adds a status dot, `outlined` a faint border. Usage: <Badge tone="warning" dot>Pending</Badge> */
export function Badge({
  tone = "neutral", dot = false, outlined = false, size = "md", className, children,
}: { tone?: BadgeTone; dot?: boolean; outlined?: boolean; size?: "sm" | "md" | "lg"; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        size === "sm" && "h-5 px-2 text-[11px]",
        size === "md" && "h-6 px-2.5 text-xs",
        size === "lg" && "h-7 px-2.5 text-xs font-semibold",
        outlined && "border border-current/20",
        TONE[tone],
        className,
      )}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const STATUS_TONE = { completed: "success", pending: "warning", failed: "danger" } as const;
export const STATUS_LABEL = { completed: "Completed", pending: "Pending", failed: "Failed" } as const;
export type Status = keyof typeof STATUS_LABEL;

/** Transaction status as a Badge. Usage: <StatusPill status="pending" /> */
export function StatusPill({ status, size = "md" }: { status: Status; size?: "sm" | "md" }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot={size === "md"} size={size}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** The square uppercase "Simulated" tag shown next to simulated transactions. */
export function SimTag({ className }: { className?: string }) {
  return (
    <span className={cn("ml-1.5 flex-none rounded-[5px] bg-warn-soft px-[5px] py-px text-[10px] font-semibold uppercase tracking-[0.04em] text-warn", className)}>
      Simulated
    </span>
  );
}
