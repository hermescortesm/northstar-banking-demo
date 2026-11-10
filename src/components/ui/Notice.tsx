import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons";
import { cn } from "./cn";

const TONE = {
  warning: { box: "bg-warn-soft", icon: "text-warn", name: "info" },
  danger: { box: "bg-neg-soft", icon: "text-neg", name: "alert" },
} as const;

/** Inline banner with an icon. Usage: <Notice tone="danger" role="alert">Something went wrong</Notice> */
export function Notice({
  tone = "warning", icon, role, className, children,
}: { tone?: keyof typeof TONE; icon?: IconName; role?: "alert" | "note" | "status"; className?: string; children: ReactNode }) {
  const t = TONE[tone];
  return (
    <div role={role} className={cn("flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[13px] text-text", t.box, className)}>
      <span className={cn("mt-px flex-none", t.icon)}>
        <Icon name={icon ?? t.name} size={16} />
      </span>
      <span>{children}</span>
    </div>
  );
}
