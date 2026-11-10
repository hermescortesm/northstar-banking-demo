import { animationsDone } from "./helpers";
import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [1920, 1440, 1280, 768, 390, 375];
const ROUTES = ["/", "/transactions", "/transfers"];

async function settle(page: Page, route: string) {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await animationsDone(page);
}

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    test(`no overflow or clipped figures at ${width}px on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await settle(page, route);
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        // monetary figures: anything rendered with the tabular-number class or carrying data-cents
        // (the off-canvas mobile drawer is intentionally parked outside the viewport while closed)
        const figs = Array.from(document.querySelectorAll<HTMLElement>(".num, [data-cents]")).filter((e) => (e.offsetParent !== null || getComputedStyle(e).position === "fixed") && !(innerWidth <= 768 && e.closest("aside#sidebar")));
        const clipped = figs.filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== "inline").map((e) => e.textContent?.trim().slice(0, 30));
        const offscreen = figs.filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); }).map((e) => e.textContent?.trim().slice(0, 30));
        return { scrollWidth: de.scrollWidth, inner: innerWidth, clipped, offscreen, bodyScroll: document.body.scrollWidth };
      });
      expect(r.scrollWidth).toBeLessThanOrEqual(r.inner);
      expect(r.bodyScroll).toBeLessThanOrEqual(r.inner);
      expect(r.clipped).toEqual([]);
      expect(r.offscreen).toEqual([]);
    });
  }
}

for (const width of [390, 375]) {
  for (const route of ROUTES) {
    test(`primary controls are at least 44px tall on ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await settle(page, route);
      if (route === "/transactions") await expect(page.getByLabel("Search by merchant, description or reference")).toBeVisible();
      const small = await page.evaluate(() => {
        const sel = "main button, main select, main input:not([type=hidden]), main a[href], header button, header a[href], header input, nav a[href], nav button";
        return Array.from(document.querySelectorAll<HTMLElement>(sel))
          .filter((e) => {
            const cs = getComputedStyle(e);
            if (cs.visibility === "hidden" || cs.display === "none" || e.closest(".sr-only")) return false;
            const b = e.getBoundingClientRect();
            if (b.width === 0 || b.height === 0) return false;
            // skip links that sit inside running text / full-row link containers are fine; check anything standalone
            return true;
          })
          .map((e) => ({ el: `${e.tagName.toLowerCase()} "${(e.getAttribute("aria-label") ?? e.textContent ?? "").trim().slice(0, 40)}"`, h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width) }))
          .filter((x) => x.h < 44);
      });
      expect(small).toEqual([]);
      expect(await page.locator("main button:visible, main a:visible").count()).toBeGreaterThan(2);
    });
  }
}
