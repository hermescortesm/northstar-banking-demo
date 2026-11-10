import { expect, test, type Page } from "@playwright/test";

const nav = (page: Page, name: string) => page.getByRole("navigation", { name: "Main" }).getByRole("link", { name, exact: true });
const rows = (page: Page) => page.getByRole("button", { name: /, [+−]\$[\d,.]+, (Completed|Pending|Failed), / });
const shownCount = async (page: Page) => {
  const t = (await page.getByText(/^Showing \d+–\d+ of /).textContent())!;
  return Number(t.replace(/^.* of /, "").replace(/,/g, ""));
};
const cents = (s: string) => Math.round(parseFloat(s.replace(/[^0-9.]/g, "")) * 100) * (/[−-]/.test(s.trim()[0]) ? -1 : 1);

async function overviewState(page: Page) {
  await nav(page, "Overview").click();
  await expect(page.getByTestId("hero-total")).toBeVisible();
  const total = Number(await page.getByTestId("hero-total").getAttribute("data-cents"));
  const cards = await page.getByTestId("account-card").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-cents"))));
  const sidebar = await page.locator("aside#sidebar").getByRole("link", { name: /^View .+ transactions$/ }).allInnerTexts();
  return { total, cards, sidebar };
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("a transfer shows up as two SIM rows in Transactions and moves balances everywhere, total cash unchanged", async ({ page }) => {
  await page.goto("/");
  const before = await overviewState(page);

  await nav(page, "Transactions").click();
  await expect(rows(page).first()).toBeVisible();
  const countBefore = await shownCount(page);

  await nav(page, "Transfers").click();
  await page.getByLabel("Amount", { exact: true }).fill("1234.56");
  await page.getByRole("button", { name: "Review transfer" }).click();
  await page.getByRole("button", { name: /Confirm simulated transfer/ }).click();
  await expect(page.getByRole("heading", { name: "Simulated transfer complete" })).toBeVisible();
  const ref = (await page.getByText(/Reference SIM-\d{4}/).first().textContent())!.match(/SIM-\d{4}/)![0];

  // Transactions: debit + credit, both labelled Simulated, both with the shared reference
  await nav(page, "Transactions").click();
  expect(await shownCount(page)).toBe(countBefore + 2);
  await page.getByLabel("Search by merchant, description or reference").fill(ref);
  await expect(rows(page)).toHaveCount(2);
  const names = await rows(page).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")!));
  expect(names.some((n) => n.includes("Transfer to") && n.includes("−$1,234.56"))).toBe(true);
  expect(names.some((n) => n.includes("Transfer from") && n.includes("+$1,234.56"))).toBe(true);
  for (const r of await rows(page).all()) await expect(r).toContainText("Simulated");

  // Overview: hero unchanged, exactly two cards moved by the amount, sidebar follows
  const after = await overviewState(page);
  expect(after.total).toBe(before.total);
  const deltas = after.cards.map((c, i) => c - before.cards[i]);
  expect(deltas.filter((d) => d === -123456)).toHaveLength(1);
  expect(deltas.filter((d) => d === 123456)).toHaveLength(1);
  expect(deltas.filter((d) => d === 0)).toHaveLength(1);
  expect(after.cards.reduce((a, b) => a + b, 0)).toBe(after.total);
  const sideDeltas = after.sidebar.map((t, i) => cents(t.match(/[−-]?\$[\d,]+\.\d{2}/)![0]) - cents(before.sidebar[i].match(/[−-]?\$[\d,]+\.\d{2}/)![0]));
  expect(sideDeltas.sort((a, b) => a - b)).toEqual([-123456, 0, 123456]);
  await expect(page.getByTestId("hero-total")).toHaveAttribute("aria-label", /^Total cash /);
});

test("Overview 'View all' opens the full list; account and category links open correctly filtered lists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "View all" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  const all = await shownCount(page);

  // category row -> category + range filters, count matches the same filter applied by hand
  await nav(page, "Overview").click();
  const row = page.getByTestId("category-row").first();
  const label = (await row.getAttribute("aria-label"))!.replace(/^View | transactions$/g, "");
  await row.click();
  await expect(page).toHaveURL(/\/transactions\?category=.+&range=30D/);
  await expect(page.getByLabel("Category")).toHaveValue(label);
  await expect(page.getByLabel("Date range")).toHaveValue("30D");
  const viaLink = await shownCount(page);
  expect(viaLink).toBeGreaterThan(0);
  expect(viaLink).toBeLessThan(all);

  await page.goto("/transactions");
  await page.getByLabel("Category").selectOption(label);
  await page.getByLabel("Date range").selectOption("30D");
  expect(await shownCount(page)).toBe(viaLink);

  // account card -> account filter
  await page.goto("/");
  await page.getByTestId("account-card").nth(1).click();
  await expect(page).toHaveURL(/\/transactions\?account=pr/);
  await expect(page.getByLabel("Account")).toHaveValue("pr");
  const n = await shownCount(page);
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(all);
});
