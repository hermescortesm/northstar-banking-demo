import type { ReactNode } from "react";
import { Icon } from "../icons";
import { cn } from "./cn";

/** Change indicator: green up arrow or red down arrow plus a label. Usage: <DeltaPill negative={false}>+2.4%</DeltaPill> */
export function DeltaPill({ negative, children, ...rest }: { negative: boolean; children: ReactNode; "data-testid"?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", negative ? "bg-neg-soft text-neg" : "bg-pos-soft text-pos")}
      {...rest}
    >
      <Icon name={negative ? "trendDown" : "trend"} size={14} />
      {children}
    </span>
  );
}
