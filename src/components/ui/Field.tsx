import type { ReactNode } from "react";
import { Icon } from "../icons";

/** Props to spread on the control so it is wired to its label, hint and error. */
export interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

/** Red error line with an icon. Give it an id so a control can point at it with aria-describedby. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="flex items-center gap-1.5 text-xs text-neg">
      <span aria-hidden="true" className="flex-none"><Icon name="alert" size={14} /></span>
      {message}
    </span>
  );
}

/**
 * Label + control + hint + error. The control comes from a render function so the ids line up:
 * error id is `${id}-err`, hint id is `${id}-hint`.
 *
 *   <Field id="memo" label="Note" error={err}>{(p) => <Input {...p} value={v} onChange={...} />}</Field>
 */
export function Field({
  id, label, hideLabel = false, hint, error, aside, className, children,
}: {
  id: string;
  label: ReactNode;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: string;
  /** Right-aligned text on the label row, e.g. a character counter. */
  aside?: ReactNode;
  /** Replaces the default vertical stack layout (e.g. to size the field inside a flex toolbar). */
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}) {
  const describedBy = [error ? `${id}-err` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ");
  return (
    <div className={className ?? "flex flex-col gap-1.5"}>
      <div className={hideLabel ? undefined : "flex justify-between"}>
        <label htmlFor={id} className={hideLabel ? "sr-only" : "text-[13px] font-medium text-text"}>
          {label}
        </label>
        {aside && <span className="text-xs text-text-3" aria-hidden="true">{aside}</span>}
      </div>
      {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy || undefined })}
      <FieldError id={`${id}-err`} message={error} />
      {hint && <span id={`${id}-hint`} className="text-xs text-text-3">{hint}</span>}
    </div>
  );
}
