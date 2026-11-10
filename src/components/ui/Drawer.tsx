"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useDialogKeys, useModalLock } from "./useDialog";

/**
 * Right-hand modal panel with a fading scrim, rendered in a portal. Handles focus trap, Escape, scroll lock and inert page.
 * `initialFocus` is focused on open. Usage:
 *   <Drawer labelledBy="title" onClose={close} initialFocus={closeRef}>...</Drawer>
 */
export function Drawer({
  labelledBy, closeLabel, onClose, initialFocus, children,
}: { labelledBy: string; closeLabel: string; onClose: () => void; initialFocus?: RefObject<HTMLElement | null>; children: ReactNode }) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    initialFocus?.current?.focus();
  }, [initialFocus]);
  useModalLock(true);
  useDialogKeys(panelRef, true, onClose);

  return createPortal(
    <>
      <button
        type="button"
        data-drawer-layer
        aria-label={closeLabel}
        tabIndex={-1}
        onClick={onClose}
        className="animate-fade fixed inset-0 z-[60] w-full cursor-pointer border-0 bg-scrim"
      />
      <aside
        ref={panelRef}
        data-drawer-layer
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="animate-slide-in fixed inset-y-0 right-0 z-[61] flex w-[min(480px,100vw)] flex-col border-l border-border bg-surface shadow-lg"
      >
        {children}
      </aside>
    </>,
    document.body,
  );
}
