import { animationsDone } from "./helpers";
import { expect, test, type Page } from "@playwright/test";

const rows = (page: Page) => page.getByRole("button", { name: /, [+−]\$[\d,.]+, (Completed|Pending|Failed), / });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("lists 12 per page with summary and pager", async ({ page }) => {
  await page.goto("/transactions");
  await expect(rows(page)).toHaveCount(12);
  await expect(page.getByText(/^Showing 1-12 of /)).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "Previous page" })).toBeEnabled();
});

test("search narrows by merchant and clearing restores", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByLabel("Search by merchant, description or reference").fill("amazon web");
  const n = await rows(page).count();
  expect(n).toBeGreaterThan(0);
  for (const r of await rows(page).all()) await expect(r).toContainText("Amazon Web Services");
  await page.getByRole("button", { name: /Clear 1 filter/ }).click();
  await expect(rows(page)).toHaveCount(12);
  await expect(page.getByLabel("Search by merchant, description or reference")).toHaveValue("");
});

test("direction, status and account filters; sort toggles", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByLabel("Direction").selectOption("in");
  for (const r of await rows(page).all()) await expect(r).toHaveAccessibleName(/, \+\$/);
  await page.getByLabel("Status").selectOption("pending");
  for (const r of await rows(page).all()) await expect(r).toHaveAccessibleName(/, Pending, /);
  await page.getByRole("button", { name: /Clear 2 filters/ }).click();
  await page.getByLabel("Status").selectOption("failed");
  await expect(rows(page)).toHaveCount(2);
  await page.getByRole("button", { name: /Clear 1 filter/ }).click();
  await page.getByLabel("Account").selectOption("rs");
  await expect(rows(page).first()).toBeVisible();
  const sortAmt = page.getByRole("button", { name: /Sort by amount/ });
  await expect(sortAmt).toHaveAccessibleName("Sort by amount (not sorted)");
  await sortAmt.click();
  await expect(sortAmt).toHaveAccessibleName("Sort by amount (descending)");
  await sortAmt.click();
  await expect(sortAmt).toHaveAccessibleName("Sort by amount (ascending)");
});

test("invalid amount shows an alert and is ignored", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByLabel("Minimum amount in dollars").fill("abc");
  await expect(page.getByRole("alert").filter({ hasText: "Enter amounts" })).toContainText("Enter amounts as numbers");
  await expect(rows(page)).toHaveCount(12);
});

test("empty state and clear all", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByLabel("Search by merchant, description or reference").fill("zzzz-nothing");
  await expect(page.getByRole("heading", { name: "No transactions match these filters" })).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(rows(page)).toHaveCount(12);
});

test("?q= from the top-bar search applies, including from another page", async ({ page }) => {
  await page.goto("/transactions?q=stripe");
  await expect(page.getByLabel("Search by merchant, description or reference")).toHaveValue("stripe");
  for (const r of await rows(page).all()) await expect(r).toContainText("Stripe");
  await page.goto("/transfers");
  await page.getByRole("searchbox", { name: "Search transactions" }).fill("datadog");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/transactions\?q=datadog/);
  await expect(page.getByLabel("Search by merchant, description or reference")).toHaveValue("datadog");
  await expect(rows(page).first()).toContainText("Datadog");
});

test("overview contract: account + type params", async ({ page }) => {
  await page.goto("/transactions?account=pr&type=out");
  await expect(page.getByLabel("Account")).toHaveValue("pr");
  await expect(page.getByLabel("Direction")).toHaveValue("out");
  await expect(page.getByRole("button", { name: /Clear 2 filters/ })).toBeVisible();
  const all = await rows(page).all();
  expect(all.length).toBeGreaterThan(0);
  for (const r of all) {
    await expect(r).toHaveAccessibleName(/, −\$/);
    await expect(r).toContainText("Payroll ••1956");
  }
  await page.goto("/transactions?category=Rent&range=90D");
  await expect(page.getByLabel("Category")).toHaveValue("Rent");
  await expect(page.getByLabel("Date range")).toHaveValue("90D");
});

test("overview contract: q=<reference> opens that single transaction", async ({ page }) => {
  await page.goto("/transactions");
  const first = rows(page).first();
  await first.click();
  const ref = (await page.getByRole("dialog").getByText(/^NS-\d{6}-\d+$/).first().textContent())!;
  await page.keyboard.press("Escape");
  await page.goto(`/transactions?q=${encodeURIComponent(ref)}`);
  await expect(rows(page)).toHaveCount(1);
});

test("detail drawer: opens labelled, focus on close, Escape closes and restores focus", async ({ page }) => {
  await page.goto("/transactions");
  const first = rows(page).first();
  await first.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toHaveAccessibleName(/\S/);
  await expect(dialog.getByRole("button", { name: "Close transaction details" })).toBeFocused();
  await expect(dialog.getByText("Timeline")).toBeVisible();
  await expect(dialog.getByText("Reference", { exact: true })).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(first).toBeFocused();
  await first.click();
  await page.getByRole("button", { name: "Close transaction details" }).last().click();
  await expect(dialog).toHaveCount(0);
});

test("drawer shows failure reason and 'Show all from' filters by merchant", async ({ page }) => {
  await page.goto("/transactions?status=failed");
  await rows(page).first().click();
  await expect(page.getByRole("dialog").getByRole("note")).toBeVisible();
  const btn = page.getByRole("button", { name: /^Show all from / });
  const merchant = (await btn.textContent())!.replace("Show all from ", "").trim();
  await btn.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Search by merchant, description or reference")).toHaveValue(merchant);
});

for (const width of [375, 390]) {
  test(`mobile ${width}px: stacked rows, no overflow, amounts not clipped`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/transactions");
    await expect(rows(page)).toHaveCount(12);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(await overflow()).toBe(false);
    // header hidden, amounts fully inside the viewport
    await expect(page.getByRole("button", { name: /Sort by date/ })).toBeHidden();
    for (const r of await rows(page).all()) {
      const box = (await r.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      const amt = r.locator(".num");
      const clipped = await amt.evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(clipped).toBe(false);
      const a = (await amt.boundingBox())!;
      expect(a.x + a.width).toBeLessThanOrEqual(width);
    }
    await rows(page).first().click();
    const dlg = page.getByRole("dialog");
    await expect(dlg).toBeVisible();
    await animationsDone(page);
    expect(((await dlg.boundingBox())!).width).toBeLessThanOrEqual(width);
    expect(await overflow()).toBe(false);
    await page.keyboard.press("Escape");
    await page.getByLabel("Search by merchant, description or reference").fill("zzzz");
    await expect(page.getByRole("heading", { name: "No transactions match these filters" })).toBeVisible();
    expect(await overflow()).toBe(false);
  });
}
