import { cn } from "./cn";

/** Pill-shaped group of toggle buttons (one pressed at a time). Usage: <SegmentedControl label="Range" options={["7D","30D"]} value={r} onChange={setR} /> */
export function SegmentedControl<T extends string>({
  label, options, value, onChange,
}: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-full border border-border bg-surface-2 p-[3px]">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "h-11 min-w-11 cursor-pointer rounded-full border-0 px-3 text-[13px] font-medium transition-[background-color,color,transform] duration-150 active:scale-95 not-phone:h-7 not-phone:min-w-0",
            value === o ? "bg-text text-surface" : "bg-transparent text-text-2 hover:text-text",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
