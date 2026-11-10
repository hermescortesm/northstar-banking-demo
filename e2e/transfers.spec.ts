import { expect, test, type Page } from "@playwright/test";

const toCents = (t: string) => Math.round(Number(t.replace(/[^0-9.-]/g, "").replace("−", "-")) * 100);

async function posted(page: Page, id: "op" | "pr" | "rs") {
  return toCents(await page.getByTestId(`bal-${id}`).locator('[data-role="posted"]').innerText());
}
async function allPosted(page: Page) {
  const [op, pr, rs] = [await posted(page, "op"), await posted(page, "pr"), await posted(page, "rs")];
  return { op, pr, rs, total: op + pr + rs };
}
const from = (page: Page, name: RegExp) => page.getByRole("group", { name: "Source account" }).getByRole("button", { name });
const to = (page: Page, name: RegExp) => page.getByRole("group", { name: "Destination account" }).getByRole("button", { name });
const amount = (page: Page) => page.getByLabel("Amount", { exact: true });
const review = (page: Page) => page.getByRole("button", { name: "Review transfer" });
const confirm = (page: Page) => page.getByRole("button", { name: /Confirm simulated transfer/ });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/transfers");
});

test("top-bar Transfer button goes to /transfers and the page is labeled simulated", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("link", { name: "Transfer", exact: true }).click();
  await expect(page).toHaveURL(/\/transfers$/);
  await expect(page.getByText("This is a simulated transfer.")).toBeVisible();
  await expect(page.getByRole("list", { name: "Transfer steps" })).toBeVisible();
});

test("happy path: review, confirm, balances change by the exact amount, total unchanged", async ({ page }) => {
  const before = await allPosted(page);
  await amount(page).fill("1250.5");
  await page.getByLabel(/^Note/).fill("Move to reserve");
  await review(page).click();

  await expect(page.getByRole("heading", { name: "Review and confirm" })).toBeFocused();
  await expect(page.getByText("$1,250.50").first()).toBeVisible();
  await expect(page.getByText("Instantly (simulated)")).toBeVisible();
  // review is not committed yet
  expect((await allPosted(page)).op).toBe(before.op);

  await confirm(page).click();
  await expect(page.getByRole("heading", { name: "Simulated transfer complete" })).toBeFocused();
  await expect(page.getByText(/Reference SIM-\d{4}/)).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Simulated transfer of $1,250.50 recorded" })).toBeVisible();

  const after = await allPosted(page);
  expect(after.op).toBe(before.op - 125050);
  expect(after.rs).toBe(before.rs + 125050);
  expect(after.pr).toBe(before.pr);
  expect(after.total).toBe(before.total);

  // recent transfers list shows the new outgoing leg, tagged Simulated
  const recent = page.getByRole("region", { name: "Recent transfers" });
  await expect(recent.getByRole("listitem").first()).toContainText("Transfer to Reserve");
  await expect(recent.getByRole("listitem").first()).toContainText("Simulated");
  await expect(recent.getByRole("listitem").first()).toContainText("−$1,250.50");

  // balances persist across client navigation (store in the root layout)
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Transactions" }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Transfers" }).click();
  const again = await allPosted(page);
  expect(again).toEqual(after);

  // a new transfer starts clean
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Transfers" }).click();
  await expect(page.getByRole("form", { name: "Transfer details" })).toBeVisible();
});

test("New transfer after success resets the form and applies a second, distinct transfer", async ({ page }) => {
  const before = await allPosted(page);
  for (const amt of ["10", "20"]) {
    await amount(page).fill(amt);
    await review(page).click();
    await confirm(page).click();
    await expect(page.getByRole("heading", { name: "Simulated transfer complete" })).toBeVisible();
    await page.getByRole("button", { name: "New transfer" }).click();
    await expect(amount(page)).toHaveValue("");
  }
  const after = await allPosted(page);
  expect(after.op).toBe(before.op - 3000);
  expect(after.rs).toBe(before.rs + 3000);
  await expect(page.getByRole("region", { name: "Recent transfers" }).getByRole("listitem")).toHaveCount(5);
});

test("validation: empty, bad format, zero, negative, precision", async ({ page }) => {
  const err = page.locator("#xf-amount-err");
  await review(page).click();
  await expect(err).toHaveText("Enter an amount.");
  await expect(amount(page)).toHaveAttribute("aria-invalid", "true");
  await expect(amount(page)).toHaveAttribute("aria-describedby", /xf-amount-err/);
  await expect(amount(page)).toBeFocused();
  await expect(page.getByRole("alert").filter({ hasText: "Fix the highlighted fields to continue." })).toBeVisible();

  const cases: [string, string][] = [
    ["abc", "Enter a dollar amount, like 1,250.00."],
    ["0", "Amount must be greater than $0.00."],
    ["-5", "Amount must be greater than $0.00."],
    ["12.345", "Use at most two decimal places, like 1,250.00."],
  ];
  for (const [value, message] of cases) {
    await amount(page).fill(value);
    await review(page).click();
    await expect(err).toHaveText(message);
  }
  // typing clears the error
  await amount(page).fill("5");
  await expect(err).toHaveCount(0);
  await expect(amount(page)).toHaveAttribute("aria-invalid", "false");
  // still on the form step
  await expect(page.getByRole("form", { name: "Transfer details" })).toBeVisible();
});

test("validation: insufficient funds is checked against the available balance", async ({ page }) => {
  const hint = await page.locator("#xf-amount-hint").innerText();
  const avail = hint.match(/\$[\d,]+\.\d{2}/)![0];
  const availCents = toCents(avail);
  await amount(page).fill("999,999,999.00");
  await review(page).click();
  await expect(page.locator("#xf-amount-err")).toHaveText(`Insufficient funds. Operating Checking has ${avail} available.`);
  // one cent over the available balance fails; exactly the available balance reaches review
  await amount(page).fill(String((availCents + 1) / 100));
  await review(page).click();
  await expect(page.locator("#xf-amount-err")).toContainText("Insufficient funds");
  await amount(page).fill(String(availCents / 100));
  await review(page).click();
  await expect(page.getByRole("heading", { name: "Review and confirm" })).toBeVisible();
});

test("validation: same account and missing accounts; swap", async ({ page }) => {
  await to(page, /Operating/).click();
  await amount(page).fill("5");
  await review(page).click();
  await expect(page.locator("#xf-to-err")).toHaveText("Choose a different account than the source.");
  await expect(to(page, /Operating/)).toBeFocused();

  await page.getByRole("button", { name: "Swap accounts" }).click();
  await expect(page.locator("#xf-to-err")).toHaveCount(0);
  await to(page, /Reserve/).click();
  await expect(to(page, /Reserve/)).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Swap accounts" }).click();
  await expect(from(page, /Reserve/)).toHaveAttribute("aria-pressed", "true");
  await expect(to(page, /Operating/)).toHaveAttribute("aria-pressed", "true");
});

test("validation: memo too long", async ({ page }) => {
  await amount(page).fill("5");
  await page.getByLabel(/^Note/).fill("x".repeat(61));
  await review(page).click();
  await expect(page.locator("#xf-memo-err")).toHaveText("Keep the note under 60 characters.");
  await expect(page.getByLabel(/^Note/)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel(/^Note/)).toBeFocused();
});

test("back/edit from review keeps the entered values and changes apply on re-review", async ({ page }) => {
  await amount(page).fill("100");
  await page.getByLabel(/^Note/).fill("first");
  await review(page).click();
  await page.getByRole("button", { name: "Edit details" }).click();
  await expect(amount(page)).toHaveValue("100.00");
  await expect(page.getByLabel(/^Note/)).toHaveValue("first");
  await amount(page).fill("200");
  await review(page).click();
  await expect(page.getByText("$200.00").first()).toBeVisible();
  const before = await allPosted(page);
  await confirm(page).click();
  await expect(page.getByRole("heading", { name: "Simulated transfer complete" })).toBeVisible();
  expect((await allPosted(page)).op).toBe(before.op - 20000);
});

test("double-click and Enter-twice on confirm apply exactly once", async ({ page }) => {
  const before = await allPosted(page);
  await amount(page).fill("75.25");
  await review(page).click();
  await confirm(page).dblclick();
  await expect(page.getByRole("heading", { name: "Simulated transfer complete" })).toBeVisible();
  let after = await allPosted(page);
  expect(after.op).toBe(before.op - 7525);
  expect(after.rs).toBe(before.rs + 7525);

  await page.getByRole("button", { name: "New transfer" }).click();
  await amount(page).fill("1");
  await review(page).click();
  const btn = confirm(page);
  await btn.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Simulated transfer complete" })).toBeVisible();
  after = await allPosted(page);
  expect(after.op).toBe(before.op - 7525 - 100);
  // two toasts at most, one per applied transfer
  await expect(page.getByRole("status").filter({ hasText: /Simulated transfer of \$1\.00 recorded/ })).toHaveCount(1);
});

test("confirm shows a disabled processing state while sending", async ({ page }) => {
  await amount(page).fill("5");
  await review(page).click();
  await confirm(page).click();
  const processing = page.getByRole("button", { name: "Processing…" });
  await expect(processing).toBeDisabled();
  await expect(processing).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("button", { name: "Edit details" })).toBeDisabled();
});

test("mobile 375: no overflow, 44px targets, full flow works", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/transfers");
  const noOverflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(await noOverflow()).toBe(true);
  for (const loc of [from(page, /Operating/), to(page, /Reserve/), review(page), page.getByRole("button", { name: "Swap accounts" })]) {
    expect((await loc.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  const before = await allPosted(page);
  await amount(page).fill("42");
  await review(page).click();
  expect(await noOverflow()).toBe(true);
  for (const loc of [confirm(page), page.getByRole("button", { name: "Edit details" })]) {
    expect((await loc.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await confirm(page).click();
  await expect(page.getByRole("heading", { name: "Simulated transfer complete" })).toBeVisible();
  expect(await noOverflow()).toBe(true);
  expect((await allPosted(page)).op).toBe(before.op - 4200);
  const toast = page.getByRole("status").filter({ hasText: "Simulated transfer of $42.00 recorded" });
  await expect(toast).toBeVisible();
  const box = (await toast.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
});
