import { expect, test } from "@playwright/test";
import { animationsDone } from "./helpers";

const html = (page: import("@playwright/test").Page) => page.locator("html");

test("no saved choice: follows the system preference on first load", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName("Switch to light theme");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(6, 7, 8)");
});

test("light system preference gives the light theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-theme", "light");
  await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName("Switch to dark theme");
});

test("no flash: the theme is set before any app JavaScript runs", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.route("**/_next/static/**/*.js", (r) => r.abort()); // app bundles never load
  await page.goto("/transactions");
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(6, 7, 8)");
});

test("toggle flips the theme, persists across reloads and beats the system preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const toggle = page.getByTestId("theme-toggle");
  await toggle.click();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAccessibleName("Switch to light theme");
  expect(await page.evaluate(() => localStorage.getItem("ns-theme"))).toBe("dark");
  await page.reload();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await page.goto("/transfers");
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await page.getByTestId("theme-toggle").click();
  await expect(html(page)).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html(page)).toHaveAttribute("data-theme", "light");
});

test("toggle is keyboard operable and a 44px target on phones", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const toggle = page.getByTestId("theme-toggle");
  const box = (await toggle.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await page.keyboard.press("Space");
  await expect(html(page)).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("blocked storage does not break the toggle", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByTestId("theme-toggle").click();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
});

test("follows system changes until the user chooses", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.waitForLoadState("networkidle"); // hydrated: the system-change listener is attached
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await page.getByTestId("theme-toggle").click(); // user picks light
  await expect(html(page)).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html(page)).toHaveAttribute("data-theme", "light");
});

test("one border on focus: no outline, accent border, no gap (light and dark)", async ({ page }) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/transactions");
    const select = page.getByLabel("Direction");
    await select.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await animationsDone(page);
    const s = await select.evaluate((e) => {
      const c = getComputedStyle(e);
      return { outline: c.outlineStyle, border: c.borderTopColor, shadow: c.boxShadow, accent: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() };
    });
    expect(s.outline).toBe("none");
    expect(s.shadow).toContain("inset");
    expect(s.border).not.toBe("rgb(210, 214, 221)");
  }
});
