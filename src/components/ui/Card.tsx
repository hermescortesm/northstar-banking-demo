import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "./cn";

type CardProps<T extends ElementType> = { as?: T } & Omit<ComponentProps<T>, "as">;

/** Bordered surface. Usage: <Card as="section" aria-labelledby="x"><CardHeader>...</CardHeader></Card> */
export function Card<T extends ElementType = "div">({ as, className, ...rest }: CardProps<T>) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={cn("rounded-card border border-border bg-surface", className)} {...rest} />;
}

/** Title row of a card: heading on the left, optional action/meta on the right. */
export function CardHeader({ children, flush = false, className }: { children: ReactNode; /** No bottom padding (content below brings its own). */ flush?: boolean; className?: string }) {
  return <div className={cn("flex flex-wrap items-center justify-between gap-3 px-5 pt-[18px]", flush ? "pb-0" : "pb-3.5", className)}>{children}</div>;
}

/** Card heading (h2). Usage: <CardTitle id="ac-h">Accounts</CardTitle> */
export function CardTitle({ children, ...rest }: ComponentProps<"h2">) {
  return (
    <h2 className="text-[15px] font-semibold tracking-[-0.01em]" {...rest}>
      {children}
    </h2>
  );
}

/** Muted supporting text next to a CardTitle. */
export function CardSub({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-[13px] text-text-3", className)}>{children}</span>;
}
