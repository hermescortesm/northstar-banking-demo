"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

export type ToastKind = "success" | "error";
interface ToastItem { id: number; message: string; kind: ToastKind }

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
    const t = setTimeout(() => {
      timers.current.delete(t);
      setItems((cur) => cur.filter((i) => i.id !== id));
    }, TOAST_MS);
    timers.current.add(t);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[90] flex max-w-[calc(100vw-40px)] flex-col gap-2 phone:inset-x-4 phone:bottom-4 phone:right-4 phone:max-w-none"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            data-kind={t.kind}
            className="animate-rise pointer-events-auto flex min-w-[260px] max-w-[400px] items-center gap-2.5 rounded-[14px] bg-[#0a0c10] py-3 pl-3 pr-3.5 text-[13px] font-medium text-white shadow-lg phone:min-w-0 phone:max-w-none"
          >
            <span
              aria-hidden="true"
              className={`grid size-[22px] flex-none place-items-center rounded-full ${
                t.kind === "success" ? "bg-[rgba(63,207,151,.22)] text-[#3fcf97]" : "bg-[rgba(255,122,110,.22)] text-[#ff7a6e]"
              }`}
            >
              <Icon name={t.kind === "success" ? "check" : "alert"} size={14} />
            </span>
            <span className="flex-1">{t.message}</span>
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
