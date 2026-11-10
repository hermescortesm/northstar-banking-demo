"use client";

import { useLayoutEffect, useRef, useState, type ComponentProps, type ElementType } from "react";

/** "in": show/animate now (default, SSR, no IntersectionObserver, reduced motion). "pending": below the fold, held. "seen": scrolled into view. */
export type RevealState = "in" | "pending" | "seen";

/** The element counts as reached once its top edge is this far (fraction of viewport height) above the bottom edge. */
const MARGIN = 0.1;

/**
 * Scroll-triggered entrance. Decides before first paint whether the element starts below the fold; if so it is marked
 * `data-reveal="pending"` (globals.css pauses every animation inside it at frame 0) and flips to `"seen"` the first time
 * it scrolls into view (IntersectionObserver, observed once). Elements already on screen, browsers without
 * IntersectionObserver and reduced-motion users never leave `"in"`, so content is never hidden for them.
 * Server render is always `"in"`: no JavaScript means no hidden state.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<RevealState>("in");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top <= window.innerHeight * (1 - MARGIN)) return; // already reached
    // Hold now (before React re-renders) and rewind animations that SSR already started before hydration.
    el.dataset.reveal = "pending";
    el.getAnimations?.({ subtree: true }).forEach((a) => { a.currentTime = 0; });
    setState("pending");
    const reveal = () => {
      io.disconnect();
      el.removeEventListener("focusin", reveal);
      setState("seen");
    };
    // Keyboard focus reveals at once: a focused element must never sit invisible (focus ring included).
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && reveal(), {
      rootMargin: `0px 0px -${MARGIN * 100}% 0px`,
    });
    io.observe(el);
    el.addEventListener("focusin", reveal);
    return () => {
      io.disconnect();
      el.removeEventListener("focusin", reveal);
    };
  }, []);
  return [ref, state] as const;
}

/** Element wrapper around useReveal. Usage: <Reveal as="section" className="enter" style={stagger(2)}>...</Reveal> */
export function Reveal({ as, ...rest }: { as?: ElementType } & Omit<ComponentProps<"div">, "ref">) {
  const Tag: ElementType = as ?? "div";
  const [ref, state] = useReveal<HTMLElement>();
  return <Tag ref={ref} data-reveal={state} {...rest} />;
}
