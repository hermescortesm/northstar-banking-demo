import { afterEach, describe, expect, it } from "vitest";
import { otherTheme, readSavedTheme, resolveTheme, saveTheme, THEME_INIT_SCRIPT, THEME_KEY } from "./theme";

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("resolveTheme", () => {
  it("prefers a saved choice over the system", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
  it("follows the system when nothing valid is saved", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("light");
    expect(resolveTheme("purple", true)).toBe("dark");
  });
  it("toggles", () => {
    expect(otherTheme("dark")).toBe("light");
    expect(otherTheme("light")).toBe("dark");
  });
});

describe("storage", () => {
  it("round-trips and ignores junk", () => {
    expect(readSavedTheme()).toBeNull();
    saveTheme("dark");
    expect(readSavedTheme()).toBe("dark");
    window.localStorage.setItem(THEME_KEY, "nope");
    expect(readSavedTheme()).toBeNull();
  });
  it("survives blocked storage", () => {
    const spy = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("blocked"); } });
    try {
      expect(readSavedTheme()).toBeNull();
      expect(() => saveTheme("dark")).not.toThrow();
    } finally {
      Object.defineProperty(window, "localStorage", spy);
    }
  });
});

describe("THEME_INIT_SCRIPT", () => {
  const run = (dark: boolean) => {
    window.matchMedia = ((q: string) => ({ matches: dark && q.includes("dark"), media: q })) as typeof window.matchMedia;
    new Function(THEME_INIT_SCRIPT)();
    return document.documentElement.getAttribute("data-theme");
  };
  it("sets the system theme when nothing is saved", () => {
    expect(run(true)).toBe("dark");
    expect(run(false)).toBe("light");
  });
  it("uses the saved theme over the system", () => {
    window.localStorage.setItem(THEME_KEY, "light");
    expect(run(true)).toBe("light");
  });
});
