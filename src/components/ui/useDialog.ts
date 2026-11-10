import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard behaviour shared by every modal surface (nav drawer, transaction drawer):
 * Escape calls `onClose`, and Tab / Shift+Tab wrap around inside `ref`.
 */
export function useDialogKeys(ref: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      const root = ref.current;
      if (e.key !== "Tab" || !root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!root.contains(current)) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ref, active, onClose]);
}

/** While active: page scroll is locked and every body child not marked `data-drawer-layer` is made inert. */
export function useModalLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const inerted: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el instanceof HTMLElement && !el.hasAttribute("data-drawer-layer") && !el.inert) {
        el.inert = true;
        inerted.push(el);
      }
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      for (const el of inerted) el.inert = false;
    };
  }, [active]);
}
