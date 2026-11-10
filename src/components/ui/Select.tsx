import type { ComponentProps } from "react";
import { cn } from "./cn";

/** Native select with a custom chevron. Pair with <Field hideLabel> or a label. Usage: <Select id="s" value={v} onChange={...}><option>...</option></Select> */
export function Select({ className, ...rest }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "field h-11 min-w-0 flex-[1_1_140px] cursor-pointer appearance-none rounded-[10px] border border-border-strong bg-surface select-chevron pl-3 pr-[34px] text-sm text-text not-phone:h-[38px] not-phone:min-w-[130px] not-phone:flex-none",
        className,
      )}
      {...rest}
    />
  );
}
