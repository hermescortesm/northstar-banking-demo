import type { ComponentProps } from "react";
import { cn } from "./cn";

/** Native select with a custom chevron. Pair with <Field hideLabel> or a label. Usage: <Select id="s" value={v} onChange={...}><option>...</option></Select> */
export function Select({ className, ...rest }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "field h-11 min-w-0 flex-[1_1_140px] cursor-pointer appearance-none rounded-[10px] border border-border-strong bg-surface bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2378849A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pl-3 pr-[34px] text-sm text-text not-phone:h-[38px] not-phone:min-w-[130px] not-phone:flex-none",
        className,
      )}
      {...rest}
    />
  );
}
