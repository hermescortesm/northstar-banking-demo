import type { ReactNode } from "react";

/** Definition list wrapper for KeyValueRow items. */
export function KeyValueList({ children }: { children: ReactNode }) {
  return <dl className="m-0">{children}</dl>;
}

/**
 * Label on the left, value on the right, optional small caption under the value.
 * Usage: <KeyValueList><KeyValueRow label="Fee">$0.00</KeyValueRow></KeyValueList>
 */
export function KeyValueRow({
  label, small, testId, children,
}: { label: ReactNode; small?: ReactNode; testId?: string; children: ReactNode }) {
  return (
    <div data-testid={testId} className="flex items-center justify-between gap-4 border-b border-border py-[11px] text-[13px] last:border-b-0">
      <dt className="text-text-3">{label}</dt>
      <dd className="num m-0 flex min-w-0 flex-col items-end gap-0.5 break-words text-right font-medium">
        {children}
        {small && <small className="text-xs font-normal text-text-3">{small}</small>}
      </dd>
    </div>
  );
}
