import { expect, test, type Page } from "@playwright/test";

const toCents = (t: string) => Math.round(Number(t.replace(/[^0-9.-]/g, "").replace("−", "-")) * 100);
const posted = async (page: Page, id: "op" | "rs") =>
  toCents(await page.getByTestId(`bal-${id}`).locator('[data-role="posted"]').innerText());
const amount = (page: Page) => page.getByLabel("Amount", { exact: true });
const review = (page: Page) => page.getByRole("button", { name: "Review transfer" });
const confirm = (page: Page) => page.getByRole("button", { name: /Confirm simulated transfer/ });
const mainNav = (page: Page) => page.getByRole("navigation", { name: "Main" });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/transfers");
});

test("second transfer after leaving and re-entering /transfers is applied (key survives remount)", async ({ page }) => {
  const [op0, rs0] = [await posted(page, "op"), await posted(page, "rs")];
  await amount(page).fill("10");
  await review(page).click();
  await confirm(page).click();
  await expect(page.getByText(/Reference SIM-0001/)).toBeVisible();

  await page.getByRole("link", { name: "View in transactions" }).click();
  await expect(page).toHaveURL(/\/transactions/);
  await mainNav(page).getByRole("link", { name: "Transfers" }).click();
  await expect(page.getByRole("form", { name: "Transfer details" })).toBeVisible();

  await amount(page).fill("20");
  await review(page).click();
  await confirm(page).click();
  await expect(page.getByText(/Reference SIM-0002/)).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Simulated transfer of $20.00 recorded" })).toBeVisible();

  expect(await posted(page, "op")).toBe(op0 - 3000);
  expect(await posted(page, "rs")).toBe(rs0 + 3000);
  const rows = page.getByRole("region", { name: "Recent transfers" }).getByRole("listitem");
  await expect(rows.nth(0)).toContainText("−$20.00");
  await expect(rows.nth(1)).toContainText("−$10.00");
});

test("focus returns to the amount field after Edit details; toast can be dismissed", async ({ page }) => {
  await amount(page).fill("5");
  await review(page).click();
  await page.getByRole("button", { name: "Edit details" }).click();
  await expect(amount(page)).toBeFocused();
  await review(page).click();
  await confirm(page).click();
  const toast = page.getByRole("status").filter({ hasText: "Simulated transfer of $5.00 recorded" });
  await expect(toast).toBeVisible();
  await toast.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(toast).toHaveCount(0);
});

test("mobile 375: Simulated tag visible in recent transfers; toast sits at the top, clear of actions", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/transfers");
  await amount(page).fill("3");
  await review(page).click();
  await confirm(page).click();
  const toast = page.getByRole("status").filter({ hasText: "recorded" });
  await expect(toast).toBeVisible();
  expect((await toast.boundingBox())!.y).toBeLessThan(100);
  const tag = page.getByRole("region", { name: "Recent transfers" }).getByRole("listitem").first().getByText("Simulated");
  await tag.scrollIntoViewIfNeeded();
  const box = (await tag.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
});
