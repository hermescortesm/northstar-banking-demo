export type Step = "form" | "review" | "sending" | "done";

/** Details / Review / Done progress indicator. */
export function Stepper({ step }: { step: Step }) {
  const idx = step === "form" ? 0 : step === "done" ? 2 : 1;
  const items = ["Details", "Review", "Done"];
  return (
    <ol aria-label="Transfer steps" className="flex flex-wrap items-center gap-2">
      {items.map((name, i) => {
        const on = i === idx && step !== "done";
        const done = i < idx || step === "done";
        return (
          <li key={name} className="contents" aria-current={on ? "step" : undefined}>
            {i > 0 && <span aria-hidden="true" className="h-[1.5px] w-7 bg-border-strong" />}
            <span className={`flex items-center gap-2 text-[13px] font-medium transition-colors duration-200 ${on ? "text-text" : "text-text-3"}`}>
              <span
                aria-hidden="true"
                className={`grid size-6 place-items-center rounded-full border-[1.5px] text-xs font-semibold transition-[background-color,border-color,color] duration-200 ${
                  on ? "border-text bg-text text-surface" : done ? "border-accent bg-accent-soft text-accent" : "border-border-strong"
                }`}
              >
                {i + 1}
              </span>
              {name}
              {done && <span className="sr-only"> (complete)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
