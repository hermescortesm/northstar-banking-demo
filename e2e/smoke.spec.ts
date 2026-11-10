import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", label: "Overview" },
  { path: "/transactions", label: "Transactions" },
  { path: "/transfers", label: "Transfers" },
];

test("desktop: sidebar nav reaches each route", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  await expect(page.getByText("Simulated demo — no real funds").locator("visible=true")).toBeVisible();
  for (const { path, label } of routes) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1, name: label })).toBeVisible();
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  }
});

test("mobile 375px: tab bar, badge, no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  for (const { path, label } of routes) {
    await page.goto(path);
    const tabs = page.getByRole("navigation", { name: "Primary mobile" });
    await expect(tabs).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary", exact: true })).toBeHidden();
    await expect(tabs.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Simulated demo — no real funds").locator("visible=true")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  }
});
