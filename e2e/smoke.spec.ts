import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", label: "Overview", h1: "Good morning, Avery" },
  { path: "/transactions", label: "Transactions", h1: "Transactions" },
  { path: "/transfers", label: "Transfers", h1: "Transfers" },
];
const BADGE = "Simulated demo - no real funds";

test("desktop: sidebar nav reaches each route", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main", exact: true });
  await expect(page.getByText(BADGE).locator("visible=true")).toBeVisible();
  await expect(page.getByRole("link", { name: "Northstar" })).toBeVisible();
  for (const { path, label, h1 } of routes) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  }
});

test("mobile 375px: off-canvas nav, badge, no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  const nav = page.getByRole("navigation", { name: "Main", exact: true });
  for (const { path, h1 } of routes) {
    await page.goto(path);
    await expect(nav).toBeHidden();
    await expect(page.getByText(BADGE).locator("visible=true")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  }
  await page.goto("/");
  const open = page.getByRole("button", { name: "Open navigation" });
  expect((await open.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await open.click();
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Transfers" }).click();
  await expect(page).toHaveURL("/transfers");
  await expect(nav).toBeHidden();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
});

test("skip link is first tab stop and targets main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("M1: widening the viewport with the drawer open removes the scrim", async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("button", { name: "Close navigation" }).first()).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator("button.bg-scrim")).toHaveCount(0);
  // page is interactive again
  await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "Transfers" }).click();
  await expect(page).toHaveURL("/transfers");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("M2: drawer is a modal dialog with focus management", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Navigation" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(page.getByRole("button", { name: "Close navigation" }).last()).toBeFocused();
  // Tab cycles inside the drawer, never leaving it
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("#sidebar"))).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("#sidebar"))).toBe(true);
  // Escape returns focus to the opener
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  // Close button also returns focus
  await opener.click();
  await page.getByRole("button", { name: "Close navigation" }).last().click();
  await expect(opener).toBeFocused();
});

test("breakpoints are inclusive like the design (<=980 drawer, <=720 icon-only Transfer)", async ({ page }) => {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Open navigation" });
  await page.setViewportSize({ width: 980, height: 800 });
  await expect(opener).toBeVisible();
  await page.setViewportSize({ width: 981, height: 800 });
  await expect(opener).toBeHidden();
  const label = page.getByRole("link", { name: "Transfer", exact: true }).getByText("Transfer");
  await page.setViewportSize({ width: 720, height: 800 });
  await expect(label).toBeHidden();
  await page.setViewportSize({ width: 721, height: 800 });
  await expect(label).toBeVisible();
});

test("rendered text has no em or en dashes on any route", async ({ page }) => {
  const bad = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
  for (const { path, h1 } of routes) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    const text = await page.evaluate(() => document.body.innerText);
    expect(bad.test(text), `dash found on ${path}`).toBe(false);
  }
});
