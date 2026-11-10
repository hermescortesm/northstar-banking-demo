import { expect, test, type Locator, type Page } from "@playwright/test";
import { animationsDone, revealAll } from "./helpers";

/** Scroll-triggered animation: a block below the fold stays un-animated until it is reached, once. */

const MOBILE = { width: 390, height: 844 };
const spending = (page: Page) => page.locator("section[aria-labelledby='sc-h']");
const recent = (page: Page) => page.locator("section[aria-labelledby='rt-h']");

/** Playback state of every animation inside an element (itself included). */
const playback = (el: Locator) =>
  el.evaluate((e) => e.getAnimations({ subtree: true }).filter((a) => a instanceof CSSAnimation).map((a) => ({ state: a.playState, t: Number(a.currentTime ?? 0) })));

const bringIntoView = (el: Locator) => el.evaluate((e) => e.scrollIntoView({ block: "center" }));

async function loadMobile(page: Page, height = MOBILE.height) {
  await page.setViewportSize({ width: MOBILE.width, height });
  await page.goto("/");
  await expect(page.getByTestId("hero-total")).toBeVisible();
  await page.waitForTimeout(700); // longer than the longest entrance, so "not running" cannot just mean "already finished"
}

test("mobile: Spending and Recent transactions wait below the fold, then animate once when reached", async ({ page }) => {
  await loadMobile(page);
  for (const card of [spending(page), recent(page)]) {
    expect(await card.evaluate((e) => e.getBoundingClientRect().top)).toBeGreaterThan(MOBILE.height);
    await expect(card).toHaveAttribute("data-reveal", "pending");
    // frozen at the first frame, not finished and not running
    const anims = await playback(card);
    expect(anims.length).toBeGreaterThan(3);
    expect(anims.filter((a) => !(a.state === "paused" && a.t === 0))).toEqual([]);
    // content is in the DOM and laid out, just not painted yet (opacity 0)
    expect(await card.evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
    expect((await card.boundingBox())!.height).toBeGreaterThan(100);
  }
  await expect(page.getByTestId("category-row").first()).toHaveText(/\$[\d,]+/);
  await expect(page.getByTestId("recent-row")).toHaveCount(5);

  const heightBefore = (await spending(page).boundingBox())!.height;
  await bringIntoView(spending(page));
  await expect(spending(page)).toHaveAttribute("data-reveal", "seen");
  await expect.poll(async () => (await playback(spending(page))).some((a) => a.state === "running")).toBe(true);
  // the group starts at the reveal moment, not at page load: no animation is already past its start
  expect((await playback(spending(page))).every((a) => a.t < 600)).toBe(true);

  await animationsDone(page);
  expect(await spending(page).evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  expect(await spending(page).evaluate((e) => getComputedStyle(e).transform)).toBe("none");
  for (const row of await page.getByTestId("category-row").all()) expect(await row.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  // donut arcs end fully drawn (dash length = the slice), centre total visible
  const arcs = await page.locator("circle.donut-arc").evaluateAll((els) => els.map((e) => getComputedStyle(e).strokeDasharray));
  expect(arcs.length).toBeGreaterThan(2);
  expect(arcs.every((d) => !d.startsWith("0px"))).toBe(true);
  expect(await page.locator(".donut-center").evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  expect(Math.abs((await spending(page).boundingBox())!.height - heightBefore)).toBeLessThan(1);

  // revealing happens once: scrolling away and back does not replay it
  await page.evaluate(() => window.scrollTo(0, 0));
  await bringIntoView(spending(page));
  expect((await playback(spending(page))).filter((a) => a.state === "running")).toHaveLength(0);

  await bringIntoView(recent(page));
  await expect(recent(page)).toHaveAttribute("data-reveal", "seen");
  await animationsDone(page);
  for (const row of await page.getByTestId("recent-row").all()) await expect(row).toBeVisible();
  expect(await recent(page).evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
});

test("mobile: Recent transactions subtitle keeps the account visible at 390 and 375", async ({ page }) => {
  for (const width of [390, 375]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const first = page.getByTestId("recent-row").first();
    await bringIntoView(first);
    const tail = first.getByText(/••\d{4}$/);
    const clipped = await tail.evaluate((e) => e.scrollWidth > e.clientWidth + 1);
    expect(clipped, `account clipped at ${width}`).toBe(false);
    const box = await tail.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }
});

test("mobile: chart mounts and draws only when it is reached", async ({ page }) => {
  await loadMobile(page, 480); // chart sits below the fold at this height
  const chart = page.getByTestId("balance-chart");
  expect(await chart.evaluate((e) => e.getBoundingClientRect().top)).toBeGreaterThan(480);
  await expect(chart.locator(".recharts-surface")).toHaveCount(0);
  const boxH = (await chart.boundingBox())!.height; // placeholder keeps the height: no layout shift when it mounts
  // keep the Total cash card's own entrance out of the way: the chart waits on its own
  await page.evaluate(() => {
    const w = window as unknown as { minClip: number };
    w.minClip = Infinity;
    const sample = () => {
      const widths = Array.from(document.querySelectorAll("clipPath rect")).map((r) => Number(r.getAttribute("width")));
      if (widths.length > 1) w.minClip = Math.min(w.minClip, ...widths.slice(1));
      requestAnimationFrame(sample);
    };
    sample();
    document.querySelector("[data-testid=balance-chart]")!.scrollIntoView({ block: "center" });
  });
  await expect(chart.locator(".recharts-surface")).toBeVisible();
  expect(Math.abs((await chart.boundingBox())!.height - boxH)).toBeLessThan(1);
  // the area's reveal clip starts (nearly) closed and grows to full width: it is drawing in, not pre-drawn
  await page.waitForTimeout(900);
  const minClip = await page.evaluate(() => (window as unknown as { minClip: number }).minClip);
  expect(minClip).toBeLessThan(120);
  const full = await chart.locator("clipPath rect").evaluateAll((els) => els.map((e) => Number(e.getAttribute("width"))));
  expect(Math.min(...full)).toBeGreaterThan(200);
});

test("desktop: blocks already on screen animate immediately, not held", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto("/");
  await expect(page.getByTestId("hero-total")).toBeVisible();
  await expect(page.locator("[data-reveal='pending']")).toHaveCount(0);
  await expect(page.getByTestId("balance-chart").locator(".recharts-surface")).toBeVisible();
});

test("range change inside a visible card still crossfades", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await animationsDone(page);
  await page.getByRole("button", { name: "90D", exact: true }).click();
  const state = await page.getByTestId("kpi-in-value").locator("span").evaluate((e) => e.getAnimations().map((a) => a.playState));
  expect(state).toContain("running");
});

test("reduced motion: below-fold blocks are visible at once and nothing is held", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await loadMobile(page, 480);
  await expect(page.locator("[data-reveal='pending']")).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).length)).toBe(0);
  for (const card of [spending(page), recent(page)]) expect(await card.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  await expect(page.getByTestId("balance-chart").locator(".recharts-surface")).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: MOBILE });
  test("all content is rendered and fully visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Good morning, Avery" })).toBeVisible();
    await page.waitForTimeout(1500); // server-rendered entrances finish on their own
    await expect(page.locator("[data-reveal='pending']")).toHaveCount(0);
    await expect(page.getByTestId("category-row").first()).toBeVisible();
    await expect(page.getByTestId("recent-row")).toHaveCount(5);
    for (const card of [spending(page), recent(page)]) {
      expect(await card.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
      for (const el of await card.locator(".enter, .pop, .donut-center").all()) expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    }
    const arcs = await page.locator("circle.donut-arc").evaluateAll((els) => els.map((e) => getComputedStyle(e).strokeDasharray));
    expect(arcs.length).toBeGreaterThan(2);
    expect(arcs.every((d) => !d.startsWith("0px"))).toBe(true);
  });
});

for (const scheme of ["light", "dark"] as const) {
  test(`no layout shift while scrolling and revealing the Overview (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await loadMobile(page);
    await page.evaluate(() => {
      const w = window as unknown as { cls: number };
      w.cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.cls += e.value;
      }).observe({ type: "layout-shift" });
    });
    await page.evaluate(async () => {
      for (let y = 0; y <= document.documentElement.scrollHeight; y += 220) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(800);
    await animationsDone(page);
    expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBe(0);
    await expect(page.locator("[data-reveal='pending']")).toHaveCount(0);
  });
}

test("Transactions and Transfers: rows and panels below the fold wait, then reveal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/transactions");
  const rows = page.getByRole("button", { name: /, [+−]\$[\d,.]+, (Completed|Pending|Failed), / });
  await expect(rows.first()).toBeVisible();
  await page.waitForTimeout(600);
  const last = rows.last();
  await expect(last).toHaveAttribute("data-reveal", "pending");
  expect((await playback(last)).every((a) => a.state === "paused" && a.t === 0)).toBe(true);
  await expect(rows.first()).toHaveAttribute("data-reveal", "in");
  await bringIntoView(last);
  await expect(last).toHaveAttribute("data-reveal", "seen");
  await animationsDone(page);
  expect(await last.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");

  await page.goto("/transfers");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(600);
  const panel = page.locator("section[aria-labelledby='rx-h']");
  await expect(panel).toHaveAttribute("data-reveal", "pending");
  expect(await panel.evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
  await bringIntoView(panel);
  await expect(panel).toHaveAttribute("data-reveal", "seen");
  await animationsDone(page);
  expect(await panel.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  await expect(panel.getByText("Recent transfers")).toBeVisible();
});

test("keyboard: Tab through Transactions rows at 390 never lands on a held row", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/transactions");
  const rows = page.getByRole("button", { name: /, [+−]\$[\d,.]+, (Completed|Pending|Failed), / });
  await expect(rows.first()).toBeVisible();
  await rows.first().focus();
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
    if (!/, [+−]\$/.test(label)) continue;
    const focused = page.locator(":focus");
    await expect(focused).not.toHaveAttribute("data-reveal", "pending");
    await animationsDone(page); // it fades in; once settled the focused row must be fully visible
    expect(await focused.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  }
});

test("short viewport: chart box leaves pending once reached and revealAll completes", async ({ page }) => {
  await loadMobile(page, 480);
  const box = page.getByTestId("balance-chart").locator("> div").last();
  await expect(box).toHaveAttribute("data-reveal", "pending");
  await revealAll(page);
  await expect(box).not.toHaveAttribute("data-reveal", "pending");
  await expect(page.locator("[data-reveal='pending']")).toHaveCount(0);
});
