import type { ReactNode } from "react";

/** Text for screen readers only. Usage: <VisuallyHidden>Loading</VisuallyHidden> */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
