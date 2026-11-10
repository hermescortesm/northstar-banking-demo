import type { ComponentProps, ReactNode } from "react";
import { Icon } from "../icons";
import { cn } from "./cn";

export type InputSize = "md" | "lg" | "xl";

// One border that turns accent on focus is defined by the `.field` class in globals.css.
const SIZE: Record<InputSize, string> = {
  md: "h-11 not-phone:h-[38px] text-sm", // toolbar filters
  lg: "h-11 not-phone:h-10 text-sm", // regular form field
  xl: "h-14 text-2xl font-medium tabular-nums", // money amount
};

export interface InputProps extends Omit<ComponentProps<"input">, "size"> {
  size?: InputSize;
  /** Red border and aria-invalid. */
  invalid?: boolean;
}

/** Text input. Usage: <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Min $" /> */
export function Input({ size = "lg", invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || rest["aria-invalid"]}
      className={cn("field w-full rounded-[10px] border border-border-strong bg-surface px-3 text-text", SIZE[size], className)}
    />
  );
}

/** Pill-shaped search box with a leading icon and an optional trailing hint. Usage: <SearchInput id="q" value={q} onChange={...} /> */
export function SearchInput({
  className, trailing, ...rest
}: Omit<InputProps, "size" | "type"> & { trailing?: ReactNode }) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3">
        <Icon name="search" size={16} />
      </span>
      <input
        type="search"
        autoComplete="off"
        {...rest}
        className={cn("field h-11 w-full rounded-full border border-border bg-surface-2 pl-[38px] text-sm text-text not-phone:h-[38px]", trailing ? "pr-3 not-phone:pr-14" : "pr-3")}
      />
      {trailing}
    </div>
  );
}

/** Large money input with a "$" prefix. Usage: <AmountInput id="amt" value={v} onChange={...} /> */
export function AmountInput({ className, invalid, ...rest }: Omit<InputProps, "size">) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[22px] text-text-3">$</span>
      <Input size="xl" invalid={invalid} inputMode="decimal" autoComplete="off" className={cn("pl-8", className)} {...rest} />
    </div>
  );
}
