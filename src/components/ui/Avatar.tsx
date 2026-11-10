import { cn } from "./cn";

const TONE = { neutral: "bg-avatar text-avatar-ink", accent: "bg-accent text-on-accent" } as const;

/** Initials in a circle or rounded square. Usage: <Avatar initials="AB" tone="accent" shape="circle" /> */
export function Avatar({
  initials, tone = "neutral", shape = "square", size = 30,
}: { initials: string; tone?: keyof typeof TONE; shape?: "square" | "circle"; size?: 30 | 32 }) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid flex-none place-items-center text-xs font-semibold", TONE[tone], shape === "circle" ? "rounded-full" : "rounded-lg", size === 30 ? "size-[30px]" : "size-8")}
    >
      {initials}
    </span>
  );
}
