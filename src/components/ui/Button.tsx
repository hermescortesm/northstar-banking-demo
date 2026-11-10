import type { ComponentProps } from "react";
import { cn } from "./cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

const BASE =
  "group inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border font-medium no-underline transition-[background,border-color,opacity,filter,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "border-text bg-text text-surface hover:opacity-90", // solid ink
  accent: "border-accent-fill bg-accent-fill text-accent-ink hover:brightness-[1.07]", // brand green
  secondary: "border-border-strong bg-surface text-text hover:border-text-3 hover:bg-surface-2",
  ghost: "border-transparent bg-transparent text-text-2 hover:bg-hover hover:text-text",
  danger: "border-neg bg-surface text-neg hover:bg-neg-soft",
};

// Touch targets: 44px on phones, compact on larger screens.
const SIZE: Record<ButtonSize, string> = {
  md: "h-11 px-[15px] text-[13.5px] not-phone:h-9",
  sm: "h-11 px-2.5 text-[13px] not-phone:h-8",
};

/** Class string shared by Button and LinkButton so a link can look exactly like a button. */
export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string): string {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and disables the button. */
  loading?: boolean;
}

/** The one button. Usage: <Button variant="accent" onClick={save}>Save</Button> */
export function Button({ variant = "secondary", size = "md", loading = false, disabled, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses(variant, size, className)} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}
