import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", label: "Overview" },
  { path: "/transactions", label: "Transactions" },
  { path: "/transfers", label: "Transfers" },
];
const BADGE = "Simulated demo — no real funds";

test("desktop: sidebar nav reaches each route", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main", exact: true });
  await expect(page.getByText(BADGE).locator("visible=true")).toBeVisible();
  await expect(page.getByRole("link", { name: "Northstar" })).toBeVisible();
  for (const { path, label } of routes) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1, name: label })).toBeVisible();
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  }
});

test("mobile 375px: off-canvas nav, badge, no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  const nav = page.getByRole("navigation", { name: "Main", exact: true });
  for (const { path, label } of routes) {
    await page.goto(path);
    await expect(nav).toBeHidden();
    await expect(page.getByText(BADGE).locator("visible=true")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: label })).toBeVisible();
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
