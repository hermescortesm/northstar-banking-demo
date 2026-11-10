import type { ComponentProps } from "react";
import { cn } from "./cn";

export interface IconButtonProps extends Omit<ComponentProps<"button">, "aria-label"> {
  /** Required: icon-only buttons need an accessible name. */
  label: string;
}

/** Round ghost button holding only an icon (44px on phones, 36px otherwise). To hide it use a breakpoint variant such as `desktop:hidden`, not `hidden` (both set `display`). Usage: <IconButton label="Close"><Icon name="x" /></IconButton> */
export function IconButton({ label, className, children, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border border-transparent bg-transparent text-text-2 transition-colors duration-150 hover:bg-hover hover:text-text not-phone:size-9",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
