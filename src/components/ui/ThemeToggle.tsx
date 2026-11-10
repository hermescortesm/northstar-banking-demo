"use client";

import { useEffect, useSyncExternalStore } from "react";
import { otherTheme, readSavedTheme, resolveTheme, saveTheme, type Theme } from "@/lib/theme";
import { IconButton } from "./IconButton";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const getTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

/** Applies a theme to <html>. A short class enables colour transitions for this change only (never on first paint). */
function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-anim");
  root.setAttribute("data-theme", t);
  window.setTimeout(() => root.classList.remove("theme-anim"), 260);
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function Moon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

/**
 * Light/dark switch. The theme lives on <html data-theme>; the server snapshot is "light" so hydration matches,
 * then the real value is read. Follows system changes until the user picks a theme.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!readSavedTheme()) applyTheme(resolveTheme(null, mql.matches));
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const next = otherTheme(theme);
  return (
    <IconButton
      label={`Switch to ${next} theme`}
      data-testid="theme-toggle"
      onClick={() => {
        saveTheme(next);
        applyTheme(next);
      }}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </IconButton>
  );
}
