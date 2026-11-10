export type Theme = "light" | "dark";
export const THEME_KEY = "ns-theme";

/** Saved choice wins; otherwise follow the system preference. */
export function resolveTheme(saved: string | null | undefined, systemDark: boolean): Theme {
  if (saved === "light" || saved === "dark") return saved;
  return systemDark ? "dark" : "light";
}

export const otherTheme = (t: Theme): Theme => (t === "dark" ? "light" : "dark");

/** Reads the saved choice; storage can throw (private mode, blocked cookies). */
export function readSavedTheme(): Theme | null {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function saveTheme(t: Theme): void {
  try {
    window.localStorage.setItem(THEME_KEY, t);
  } catch {
    /* storage blocked: the choice just lasts for this page view */
  }
}

/**
 * Inline script run in <head> before first paint, so the page never flashes the wrong theme.
 * Same logic as resolveTheme + readSavedTheme, written as a plain string.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=null;try{s=localStorage.getItem("${THEME_KEY}")}catch(e){}var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=(s==="light"||s==="dark")?s:(d?"dark":"light");document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;
