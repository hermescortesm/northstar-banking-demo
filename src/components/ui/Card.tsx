import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "./cn";
import { Reveal } from "./Reveal";

type CardProps<T extends ElementType> = { as?: T } & Omit<ComponentProps<T>, "as">;

/**
 * Bordered surface. Usage: <Card as="section" aria-labelledby="x"><CardHeader>...</CardHeader></Card>
 * `reveal` holds the card's entrance animations until it scrolls into view (see Reveal.tsx).
 */
export function Card<T extends ElementType = "div">({ as, className, reveal = false, ...rest }: CardProps<T> & { reveal?: boolean }) {
  const Tag: ElementType = as ?? "div";
  const cls = cn("rounded-card border border-border bg-surface", className);
  return reveal ? <Reveal as={Tag} className={cls} {...(rest as object)} /> : <Tag className={cls} {...rest} />;
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
