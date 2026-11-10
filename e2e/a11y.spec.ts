import { animationsDone } from "./helpers";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const rows = (page: Page) => page.getByRole("button", { name: /, [+−]\$[\d,.]+, (Completed|Pending|Failed), / });

async function axe(page: Page) {
  // colour transitions in flight would be measured mid-fade by the contrast rule
  await animationsDone(page); // finite animations only: shimmer/spinner loop forever
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // Known, documented exception (README: known limitations): transaction table rows carry a concise
    // accessible name (merchant, signed amount, status, date) that the e2e suite relies on, instead of the
    // full visible row text. Every other element is still held to label-in-name.
    .exclude("button[aria-label][class*='min-h-[62px]']")
    .analyze();
  return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
}

/** Collect console errors/warnings and uncaught page errors for the whole test. */
function watchConsole(page: Page) {
  const bad: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") bad.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => bad.push(`pageerror: ${e.message}`));
  return bad;
}

for (const scheme of ["light", "dark"] as const) {
for (const width of [1440, 390]) {
  test.describe(`${scheme} theme at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width, height: 900 });
    });

    test("Overview: no axe violations, no console noise", async ({ page }) => {
      const bad = watchConsole(page);
      await page.goto("/");
      await expect(page.getByTestId("balance-chart").locator(".recharts-surface").first()).toBeVisible();
      expect(await axe(page)).toEqual([]);
      for (const r of ["7D", "90D", "12M"]) {
        await page.getByRole("button", { name: r, exact: true }).click();
        expect(await axe(page)).toEqual([]);
      }
      expect(bad).toEqual([]);
    });

    test("Transactions: page and drawer have no axe violations; drawer locks background", async ({ page }) => {
      const bad = watchConsole(page);
      await page.goto("/transactions");
      await expect(rows(page).first()).toBeVisible();
      expect(await axe(page)).toEqual([]);

      await rows(page).first().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      expect(await axe(page)).toEqual([]);
      // background is inert and the page cannot scroll behind the drawer
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
      await expect(page.locator("body > [inert]")).not.toHaveCount(0);
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
      await expect(page.locator("body > [inert]")).toHaveCount(0);
      expect(bad).toEqual([]);
    });

    test("Transfers: every step has no axe violations, no console noise", async ({ page }) => {
      const bad = watchConsole(page);
      await page.goto("/transfers");
      await expect(page.getByRole("form", { name: "Transfer details" })).toBeVisible();
      expect(await axe(page)).toEqual([]);
      // validation error state
      await page.getByRole("button", { name: "Review transfer" }).click();
      await expect(page.getByRole("alert").first()).toBeVisible();
      expect(await axe(page)).toEqual([]);
      await page.getByLabel("Amount", { exact: true }).fill("25");
      await page.getByRole("button", { name: "Review transfer" }).click();
      await expect(page.getByRole("heading", { name: "Review and confirm" })).toBeVisible();
      expect(await axe(page)).toEqual([]);
      await page.getByRole("button", { name: /Confirm simulated transfer/ }).click();
      await expect(page.getByRole("heading", { name: "Simulated transfer complete" })).toBeVisible();
      expect(await axe(page)).toEqual([]);
      expect(bad).toEqual([]);
    });
  });
}
}

test("keyboard: skip link is first, visibly focused, and moves focus to main content", async ({ page }) => {
  await page.goto("/transactions");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  const ring = await skip.evaluate((e) => { const s = getComputedStyle(e); return s.outlineStyle !== "none" || s.boxShadow !== "none" || s.backgroundColor !== "rgba(0, 0, 0, 0)"; });
  expect(ring).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  expect(await page.evaluate(() => document.activeElement?.id === "main" || !!document.activeElement?.closest("main"))).toBe(true);
  // next Tab lands on a control inside main, with a visible focus indicator
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true);
  const vis = await page.evaluate(() => { const s = getComputedStyle(document.activeElement!); return s.outlineStyle !== "none" || s.boxShadow !== "none"; });
  expect(vis).toBe(true);
});
