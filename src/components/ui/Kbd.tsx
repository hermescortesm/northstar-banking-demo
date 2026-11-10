import type { ReactNode } from "react";

/** Keyboard hint chip, hidden on phones. Usage: <Kbd>Enter</Kbd> */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-full border border-border bg-surface px-[7px] py-0.5 font-sans text-[11px] font-medium text-text-3 not-phone:block">
      {children}
    </kbd>
  );
}
