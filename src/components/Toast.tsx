"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";
import { IconButton } from "./ui/IconButton";

export type ToastKind = "success" | "error";
interface ToastItem { id: number; message: string; kind: ToastKind; leaving?: boolean }

const EXIT_MS = 200;

export const TOAST_MS = 3800;
export const TOAST_MAX = 3;

interface ToastContextValue {
  /** Shows a toast that auto-dismisses after 3.8s. At most 3 are visible; the oldest is dropped first. */
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const set = timers.current;
    return () => set.forEach(clearTimeout);
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++seq.current;
    setItems((cur) => [...cur, { id, message, kind }].slice(-TOAST_MAX));
    // Exit animation (opacity/transform) plays during the last EXIT_MS; removal time is unchanged.
    const leave = setTimeout(() => {
      timers.current.delete(leave);
      setItems((cur) => cur.map((i) => (i.id === id ? { ...i, leaving: true } : i)));
    }, TOAST_MS - EXIT_MS);
    const t = setTimeout(() => {
      timers.current.delete(t);
      setItems((cur) => cur.filter((i) => i.id !== id));
    }, TOAST_MS);
    timers.current.add(leave);
    timers.current.add(t);
  }, []);

  const dismiss = useCallback((id: number) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[90] flex max-w-[calc(100vw-40px)] flex-col gap-2 phone:inset-x-4 phone:bottom-auto phone:top-3 phone:right-4 phone:max-w-none"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            data-kind={t.kind}
            className={`${t.leaving ? "animate-toast-out" : "animate-toast-in"} pointer-events-auto flex min-w-[260px] max-w-[400px] items-center gap-2.5 rounded-[14px] border border-tip-bd bg-tip-bg py-3 pl-3 pr-3.5 text-[13px] font-medium text-tip-fg shadow-lg phone:min-w-0 phone:max-w-none`}
          >
            <span
              aria-hidden="true"
              className={`grid size-[22px] flex-none place-items-center rounded-full ${
                t.kind === "success" ? "bg-tip-ok/20 text-tip-ok" : "bg-tip-err/20 text-tip-err"
              }`}
            >
              <Icon name={t.kind === "success" ? "check" : "alert"} size={14} />
            </span>
            <span className="flex-1">{t.message}</span>
            <IconButton
              label="Dismiss notification"
              onClick={() => dismiss(t.id)}
              className="-my-1.5 -mr-1.5 !text-tip-fg/70 hover:!bg-tip-fg/10 hover:!text-tip-fg not-phone:!size-8"
            >
              <Icon name="x" size={14} />
            </IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
