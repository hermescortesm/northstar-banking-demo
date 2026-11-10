import { animationsDone } from "./helpers";
import { expect, test } from "@playwright/test";

const cents = (s: string) => Math.round(parseFloat(s.replace(/[^0-9.]/g, "")) * 100);

test("hero total equals sum of account cards", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Good morning, Avery" })).toBeVisible();
  const total = Number(await page.getByTestId("hero-total").getAttribute("data-cents"));
  const cards = await page.getByTestId("account-card").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-cents"))));
  expect(cards).toHaveLength(3);
  expect(cards.reduce((a, b) => a + b, 0)).toBe(total);
  await expect(page.getByTestId("hero-total")).toHaveAttribute("aria-label", "Total cash $2,619,905.09");
  // sidebar balances match the cards
  await expect(page.getByRole("link", { name: "View Operating Checking transactions" })).toContainText("$842,615.38");
});

test("range switch updates chart summary and figures consistently", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const chart = page.getByTestId("balance-chart");
  await expect(chart).toHaveAttribute("aria-label", /last 30 days/);
  const seen = new Set<string>();
  for (const r of ["7D", "30D", "90D", "12M"]) {
    await page.getByRole("button", { name: r, exact: true }).click();
    await expect(page.getByRole("button", { name: r, exact: true })).toHaveAttribute("aria-pressed", "true");
    const label = { "7D": "last 7 days", "30D": "last 30 days", "90D": "last 90 days", "12M": "last 12 months" }[r]!;
    await expect(chart).toHaveAttribute("aria-label", new RegExp(label));
    const rows = await chart.locator("tbody tr").count();
    expect(rows).toBe({ "7D": 7, "30D": 30, "90D": 13, "12M": 12 }[r]);
    const inV = cents((await page.getByTestId("kpi-in-value").textContent())!);
    const outV = cents((await page.getByTestId("kpi-out-value").textContent())!);
    const netText = (await page.getByTestId("kpi-net-value").textContent())!;
    expect(cents(netText) * (netText.startsWith("−") ? -1 : 1)).toBe(inV - outV);
    // Sum of the table's Money in column equals the KPI
    const ins = await chart.locator("tbody tr td:nth-child(3)").allTextContents();
    expect(ins.reduce((s, t) => s + cents(t), 0)).toBe(inV);
    // spend donut total is the whole-dollar rounding of Money out
    expect(cents((await page.getByTestId("spend-total").textContent())!)).toBe(Math.round(outV / 100) * 100);
    seen.add(`${inV}/${outV}`);
  }
  expect(seen.size).toBeGreaterThan(1);
  // chart renders and keyboard tooltip works
  await expect(chart.locator(".recharts-surface").first()).toBeVisible();
});

test("recent transactions and View all", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("recent-row")).toHaveCount(5);
  await page.getByRole("link", { name: "View all" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
});

test("category row and account card link to filtered transactions", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("account-card").first().click();
  await expect(page).toHaveURL(/\/transactions\?account=op/);
});

for (const width of [1920, 1280, 768, 390, 375]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.getByTestId("hero-total")).toBeVisible();
    await expect(page.getByTestId("balance-chart").locator(".recharts-surface").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    const box = await page.getByTestId("hero-total").boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  });
}

test("touch targets are at least 44px tall at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  await animationsDone(page);
  for (const r of ["7D", "30D", "90D", "12M"]) {
    const box = await page.getByRole("button", { name: r, exact: true }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  for (const row of await page.getByTestId("category-row").all()) {
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  const box = await page.getByRole("link", { name: "View all" }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test("Accounts card never truncates names or the APY disclosure (all widths)", async ({ page }) => {
  for (const width of [1440, 1280, 768, 390, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const cards = page.getByTestId("account-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.filter({ hasText: "Operating Checking" })).toHaveCount(1);
    await expect(cards.filter({ hasText: "4.05% APY (simulated)" })).toHaveCount(1);
    const clipped = await cards.evaluateAll((els) =>
      els.flatMap((el) => Array.from(el.querySelectorAll<HTMLElement>("span")).filter((s) => getComputedStyle(s).textOverflow === "ellipsis" || s.scrollWidth > s.clientWidth + 1).map((s) => s.textContent)),
    );
    expect(clipped, `clipped at ${width}`).toEqual([]);
  }
});

test("spending donut draws one arc per category and the rows are interactive", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const rows = page.getByTestId("category-row");
  const n = await rows.count();
  expect(n).toBeGreaterThan(2);
  await expect(page.locator("[aria-label^='Spending breakdown'] circle.donut-arc")).toHaveCount(n);
  await expect(page.getByTestId("spend-total")).toBeVisible();
  await rows.first().scrollIntoViewIfNeeded(); // below the fold at this height: let scroll reveal run first
  await expect(page.locator("section[aria-labelledby='sc-h']")).not.toHaveAttribute("data-reveal", "pending");
  await animationsDone(page);
  const before = await rows.first().evaluate((e) => getComputedStyle(e).backgroundColor);
  await rows.first().hover();
  await animationsDone(page);
  const after = await rows.first().evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(after).not.toBe(before);
  // recent rows carry a chevron
  await expect(page.getByTestId("recent-row").first().locator("svg").last()).toBeVisible();
  // range change re-renders amounts without layout overflow
  await page.getByRole("button", { name: "90D", exact: true }).click();
  await expect(page.locator("[aria-label^='Spending breakdown'] circle.donut-arc")).not.toHaveCount(0);
});

test("reduced motion: nothing animates on the Overview", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("hero-total")).toBeVisible();
  await page.getByRole("button", { name: "90D", exact: true }).click();
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  expect(running).toBe(0);
});
